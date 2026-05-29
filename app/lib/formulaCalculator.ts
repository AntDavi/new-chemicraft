// Calcula a fórmula molecular de um grafo no formato Hill notation com subscripts unicode.
// Hill notation: C primeiro, H segundo, demais elementos em ordem alfabética.

import { MoleculeGraph } from './moleculeGraph';

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

function toSubscript(n: number): string {
  return String(n).split('').map((d) => SUBSCRIPTS[d]).join('');
}

export function calculateFormula(graph: MoleculeGraph): string {
  if (graph.atoms.length === 0) return '';

  const counts = new Map<string, number>();
  for (const atom of graph.atoms) {
    counts.set(atom.symbol, (counts.get(atom.symbol) ?? 0) + 1);
  }

  const format = (symbol: string): string => {
    const count = counts.get(symbol)!;
    return symbol + (count > 1 ? toSubscript(count) : '');
  };

  const priority: string[] = [];
  if (counts.has('C')) priority.push('C');
  if (counts.has('H')) priority.push('H');

  const rest = [...counts.keys()]
    .filter((s) => s !== 'C' && s !== 'H')
    .sort();

  return [...priority, ...rest].map(format).join('');
}
