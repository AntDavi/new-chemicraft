// Paleta de átomos da sidebar esquerda. Renderiza um botão circular por átomo
// disponível no atomData. Gerencia estados visuais: ativo (anel branco), hover
// (zoom + brilho) e inativo. Componente puramente apresentacional via props.

'use client';

import { atomData } from '../lib/atomData';
import { cn } from '../lib/utils';

interface AtomPaletteProps {
  activeSymbol: string | null;
  onSelect: (symbol: string) => void;
}

export default function AtomPalette({ activeSymbol, onSelect }: AtomPaletteProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {atomData.map((atom) => {
        const isActive = atom.symbol === activeSymbol;

        return (
          <button
            key={atom.symbol}
            title={atom.name}
            onClick={() => onSelect(atom.symbol)}
            style={{ backgroundColor: atom.color }}
            className={cn(
              'flex size-11 cursor-pointer items-center justify-center rounded-full',
              'text-sm font-bold text-white select-none',
              'transition-all duration-150',
              'hover:brightness-125 hover:scale-110',
              isActive
                ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110'
                : 'ring-0',
            )}
          >
            {atom.symbol}
          </button>
        );
      })}
    </div>
  );
}
