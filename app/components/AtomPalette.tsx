// Paleta de átomos da sidebar esquerda. Renderiza um botão circular por átomo
// disponível no atomData. Gerencia estados visuais: ativo (anel), hover (zoom)
// e inativo. Exibe badge com a valência de cada átomo.

'use client';

import { atomData } from '../lib/atomData';
import { cn } from '../lib/utils';

interface AtomPaletteProps {
  activeSymbol: string | null;
  onSelect: (symbol: string) => void;
}

export default function AtomPalette({ activeSymbol, onSelect }: AtomPaletteProps) {
  return (
    <div className="flex flex-col items-center gap-2 pb-2">
      {atomData.map((atom) => {
        const isActive = atom.symbol === activeSymbol;

        return (
          <button
            key={atom.symbol}
            title={atom.name}
            onClick={() => onSelect(atom.symbol)}
            style={{ backgroundColor: atom.color }}
            className={cn(
              'relative flex size-10 cursor-pointer items-center justify-center rounded-full',
              'text-sm font-bold text-stone-800 select-none',
              'transition-all duration-150',
              'hover:scale-110 hover:brightness-95',
              isActive
                ? 'ring-2 ring-stone-600 ring-offset-2 ring-offset-white scale-110'
                : 'ring-0',
            )}
          >
            {atom.symbol}
            {/* Badge de valência */}
            <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-300 bg-white text-[8px] font-bold leading-none text-stone-500">
              {atom.valency}
            </span>
          </button>
        );
      })}
    </div>
  );
}
