// Coluna lateral esquerda do editor. Exibe a AtomPalette (paleta de átomos).
// A criação de ligações não usa mais botões: clicar em dois átomos no canvas
// cria a ligação, e repetir o gesto promove simples → dupla → tripla.

'use client';

import { useMoleculeEditor } from './MoleculeEditor';
import AtomPalette from './AtomPalette';

export default function Sidebar() {
  const { state, dispatch } = useMoleculeEditor();
  const isSelectMode = state.mode === 'select';

  function handleAtomSelect(symbol: string) {
    const next = state.activeAtomSymbol === symbol ? null : symbol;
    dispatch({ type: 'SET_ACTIVE_ATOM', symbol: next });
  }

  return (
    <aside className="hidden sm:flex h-full w-16 flex-col border-r border-stone-200 bg-white shrink-0">
      {/* Seção átomos — desabilitada no modo select */}
      <div className={`flex-1 overflow-y-auto transition-opacity ${isSelectMode ? 'opacity-40 pointer-events-none' : ''}`}>
        <p className="pt-3 pb-1 text-center text-[9px] font-semibold tracking-widest uppercase text-stone-400 select-none">
          Átomo
        </p>
        <AtomPalette
          activeSymbol={state.activeAtomSymbol}
          onSelect={handleAtomSelect}
        />
      </div>
    </aside>
  );
}
