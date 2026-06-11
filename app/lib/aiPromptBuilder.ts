// Constrói o prompt enviado ao modelo de IA para análise da tentativa do aluno.
// Retorna uma string auto-contida com contexto do desafio, estado atual e
// instrução para responder em exatamente 3 frases em português.

import type { MoleculeGraph } from './moleculeGraph';
import type { Challenge } from './challengeDatabase';
import type { MoleculeDiff, BondType } from './moleculeComparator';

// ---------------------------------------------------------------------------
// Helpers de formatação
// ---------------------------------------------------------------------------

const bondTypeLabels: Record<BondType, string> = {
  single: 'simples',
  double: 'dupla',
  triple: 'tripla',
};

function bondTypeToPortuguese(type: BondType): string {
  return bondTypeLabels[type];
}

/** "2 H, 1 O, 1 N" a partir do array de átomos. */
function summarizeAtoms(atoms: MoleculeGraph['atoms']): string {
  const counts: Record<string, number> = {};
  for (const atom of atoms) {
    counts[atom.symbol] = (counts[atom.symbol] ?? 0) + 1;
  }
  const entries = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, count]) => `${count} ${symbol}`);
  return entries.length > 0 ? entries.join(', ') : 'nenhum átomo';
}

/** "3 simples, 1 dupla" a partir do array de ligações. */
function summarizeBonds(bonds: MoleculeGraph['bonds']): string {
  const counts: Record<BondType, number> = { single: 0, double: 0, triple: 0 };
  for (const bond of bonds) {
    counts[bond.type]++;
  }
  const parts: string[] = [];
  if (counts.single > 0) parts.push(`${counts.single} simples`);
  if (counts.double > 0) parts.push(`${counts.double} dupla${counts.double > 1 ? 's' : ''}`);
  if (counts.triple > 0) parts.push(`${counts.triple} tripla${counts.triple > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') : 'nenhuma ligação';
}

/**
 * Descreve o que o aluno acertou comparando o grafo atual com o diff.
 * Retorna "nada ainda" se não houver nenhum acerto parcial.
 */
function describeCorrectParts(
  current: MoleculeGraph,
  diff: MoleculeDiff,
): string {
  // Átomos corretos = símbolos presentes no atual que também estão no alvo,
  // no mínimo da quantidade esperada (ausentes do missingAtoms e wrongAtoms).
  const wrongSymbols = new Set([
    ...diff.wrongAtoms.map((a) => a.symbol),
    ...diff.missingAtoms.map((a) => a.symbol),
  ]);
  const extraSymbols = new Set(diff.extraAtoms.map((a) => a.symbol));

  // Conta átomos corretos: presentes no atual, não errados e não em excesso puro
  const correctAtomCounts: Record<string, number> = {};
  for (const atom of current.atoms) {
    if (!wrongSymbols.has(atom.symbol) && !extraSymbols.has(atom.symbol)) {
      correctAtomCounts[atom.symbol] = (correctAtomCounts[atom.symbol] ?? 0) + 1;
    }
  }

  // Ligações corretas = tipos não listados em missingBonds nem em wrongBondTypes
  const wrongBondTypeSet = new Set(diff.wrongBondTypes.map((w) => w.got));
  const missingBondTypeSet = new Set(diff.missingBonds.map((b) => b.type));
  const correctBondCounts: Record<BondType, number> = { single: 0, double: 0, triple: 0 };
  for (const bond of current.bonds) {
    if (!wrongBondTypeSet.has(bond.type) && !missingBondTypeSet.has(bond.type)) {
      correctBondCounts[bond.type]++;
    }
  }

  const parts: string[] = [];

  const atomEntries = Object.entries(correctAtomCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, count]) => `${count} ${symbol}`);
  if (atomEntries.length > 0) {
    parts.push(`átomos corretos: ${atomEntries.join(', ')}`);
  }

  const bondParts: string[] = [];
  if (correctBondCounts.single > 0)
    bondParts.push(`${correctBondCounts.single} simples`);
  if (correctBondCounts.double > 0)
    bondParts.push(`${correctBondCounts.double} dupla${correctBondCounts.double > 1 ? 's' : ''}`);
  if (correctBondCounts.triple > 0)
    bondParts.push(`${correctBondCounts.triple} tripla${correctBondCounts.triple > 1 ? 's' : ''}`);
  if (bondParts.length > 0) {
    parts.push(`ligações corretas: ${bondParts.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('; ') : 'nada ainda';
}

/**
 * Descreve os erros do diff em ordem decrescente de gravidade:
 * 1. Elementos errados  2. Tipos de ligação errados
 * 3. Átomos faltando/sobrando  4. Ligações faltando
 */
function describeErrors(diff: MoleculeDiff): string {
  const lines: string[] = [];

  if (diff.wrongAtoms.length > 0) {
    const list = diff.wrongAtoms
      .map((a) => `${a.count} ${a.symbol}`)
      .join(', ');
    lines.push(`Elementos que não pertencem a esta molécula: ${list}`);
  }

  if (diff.wrongBondTypes.length > 0) {
    const list = diff.wrongBondTypes
      .map(
        (w) =>
          `${w.count} ligação(ões) ${bondTypeToPortuguese(w.got)} onde era esperada(s) ${bondTypeToPortuguese(w.expected)}`,
      )
      .join('; ');
    lines.push(`Tipos de ligação incorretos: ${list}`);
  }

  if (diff.missingAtoms.length > 0) {
    const list = diff.missingAtoms
      .map((a) => `${a.count} ${a.symbol}`)
      .join(', ');
    lines.push(`Átomos faltando: ${list}`);
  }

  if (diff.extraAtoms.length > 0) {
    const list = diff.extraAtoms
      .map((a) => `${a.count} ${a.symbol} a mais`)
      .join(', ');
    lines.push(`Átomos em excesso: ${list}`);
  }

  if (diff.missingBonds.length > 0) {
    const list = diff.missingBonds
      .map((b) => `${b.count} ${bondTypeToPortuguese(b.type)}`)
      .join(', ');
    lines.push(`Ligações faltando: ${list}`);
  }

  // Erro puramente estrutural: contagens certas mas conectividade errada
  if (
    lines.length === 0 &&
    !diff.isCorrect
  ) {
    lines.push(
      'A composição está correta, mas os átomos estão conectados de forma errada.',
    );
  }

  return lines.length > 0 ? lines.join('\n- ') : 'nenhum erro detectado';
}

// ---------------------------------------------------------------------------
// Função principal
// ---------------------------------------------------------------------------

/**
 * Constrói o prompt completo para análise da tentativa do aluno.
 *
 * O retorno é uma string pronta para ser enviada como mensagem ao modelo.
 * O modelo deve responder em exatamente 3 frases em português:
 *   1. Reforçar o que está certo.
 *   2. Apontar o erro principal.
 *   3. Dar uma dica sem entregar a resposta.
 */
export function buildAnalysisPrompt(
  challenge: Challenge,
  currentGraph: MoleculeGraph,
  diff: MoleculeDiff,
): string {
  const correctParts = describeCorrectParts(currentGraph, diff);
  const errors = describeErrors(diff);

  const currentAtomSummary = summarizeAtoms(currentGraph.atoms);
  const currentBondSummary = summarizeBonds(currentGraph.bonds);

  return `\
Você é um tutor de química para estudantes do ensino médio. \
Sua missão é dar feedback encorajador que faça o aluno PENSAR — você dá pistas, nunca respostas.

═══════════════════════════════════════════
DESAFIO: ${challenge.name} — nível ${challenge.difficulty}
META: O aluno deve descobrir e construir a molécula ${challenge.name} por conta própria.
DICA INICIAL DO DESAFIO: "${challenge.initialHint}"
═══════════════════════════════════════════

ESTADO ATUAL DO ALUNO:
- Átomos desenhados: ${currentAtomSummary}
- Ligações desenhadas: ${currentBondSummary}

ANÁLISE INTERNA DA TENTATIVA (apenas para você — NUNCA revele estes dados ao aluno):
- O que está correto: ${correctParts}
- Erros encontrados:
- ${errors}

═══════════════════════════════════════════
INSTRUÇÃO OBRIGATÓRIA:
Responda em exatamente 3 frases em português, sem numeração, sem marcadores:

Frase 1 — Reforce de forma genérica o que o aluno acertou (sem citar quantidades exatas). Se não acertou nada ainda, seja encorajador sobre o esforço.
Frase 2 — Indique APENAS A REGIÃO do erro principal (ex.: "revise as ligações do átomo central", "observe os tipos de elementos usados"), sem dizer qual é a correção.
Frase 3 — Termine com uma pergunta ou pista conceitual que leve o aluno a raciocinar (ex.: lembrar a valência de um elemento), sem entregar o próximo passo.

REGRAS INVIOLÁVEIS:
- NUNCA revele a fórmula molecular nem quantos átomos de cada elemento a molécula tem.
- NUNCA diga quantos átomos ou ligações faltam, sobram ou devem ser adicionados/removidos.
- NUNCA dê instruções passo a passo (ex.: "adicione 2 H ao carbono").
- NUNCA cite os dados da análise interna literalmente; use-os apenas para escolher a pista.
- Não use mais de 3 frases. Seja breve.
═══════════════════════════════════════════`;
}
