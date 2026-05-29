// Define as interfaces do grafo molecular (Atom, Bond, MoleculeGraph) e exporta
// funções puras para manipulação do grafo: addAtom, addBond, removeAtom, removeBond.

export interface Atom {
  id: string;       // uuid gerado na criação
  symbol: string;   // 'C', 'H', 'O', etc.
  x: number;        // posição SVG
  y: number;
}

export interface Bond {
  id: string;
  fromId: string;
  toId: string;
  type: 'single' | 'double' | 'triple';
}

export interface MoleculeGraph {
  atoms: Atom[];
  bonds: Bond[];
}

export function addAtom(graph: MoleculeGraph, atom: Atom): MoleculeGraph {
  return { ...graph, atoms: [...graph.atoms, atom] };
}

export function addBond(graph: MoleculeGraph, bond: Bond): MoleculeGraph {
  return { ...graph, bonds: [...graph.bonds, bond] };
}

export function removeAtom(graph: MoleculeGraph, atomId: string): MoleculeGraph {
  return {
    atoms: graph.atoms.filter((a) => a.id !== atomId),
    bonds: graph.bonds.filter((b) => b.fromId !== atomId && b.toId !== atomId),
  };
}

export function removeBond(graph: MoleculeGraph, bondId: string): MoleculeGraph {
  return { ...graph, bonds: graph.bonds.filter((b) => b.id !== bondId) };
}
