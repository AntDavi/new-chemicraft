// Calcula a valência usada e disponível de um átomo no grafo molecular.
// Depende de atomData (valências totais) e MoleculeGraph (ligações existentes).

import { atomData } from './atomData';
import { MoleculeGraph } from './moleculeGraph';

export const bondOrder: Record<'single' | 'double' | 'triple', number> = {
  single: 1,
  double: 2,
  triple: 3,
};

export function getUsedValence(atomId: string, graph: MoleculeGraph): number {
  return graph.bonds
    .filter((b) => b.fromId === atomId || b.toId === atomId)
    .reduce((sum, b) => sum + bondOrder[b.type], 0);
}

export function getAvailableValence(atomId: string, graph: MoleculeGraph): number {
  const atom = graph.atoms.find((a) => a.id === atomId);
  if (!atom) return 0;

  const data = atomData.find((d) => d.symbol === atom.symbol);
  if (!data) return 0;

  return data.valency - getUsedValence(atomId, graph);
}
