// Seletor de tipo de ligação da sidebar esquerda. Renderiza três botões com
// representação visual SVG de linhas paralelas para cada tipo (single/double/triple).
// Componente puramente apresentacional via props.

'use client';

import { BondType } from './MoleculeEditor';
import { cn } from '../lib/utils';

interface BondToolbarProps {
  activeBondType: BondType;
  onChange: (type: BondType) => void;
}

const BOND_OPTIONS: { type: BondType; title: string; lines: number }[] = [
  { type: 'single', title: 'Ligação simples (I)', lines: 1 },
  { type: 'double', title: 'Ligação dupla (II)', lines: 2 },
  { type: 'triple', title: 'Ligação tripla (III)', lines: 3 },
];

function BondIcon({ lines }: { lines: number }) {
  const W = 28;
  const H = 28;
  const x1 = 4;
  const x2 = 24;
  const GAP = 5;
  const totalSpan = (lines - 1) * GAP;
  const startY = H / 2 - totalSpan / 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <line
          key={i}
          x1={x1}
          y1={startY + i * GAP}
          x2={x2}
          y2={startY + i * GAP}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default function BondToolbar({ activeBondType, onChange }: BondToolbarProps) {
  return (
    <div className="flex flex-col items-center gap-1 pb-3">
      {BOND_OPTIONS.map(({ type, title, lines }) => {
        const isActive = type === activeBondType;

        return (
          <button
            key={type}
            title={title}
            onClick={() => onChange(type)}
            className={cn(
              'flex size-10 cursor-pointer items-center justify-center rounded-md',
              'transition-all duration-150 select-none',
              isActive
                ? 'bg-stone-200 text-stone-700 ring-1 ring-stone-400'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600',
            )}
          >
            <BondIcon lines={lines} />
          </button>
        );
      })}
    </div>
  );
}
