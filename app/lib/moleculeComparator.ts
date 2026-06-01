// Compara o grafo atual do usuário contra o grafo-alvo de um desafio.
// Nunca compara por posição (x/y) — apenas conectividade e tipos de átomo/ligação.
// Exporta a interface MoleculeDiff e a função compareMolecules.

import type { MoleculeGraph } from './moleculeGraph';
import type { TargetGraph } from './challengeDatabase';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type BondType = 'single' | 'double' | 'triple';

export interface MoleculeDiff {
  /** Símbolo correto mas em quantidade insuficiente (ex: precisa de 2 H, tem 1). */
  missingAtoms: { symbol: string; count: number }[];
  /** Símbolo correto mas em quantidade excessiva (ex: tem 3 H, alvo tem 2). */
  extraAtoms: { symbol: string; count: number }[];
  /** Símbolo que não existe no alvo — elemento errado usado na molécula. */
  wrongAtoms: { symbol: string; count: number }[];
  /** Tipo de ligação presente no alvo mas ausente/insuficiente no atual. */
  missingBonds: { type: BondType; count: number }[];
  /** Par (expected, got) quando o usuário usou o tipo de ligação errado. */
  wrongBondTypes: { expected: BondType; got: BondType; count: number }[];
  /** true somente quando composição, contagem de ligações e estrutura batem. */
  isCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Conta ocorrências de cada símbolo num array de átomos. */
function countBySymbol(
  atoms: Array<{ symbol: string }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const atom of atoms) {
    counts[atom.symbol] = (counts[atom.symbol] ?? 0) + 1;
  }
  return counts;
}

/** Conta ocorrências de cada tipo de ligação num array de bonds. */
function countByBondType(
  bonds: Array<{ type: BondType }>,
): Record<BondType, number> {
  const counts: Record<BondType, number> = { single: 0, double: 0, triple: 0 };
  for (const bond of bonds) {
    counts[bond.type]++;
  }
  return counts;
}

/**
 * Constrói o histograma de assinaturas de vizinhança do grafo.
 *
 * Para cada átomo, gera a chave:
 *   "symbol(vizA:tipoLig,vizB:tipoLig,...)"
 * onde os vizinhos são ordenados alfabeticamente para garantir
 * canonicidade independente de ordem de inserção.
 *
 * O histograma mapeia cada chave para o número de átomos com aquela
 * assinatura exata. Dois grafos estruturalmente equivalentes (sem
 * considerar posição) produzem histogramas idênticos.
 *
 * Funciona tanto para MoleculeGraph quanto para TargetGraph pois
 * ambos expõem { id, symbol } nos átomos e { fromId, toId, type } nas bonds.
 */
function buildSignatureHistogram(
  atoms: Array<{ id: string; symbol: string }>,
  bonds: Array<{ fromId: string; toId: string; type: BondType }>,
): Record<string, number> {
  const atomMap = new Map(atoms.map((a) => [a.id, a.symbol]));
  const histogram: Record<string, number> = {};

  for (const atom of atoms) {
    const neighborTokens = bonds
      .filter((b) => b.fromId === atom.id || b.toId === atom.id)
      .map((b) => {
        const neighborId = b.fromId === atom.id ? b.toId : b.fromId;
        const neighborSymbol = atomMap.get(neighborId) ?? '?';
        return `${neighborSymbol}:${b.type}`;
      })
      .sort(); // ordem canônica, independente de como o usuário desenhou

    const key = `${atom.symbol}(${neighborTokens.join(',')})`;
    histogram[key] = (histogram[key] ?? 0) + 1;
  }

  return histogram;
}

/** Verifica se dois histogramas de assinatura são idênticos. */
function histogramsMatch(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

/**
 * Compara o grafo desenhado pelo usuário (`current`) contra o grafo-alvo
 * do desafio (`target`).
 *
 * Nunca usa coordenadas (x/y) — a comparação é puramente topológica:
 * tipos de átomo, tipos de ligação e padrão de conectividade.
 */
export function compareMolecules(
  current: MoleculeGraph,
  target: TargetGraph,
): MoleculeDiff {
  // ── 1. Comparação de átomos por símbolo ──────────────────────────────────

  const currentCounts = countBySymbol(current.atoms);
  const targetCounts  = countBySymbol(target.atoms);

  const allSymbols = new Set([
    ...Object.keys(currentCounts),
    ...Object.keys(targetCounts),
  ]);

  const missingAtoms: MoleculeDiff['missingAtoms'] = [];
  const extraAtoms:   MoleculeDiff['extraAtoms']   = [];
  const wrongAtoms:   MoleculeDiff['wrongAtoms']   = [];

  for (const symbol of allSymbols) {
    const curr = currentCounts[symbol] ?? 0;
    const tgt  = targetCounts[symbol]  ?? 0;

    if (tgt > curr) {
      // Faltam unidades deste símbolo
      missingAtoms.push({ symbol, count: tgt - curr });
    } else if (curr > tgt) {
      if (tgt === 0) {
        // Símbolo não pertence ao alvo — elemento errado
        wrongAtoms.push({ symbol, count: curr });
      } else {
        // Símbolo correto mas em excesso
        extraAtoms.push({ symbol, count: curr - tgt });
      }
    }
  }

  // ── 2. Comparação de ligações por tipo ───────────────────────────────────

  const currentBondCounts = countByBondType(current.bonds);
  const targetBondCounts  = countByBondType(target.bonds);

  const bondTypes: BondType[] = ['single', 'double', 'triple'];

  const missingBonds: MoleculeDiff['missingBonds'] = [];

  // Excesso de cada tipo no grafo atual (serão emparelhados com os faltantes)
  const excessRemaining: Partial<Record<BondType, number>> = {};

  for (const type of bondTypes) {
    const curr = currentBondCounts[type];
    const tgt  = targetBondCounts[type];

    if (tgt > curr) {
      missingBonds.push({ type, count: tgt - curr });
    } else if (curr > tgt) {
      excessRemaining[type] = curr - tgt;
    }
  }

  // wrongBondTypes: emparelha cada tipo faltante com o tipo em excesso
  // (indica que o usuário usou o tipo errado de ligação)
  const wrongBondTypes: MoleculeDiff['wrongBondTypes'] = [];

  for (const missing of missingBonds) {
    for (const gotType of bondTypes) {
      if (gotType === missing.type) continue;

      const available = excessRemaining[gotType] ?? 0;
      if (available <= 0) continue;

      const matchCount = Math.min(missing.count, available);
      wrongBondTypes.push({ expected: missing.type, got: gotType, count: matchCount });
      excessRemaining[gotType] = available - matchCount;
    }
  }

  // ── 3. Verificação estrutural via histograma de vizinhança ───────────────
  //
  // Mesmo com contagens corretas, o usuário pode ter conectado os átomos
  // de forma errada (ex: O–O–H em vez de H–O–H).
  // O histograma de assinaturas detecta isso sem usar posições.

  const currentHist = buildSignatureHistogram(current.atoms, current.bonds);
  const targetHist  = buildSignatureHistogram(target.atoms,  target.bonds);
  const structurallyCorrect = histogramsMatch(currentHist, targetHist);

  // ── 4. isCorrect ─────────────────────────────────────────────────────────

  const isCorrect =
    missingAtoms.length  === 0 &&
    extraAtoms.length    === 0 &&
    wrongAtoms.length    === 0 &&
    missingBonds.length  === 0 &&
    wrongBondTypes.length === 0 &&
    structurallyCorrect;

  return {
    missingAtoms,
    extraAtoms,
    wrongAtoms,
    missingBonds,
    wrongBondTypes,
    isCorrect,
  };
}
