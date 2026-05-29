// Coluna lateral esquerda do editor. Compõe AtomPalette (topo) e BondToolbar (base)
// separados por um divisor. Conecta-se ao contexto global via useMoleculeEditor
// para ler e atualizar o átomo ativo e o tipo de ligação ativo.

'use client';

import { useMoleculeEditor } from './MoleculeEditor';
import AtomPalette from './AtomPalette';
import BondToolbar from './BondToolbar';
import { BondType } from './MoleculeEditor';

export default function Sidebar() {
  const { state, dispatch } = useMoleculeEditor();

  function handleAtomSelect(symbol: string) {
    const next = state.activeAtomSymbol === symbol ? null : symbol;
    dispatch({ type: 'SET_ACTIVE_ATOM', symbol: next });
  }

  function handleBondChange(bondType: BondType) {
    dispatch({ type: 'SET_BOND_TYPE', bondType });
  }

  return (
    <aside className="flex h-full w-14 flex-col border-r border-zinc-700 bg-zinc-800">
      <div className="flex-1 overflow-y-auto">
        <AtomPalette
          activeSymbol={state.activeAtomSymbol}
          onSelect={handleAtomSelect}
        />
      </div>

      <hr className="mx-2 border-zinc-600" />

      <BondToolbar
        activeBondType={state.activeBondType}
        onChange={handleBondChange}
      />
    </aside>
  );
}
