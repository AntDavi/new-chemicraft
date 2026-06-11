// Define as interfaces de desafio (Challenge, ChallengeAtom, ChallengeBond, TargetGraph)
// e exporta o array de desafios do MVP com grafos de conectividade completos (sem posições x/y).

import type { Bond } from './moleculeGraph';

// Átomo do desafio: igual a Atom mas sem posição SVG (x, y não fazem parte do alvo)
export interface ChallengeAtom {
  id: string;     // identificador local ao desafio (ex.: 'a1', 'a2')
  symbol: string; // símbolo químico: 'C', 'H', 'O', etc.
}

// Ligação do desafio: reutiliza a estrutura de Bond (não contém posição)
export type ChallengeBond = Bond;

// Grafo-alvo: conectividade pura, sem coordenadas
export interface TargetGraph {
  atoms: ChallengeAtom[];
  bonds: ChallengeBond[];
}

export type Difficulty = 'iniciante' | 'intermediário' | 'avançado';

export interface Challenge {
  id: string;
  name: string;
  formula: string;
  targetGraph: TargetGraph;
  initialHint: string;
  difficulty: Difficulty;
}

// ---------------------------------------------------------------------------
// Array de desafios do MVP
// ---------------------------------------------------------------------------

export const challenges: Challenge[] = [
  // -------------------------------------------------------------------------
  // H₂O — Água (iniciante)
  // Estrutura: O central com dois H ligados por ligações simples
  //   H–O–H
  // -------------------------------------------------------------------------
  {
    id: 'h2o',
    name: 'Água',
    formula: 'H₂O',
    difficulty: 'iniciante',
    initialHint: 'É a molécula mais famosa do planeta, feita de oxigênio e hidrogênio. Pense em quantas ligações cada um desses elementos consegue fazer.',
    targetGraph: {
      atoms: [
        { id: 'a1', symbol: 'O' },
        { id: 'a2', symbol: 'H' },
        { id: 'a3', symbol: 'H' },
      ],
      bonds: [
        { id: 'b1', fromId: 'a1', toId: 'a2', type: 'single' },
        { id: 'b2', fromId: 'a1', toId: 'a3', type: 'single' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // CH₄ — Metano (iniciante)
  // Estrutura: C central com quatro H ligados por ligações simples
  //       H
  //       |
  //   H–C–H
  //       |
  //       H
  // -------------------------------------------------------------------------
  {
    id: 'ch4',
    name: 'Metano',
    formula: 'CH₄',
    difficulty: 'iniciante',
    initialHint: 'É o hidrocarboneto mais simples que existe: um único carbono cercado por hidrogênios. A valência do carbono diz quantos cabem.',
    targetGraph: {
      atoms: [
        { id: 'a1', symbol: 'C' },
        { id: 'a2', symbol: 'H' },
        { id: 'a3', symbol: 'H' },
        { id: 'a4', symbol: 'H' },
        { id: 'a5', symbol: 'H' },
      ],
      bonds: [
        { id: 'b1', fromId: 'a1', toId: 'a2', type: 'single' },
        { id: 'b2', fromId: 'a1', toId: 'a3', type: 'single' },
        { id: 'b3', fromId: 'a1', toId: 'a4', type: 'single' },
        { id: 'b4', fromId: 'a1', toId: 'a5', type: 'single' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // NH₃ — Amônia (iniciante)
  // Estrutura: N central com três H ligados por ligações simples
  //   H–N–H
  //      |
  //      H
  // -------------------------------------------------------------------------
  {
    id: 'nh3',
    name: 'Amônia',
    formula: 'NH₃',
    difficulty: 'iniciante',
    initialHint: 'Base dos fertilizantes, é formada por um nitrogênio e alguns hidrogênios. A valência do nitrogênio é a chave.',
    targetGraph: {
      atoms: [
        { id: 'a1', symbol: 'N' },
        { id: 'a2', symbol: 'H' },
        { id: 'a3', symbol: 'H' },
        { id: 'a4', symbol: 'H' },
      ],
      bonds: [
        { id: 'b1', fromId: 'a1', toId: 'a2', type: 'single' },
        { id: 'b2', fromId: 'a1', toId: 'a3', type: 'single' },
        { id: 'b3', fromId: 'a1', toId: 'a4', type: 'single' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // CO₂ — Dióxido de Carbono (intermediário)
  // Estrutura: C central com duas ligações duplas para O
  //   O=C=O
  // -------------------------------------------------------------------------
  {
    id: 'co2',
    name: 'Dióxido de Carbono',
    formula: 'CO₂',
    difficulty: 'intermediário',
    initialHint: 'O gás do efeito estufa: só carbono e oxigênio, sem nenhum hidrogênio. Ligações simples não bastam para completar todas as valências.',
    targetGraph: {
      atoms: [
        { id: 'a1', symbol: 'C' },
        { id: 'a2', symbol: 'O' },
        { id: 'a3', symbol: 'O' },
      ],
      bonds: [
        { id: 'b1', fromId: 'a1', toId: 'a2', type: 'double' },
        { id: 'b2', fromId: 'a1', toId: 'a3', type: 'double' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // C₂H₆O — Etanol (intermediário)
  // Estrutura: cadeia CH₃–CH₂–O–H (todas as ligações simples)
  //
  //   H H
  //   | |
  // H–C–C–O–H
  //   | |
  //   H H
  //
  // a1=C(metil), a2=C(metileno), a3=O, a4=H(OH)
  // a5,a6,a7=H em a1 | a8,a9=H em a2
  // -------------------------------------------------------------------------
  {
    id: 'c2h6o',
    name: 'Etanol',
    formula: 'C₂H₆O',
    difficulty: 'intermediário',
    initialHint: 'É o álcool das bebidas: uma pequena cadeia de carbonos com um grupo –OH. Complete as valências que sobrarem com hidrogênios.',
    targetGraph: {
      atoms: [
        { id: 'a1', symbol: 'C' }, // CH3
        { id: 'a2', symbol: 'C' }, // CH2
        { id: 'a3', symbol: 'O' },
        { id: 'a4', symbol: 'H' }, // H do OH
        { id: 'a5', symbol: 'H' }, // H's do CH3
        { id: 'a6', symbol: 'H' },
        { id: 'a7', symbol: 'H' },
        { id: 'a8', symbol: 'H' }, // H's do CH2
        { id: 'a9', symbol: 'H' },
      ],
      bonds: [
        { id: 'b1', fromId: 'a1', toId: 'a2', type: 'single' }, // C–C
        { id: 'b2', fromId: 'a2', toId: 'a3', type: 'single' }, // C–O
        { id: 'b3', fromId: 'a3', toId: 'a4', type: 'single' }, // O–H
        { id: 'b4', fromId: 'a1', toId: 'a5', type: 'single' }, // CH3
        { id: 'b5', fromId: 'a1', toId: 'a6', type: 'single' },
        { id: 'b6', fromId: 'a1', toId: 'a7', type: 'single' },
        { id: 'b7', fromId: 'a2', toId: 'a8', type: 'single' }, // CH2
        { id: 'b8', fromId: 'a2', toId: 'a9', type: 'single' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // C₆H₁₂O₆ — Glicose (avançado)
  // Estrutura open-chain (forma aldeído):
  //
  //   O
  //   ‖
  //   C1–H
  //   |
  //   C2–OH   (H implícito em cada C)
  //   |
  //   C3–OH
  //   |
  //   C4–OH
  //   |
  //   C5–OH
  //   |
  //   C6–OH
  //   |
  //   H  H
  //
  // IDs: a1–a6 = carbonos C1–C6
  //      a7    = O do aldeído (C1=O, ligação dupla)
  //      a8–a12 = O dos grupos OH em C2–C6
  //      a13   = O do CH2OH (C6)
  //      a14   = H do aldeído (C1–H)
  //      a15–a19 = H dos OH em C2–C6
  //      a20   = H do OH em C6
  //      a21   = H em C2
  //      a22   = H em C3
  //      a23   = H em C4
  //      a24   = H em C5
  //      a25,a26 = dois H em C6
  // -------------------------------------------------------------------------
  {
    id: 'c6h12o6',
    name: 'Glicose',
    formula: 'C₆H₁₂O₆',
    difficulty: 'avançado',
    initialHint: 'É o açúcar que dá energia às células: uma cadeia de carbonos rica em grupos –OH, com um oxigênio em ligação dupla numa das pontas.',
    targetGraph: {
      atoms: [
        // Carbonos
        { id: 'a1',  symbol: 'C' }, // C1 (aldeído)
        { id: 'a2',  symbol: 'C' }, // C2
        { id: 'a3',  symbol: 'C' }, // C3
        { id: 'a4',  symbol: 'C' }, // C4
        { id: 'a5',  symbol: 'C' }, // C5
        { id: 'a6',  symbol: 'C' }, // C6
        // Oxigênios
        { id: 'a7',  symbol: 'O' }, // =O do aldeído em C1
        { id: 'a8',  symbol: 'O' }, // OH em C2
        { id: 'a9',  symbol: 'O' }, // OH em C3
        { id: 'a10', symbol: 'O' }, // OH em C4
        { id: 'a11', symbol: 'O' }, // OH em C5
        { id: 'a12', symbol: 'O' }, // OH em C6
        // Hidrogênios — H do CHO
        { id: 'a13', symbol: 'H' }, // H no C1
        // H dos grupos OH (C2–C6)
        { id: 'a14', symbol: 'H' }, // H do OH em C2
        { id: 'a15', symbol: 'H' }, // H do OH em C3
        { id: 'a16', symbol: 'H' }, // H do OH em C4
        { id: 'a17', symbol: 'H' }, // H do OH em C5
        { id: 'a18', symbol: 'H' }, // H do OH em C6
        // H dos carbonos da cadeia (C2–C5, um H cada)
        { id: 'a19', symbol: 'H' }, // H no C2
        { id: 'a20', symbol: 'H' }, // H no C3
        { id: 'a21', symbol: 'H' }, // H no C4
        { id: 'a22', symbol: 'H' }, // H no C5
        // H's do CH2OH (C6 tem dois H)
        { id: 'a23', symbol: 'H' }, // H1 no C6
        { id: 'a24', symbol: 'H' }, // H2 no C6
      ],
      bonds: [
        // Cadeia principal C1–C2–C3–C4–C5–C6
        { id: 'b1',  fromId: 'a1',  toId: 'a2',  type: 'single' },
        { id: 'b2',  fromId: 'a2',  toId: 'a3',  type: 'single' },
        { id: 'b3',  fromId: 'a3',  toId: 'a4',  type: 'single' },
        { id: 'b4',  fromId: 'a4',  toId: 'a5',  type: 'single' },
        { id: 'b5',  fromId: 'a5',  toId: 'a6',  type: 'single' },
        // C1=O (aldeído, ligação dupla)
        { id: 'b6',  fromId: 'a1',  toId: 'a7',  type: 'double' },
        // Grupos OH (C–O simples + O–H simples)
        { id: 'b7',  fromId: 'a2',  toId: 'a8',  type: 'single' },
        { id: 'b8',  fromId: 'a8',  toId: 'a14', type: 'single' },
        { id: 'b9',  fromId: 'a3',  toId: 'a9',  type: 'single' },
        { id: 'b10', fromId: 'a9',  toId: 'a15', type: 'single' },
        { id: 'b11', fromId: 'a4',  toId: 'a10', type: 'single' },
        { id: 'b12', fromId: 'a10', toId: 'a16', type: 'single' },
        { id: 'b13', fromId: 'a5',  toId: 'a11', type: 'single' },
        { id: 'b14', fromId: 'a11', toId: 'a17', type: 'single' },
        { id: 'b15', fromId: 'a6',  toId: 'a12', type: 'single' },
        { id: 'b16', fromId: 'a12', toId: 'a18', type: 'single' },
        // H no C1 (CHO)
        { id: 'b17', fromId: 'a1',  toId: 'a13', type: 'single' },
        // H nos carbonos da cadeia
        { id: 'b18', fromId: 'a2',  toId: 'a19', type: 'single' },
        { id: 'b19', fromId: 'a3',  toId: 'a20', type: 'single' },
        { id: 'b20', fromId: 'a4',  toId: 'a21', type: 'single' },
        { id: 'b21', fromId: 'a5',  toId: 'a22', type: 'single' },
        // Dois H em C6 (CH2OH)
        { id: 'b22', fromId: 'a6',  toId: 'a23', type: 'single' },
        { id: 'b23', fromId: 'a6',  toId: 'a24', type: 'single' },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // C₁₀H₂₀O — Mentol (avançado)
  // Estrutura: anel ciclohexano + OH + metil + isopropil (todas ligações simples)
  //
  // Anel: C1–C2–C3–C4–C5–C6–C1
  // C1: OH (a11=O, a21=H do OH) + H (a16)
  // C2: isopropil C7 (a7) + H (a17)
  //   C7: C8 (a8) + C9 (a9) + H (a22)
  //   C8: 3H (a23,a24,a25)
  //   C9: 3H (a26,a27,a28)
  // C3: H (a18) + H (a29)
  // C4: H (a19) + H (a30)
  // C5: metil C10 (a10) + H (a20)
  //   C10: 3H (a31,a32,a33)
  // C6: H (a34) + H (a35)
  // -------------------------------------------------------------------------
  {
    id: 'c10h20o',
    name: 'Mentol',
    formula: 'C₁₀H₂₀O',
    difficulty: 'avançado',
    initialHint: 'É o frescor da hortelã: um anel de carbonos com algumas ramificações e um único grupo –OH. Complete as valências com hidrogênios.',
    targetGraph: {
      atoms: [
        // Anel ciclohexano
        { id: 'a1',  symbol: 'C' }, // C1 — carrega OH
        { id: 'a2',  symbol: 'C' }, // C2 — carrega isopropil
        { id: 'a3',  symbol: 'C' }, // C3
        { id: 'a4',  symbol: 'C' }, // C4
        { id: 'a5',  symbol: 'C' }, // C5 — carrega metil
        { id: 'a6',  symbol: 'C' }, // C6
        // Isopropil
        { id: 'a7',  symbol: 'C' }, // C7 CH do isopropil
        { id: 'a8',  symbol: 'C' }, // C8 metila do isopropil
        { id: 'a9',  symbol: 'C' }, // C9 metila do isopropil
        // Metil em C5
        { id: 'a10', symbol: 'C' }, // C10
        // Oxigênio do OH
        { id: 'a11', symbol: 'O' },
        // Hidrogênios dos carbonos do anel
        { id: 'a12', symbol: 'H' }, // H em C1
        { id: 'a13', symbol: 'H' }, // H em C2
        { id: 'a14', symbol: 'H' }, // H1 em C3
        { id: 'a15', symbol: 'H' }, // H2 em C3
        { id: 'a16', symbol: 'H' }, // H1 em C4
        { id: 'a17', symbol: 'H' }, // H2 em C4
        { id: 'a18', symbol: 'H' }, // H em C5
        { id: 'a19', symbol: 'H' }, // H1 em C6
        { id: 'a20', symbol: 'H' }, // H2 em C6
        // H do OH
        { id: 'a21', symbol: 'H' },
        // H em C7 (isopropil CH)
        { id: 'a22', symbol: 'H' },
        // 3H em C8
        { id: 'a23', symbol: 'H' },
        { id: 'a24', symbol: 'H' },
        { id: 'a25', symbol: 'H' },
        // 3H em C9
        { id: 'a26', symbol: 'H' },
        { id: 'a27', symbol: 'H' },
        { id: 'a28', symbol: 'H' },
        // 3H em C10 (metil em C5)
        { id: 'a29', symbol: 'H' },
        { id: 'a30', symbol: 'H' },
        { id: 'a31', symbol: 'H' },
      ],
      bonds: [
        // Anel ciclohexano (C1–C2–C3–C4–C5–C6–C1)
        { id: 'b1',  fromId: 'a1',  toId: 'a2',  type: 'single' },
        { id: 'b2',  fromId: 'a2',  toId: 'a3',  type: 'single' },
        { id: 'b3',  fromId: 'a3',  toId: 'a4',  type: 'single' },
        { id: 'b4',  fromId: 'a4',  toId: 'a5',  type: 'single' },
        { id: 'b5',  fromId: 'a5',  toId: 'a6',  type: 'single' },
        { id: 'b6',  fromId: 'a6',  toId: 'a1',  type: 'single' },
        // OH em C1
        { id: 'b7',  fromId: 'a1',  toId: 'a11', type: 'single' },
        { id: 'b8',  fromId: 'a11', toId: 'a21', type: 'single' },
        // Isopropil em C2: C2–C7, C7–C8, C7–C9
        { id: 'b9',  fromId: 'a2',  toId: 'a7',  type: 'single' },
        { id: 'b10', fromId: 'a7',  toId: 'a8',  type: 'single' },
        { id: 'b11', fromId: 'a7',  toId: 'a9',  type: 'single' },
        // Metil em C5: C5–C10
        { id: 'b12', fromId: 'a5',  toId: 'a10', type: 'single' },
        // H nos carbonos do anel
        { id: 'b13', fromId: 'a1',  toId: 'a12', type: 'single' },
        { id: 'b14', fromId: 'a2',  toId: 'a13', type: 'single' },
        { id: 'b15', fromId: 'a3',  toId: 'a14', type: 'single' },
        { id: 'b16', fromId: 'a3',  toId: 'a15', type: 'single' },
        { id: 'b17', fromId: 'a4',  toId: 'a16', type: 'single' },
        { id: 'b18', fromId: 'a4',  toId: 'a17', type: 'single' },
        { id: 'b19', fromId: 'a5',  toId: 'a18', type: 'single' },
        { id: 'b20', fromId: 'a6',  toId: 'a19', type: 'single' },
        { id: 'b21', fromId: 'a6',  toId: 'a20', type: 'single' },
        // H no C7 do isopropil
        { id: 'b22', fromId: 'a7',  toId: 'a22', type: 'single' },
        // 3H em C8
        { id: 'b23', fromId: 'a8',  toId: 'a23', type: 'single' },
        { id: 'b24', fromId: 'a8',  toId: 'a24', type: 'single' },
        { id: 'b25', fromId: 'a8',  toId: 'a25', type: 'single' },
        // 3H em C9
        { id: 'b26', fromId: 'a9',  toId: 'a26', type: 'single' },
        { id: 'b27', fromId: 'a9',  toId: 'a27', type: 'single' },
        { id: 'b28', fromId: 'a9',  toId: 'a28', type: 'single' },
        // 3H em C10
        { id: 'b29', fromId: 'a10', toId: 'a29', type: 'single' },
        { id: 'b30', fromId: 'a10', toId: 'a30', type: 'single' },
        { id: 'b31', fromId: 'a10', toId: 'a31', type: 'single' },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retorna um desafio pelo id, ou undefined se não encontrado. */
export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}

/** Retorna os desafios filtrados por dificuldade. */
export function getChallengesByDifficulty(difficulty: Difficulty): Challenge[] {
  return challenges.filter((c) => c.difficulty === difficulty);
}
