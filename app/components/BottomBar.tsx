// Barra inferior direita com controles de zoom (−/+), percentual atual e botão LIMPAR.
// LIMPAR solicita confirmação via window.confirm quando há átomos no grafo.

'use client';

interface BottomBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  hasAtoms: boolean;
  zoom: number;
}

export default function BottomBar({ onZoomIn, onZoomOut, onClear, hasAtoms, zoom }: BottomBarProps) {
  function handleClear() {
    if (hasAtoms && !window.confirm('Limpar toda a molécula?')) return;
    onClear();
  }

  return (
    <div className="flex items-center gap-1 px-2 h-16 bg-white border-t border-l border-stone-200 shrink-0">
      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        aria-label="Diminuir zoom"
        className="w-8 h-8 flex items-center justify-center rounded
          text-stone-500 hover:text-stone-800 hover:bg-stone-100
          active:bg-stone-200 transition-colors text-lg font-bold"
      >
        −
      </button>

      {/* Percentual */}
      <span className="min-w-[40px] text-center text-xs font-medium text-stone-500 select-none tabular-nums">
        {Math.round(zoom * 100)}%
      </span>

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        aria-label="Aumentar zoom"
        className="w-8 h-8 flex items-center justify-center rounded
          text-stone-500 hover:text-stone-800 hover:bg-stone-100
          active:bg-stone-200 transition-colors text-lg font-bold"
      >
        +
      </button>

      {/* Limpar */}
      <button
        onClick={handleClear}
        aria-label="Limpar canvas"
        className="ml-2 px-3 h-8 rounded text-xs font-semibold uppercase tracking-wide
          text-red-500 border border-red-200
          hover:bg-red-50 hover:text-red-600 hover:border-red-300
          active:bg-red-100
          transition-colors"
      >
        Limpar
      </button>
    </div>
  );
}
