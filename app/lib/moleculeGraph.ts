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

// Retorna cada grupo de átomos conectados como um subgrafo separado.
// Átomos isolados (sem ligações) formam componentes de tamanho 1.
export function getConnectedComponents(graph: MoleculeGraph): MoleculeGraph[] {
  if (graph.atoms.length === 0) return [];

  const visited = new Set<string>();
  const components: MoleculeGraph[] = [];

  for (const atom of graph.atoms) {
    if (visited.has(atom.id)) continue;

    const componentIds = new Set<string>();
    const queue = [atom.id];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (componentIds.has(id)) continue;
      componentIds.add(id);
      visited.add(id);

      for (const bond of graph.bonds) {
        if (bond.fromId === id && !componentIds.has(bond.toId)) queue.push(bond.toId);
        else if (bond.toId === id && !componentIds.has(bond.fromId)) queue.push(bond.fromId);
      }
    }

    components.push({
      atoms: graph.atoms.filter((a) => componentIds.has(a.id)),
      bonds: graph.bonds.filter((b) => componentIds.has(b.fromId) && componentIds.has(b.toId)),
    });
  }

  return components;
}
