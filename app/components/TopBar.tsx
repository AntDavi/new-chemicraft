// Barra de topo. Exibe nome do app, modo de edição ativo e contadores de átomos/ligações.

'use client';

import { useMoleculeEditor } from './MoleculeEditor';
import { atomData } from '../lib/atomData';

export default function TopBar() {
  const { state } = useMoleculeEditor();
  const { graph, activeAtomSymbol, bondingFrom } = state;

  let modeText = 'livre';
  let modeDotColor = '#9ca3af';

  if (activeAtomSymbol !== null) {
    const data = atomData.find((d) => d.symbol === activeAtomSymbol);
    modeText = `posicionar ${data?.name.toLowerCase() ?? activeAtomSymbol}`;
    modeDotColor = data?.color ?? '#9ca3af';
  } else if (bondingFrom !== null) {
    modeText = 'criar ligação';
    modeDotColor = '#f59e0b';
  }

  return (
    <header className="flex items-center h-10 px-4 bg-white border-b border-stone-200 shrink-0 gap-3 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-stone-800 text-sm tracking-tight">Chemicraft</span>
        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-stone-100 border border-stone-200 rounded text-stone-500 uppercase">
          2D
        </span>
      </div>

      {/* Separador */}
      <div className="h-4 w-px bg-stone-200 shrink-0" />

      {/* Modo */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
          Modo:
        </span>
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: modeDotColor }}
        />
        <span className="text-stone-600 text-xs">{modeText}</span>
      </div>

      {/* Stats - empurradas para a direita */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-stone-400">
        <span>{graph.atoms.length} átomos</span>
        <span className="h-3 w-px bg-stone-300" />
        <span>{graph.bonds.length} ligações</span>
      </div>
    </header>
  );
}
