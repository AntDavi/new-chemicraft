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
    <aside className="hidden sm:flex h-full w-16 flex-col border-r border-stone-200 bg-white shrink-0">
      {/* Seção átomos */}
      <div className="flex-1 overflow-y-auto">
        <p className="pt-3 pb-1 text-center text-[9px] font-semibold tracking-widest uppercase text-stone-400 select-none">
          Átomo
        </p>
        <AtomPalette
          activeSymbol={state.activeAtomSymbol}
          onSelect={handleAtomSelect}
        />
      </div>

      <hr className="mx-3 border-stone-200" />

      {/* Seção ligações */}
      <div>
        <p className="pt-3 pb-1 text-center text-[9px] font-semibold tracking-widest uppercase text-stone-400 select-none">
          Ligação
        </p>
        <BondToolbar
          activeBondType={state.activeBondType}
          onChange={handleBondChange}
        />
      </div>
    </aside>
  );
}
