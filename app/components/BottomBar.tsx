// Barra inferior direita com controles de zoom (−/+) e botão LIMPAR.
// LIMPAR solicita confirmação via window.confirm quando há átomos no grafo.

'use client';

interface BottomBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  hasAtoms: boolean;
}

export default function BottomBar({ onZoomIn, onZoomOut, onClear, hasAtoms }: BottomBarProps) {
  function handleClear() {
    if (hasAtoms && !window.confirm('Limpar toda a molécula?')) return;
    onClear();
  }

  return (
    <div className="flex items-center gap-1 px-2 h-14 bg-zinc-800 border-t border-l border-zinc-700 shrink-0">
      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        aria-label="Diminuir zoom"
        className="w-8 h-8 flex items-center justify-center rounded
          text-zinc-300 hover:text-white hover:bg-zinc-700
          active:bg-zinc-600 transition-colors text-lg font-bold"
      >
        −
      </button>

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        aria-label="Aumentar zoom"
        className="w-8 h-8 flex items-center justify-center rounded
          text-zinc-300 hover:text-white hover:bg-zinc-700
          active:bg-zinc-600 transition-colors text-lg font-bold"
      >
        +
      </button>

      {/* Limpar */}
      <button
        onClick={handleClear}
        aria-label="Limpar canvas"
        className="ml-1 px-3 h-8 rounded text-xs font-semibold uppercase tracking-wide
          text-red-400 border border-red-800
          hover:bg-red-900/40 hover:text-red-300 hover:border-red-600
          active:bg-red-900/60
          transition-colors"
      >
        Limpar
      </button>
    </div>
  );
}
