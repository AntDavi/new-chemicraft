// Sub-componente do Canvas. Renderiza um átomo como <circle> + <text> no SVG.
// Gerencia estados visuais e encapsula a lógica de drag (desabilitada no modo select).
// Usa pan e zoom do contexto global para calcular posições corretas ao arrastar.

'use client';

import { useRef } from 'react';
import { Atom } from '../lib/moleculeGraph';
import { atomData } from '../lib/atomData';
import { useMoleculeEditor } from './MoleculeEditor';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

export const ATOM_RADIUS = 18;

// Pixels de movimento antes de considerar a ação como arrasto (não clique)
const DRAG_THRESHOLD = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAtomColor(symbol: string): string {
  return atomData.find((d) => d.symbol === symbol)?.color ?? '#999999';
}

function svgCoordsFromEvent(
  e: MouseEvent,
  svg: SVGSVGElement,
  zoom: number,
  pan: { x: number; y: number },
) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - pan.x) / zoom,
    y: (e.clientY - rect.top - pan.y) / zoom,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AtomNodeProps {
  atom: Atom;
  isSelected: boolean;
  isBondingFrom: boolean;
  isInvalidBondTarget: boolean;
  zoom: number;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function AtomNode({
  atom,
  isSelected,
  isBondingFrom,
  isInvalidBondTarget,
  zoom,
  onClick,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}: AtomNodeProps) {
  const { dispatch, state } = useMoleculeEditor();
  const { mode, pan } = state;

  const hasDragged = useRef(false);
  const dragStart = useRef<{ clientX: number; clientY: number } | null>(null);

  // -------------------------------------------------------------------------
  // Drag — desabilitado no modo select
  // -------------------------------------------------------------------------

  function handleMouseDown(e: React.MouseEvent<SVGGElement>) {
    // No modo select, o drag de átomo é desabilitado
    if (mode === 'select') return;

    e.preventDefault();
    e.stopPropagation();

    hasDragged.current = false;
    dragStart.current = { clientX: e.clientX, clientY: e.clientY };

    const svgEl = (e.currentTarget as SVGGElement).closest('svg') as SVGSVGElement | null;
    if (!svgEl) return;

    // Captura svgEl como non-null para uso nas closures
    const svg: SVGSVGElement = svgEl;

    function onMouseMove(ev: MouseEvent) {
      if (!dragStart.current) return;

      const dx = ev.clientX - dragStart.current.clientX;
      const dy = ev.clientY - dragStart.current.clientY;
      if (!hasDragged.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

      hasDragged.current = true;
      const { x, y } = svgCoordsFromEvent(ev, svg, zoom, pan);
      dispatch({ type: 'MOVE_ATOM', atomId: atom.id, x, y });
    }

    function onMouseUp(ev: MouseEvent) {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasDragged.current) {
        const { x, y } = svgCoordsFromEvent(ev, svg, zoom, pan);
        onDragEnd(x, y);
      }

      dragStart.current = null;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // -------------------------------------------------------------------------
  // Click — ignorado se o mousedown resultou em arrasto
  // -------------------------------------------------------------------------

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasDragged.current) return;
    onClick();
  }

  // -------------------------------------------------------------------------
  // Botão direito — deleta o átomo (apenas modo edit)
  // -------------------------------------------------------------------------

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (mode !== 'edit') return;
    dispatch({ type: 'DELETE_ATOM', atomId: atom.id });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const color = getAtomColor(atom.symbol);

  return (
    <g
      transform={`translate(${atom.x},${atom.y})`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: mode === 'select' ? 'pointer' : 'pointer' }}
    >
      {/* Anel laranja tracejado — átomo é a origem de uma ligação em andamento */}
      {isBondingFrom && (
        <circle
          r={ATOM_RADIUS + 6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      )}

      {/* Anel azul sólido — átomo selecionado (AtomInfoCard aberto) */}
      {isSelected && !isBondingFrom && (
        <circle
          r={ATOM_RADIUS + 6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      )}

      {/* Anel vermelho sólido — alvo de ligação inválido por valência insuficiente */}
      {isInvalidBondTarget && (
        <circle
          r={ATOM_RADIUS + 6}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
        />
      )}

      {/* Círculo principal */}
      <circle r={ATOM_RADIUS} fill={color} stroke="#d1d5db" strokeWidth={1} />

      {/* Símbolo */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={atom.symbol.length > 1 ? 11 : 13}
        fontWeight="700"
        fill="#1f2937"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {atom.symbol}
      </text>
    </g>
  );
}
