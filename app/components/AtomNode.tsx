// Sub-componente do Canvas. Renderiza um átomo como <circle> + <text> no SVG.
// Gerencia estados visuais (normal, selecionado, origem de ligação) e encapsula
// a lógica de drag: mousedown aqui, mousemove/mouseup registrados no SVG pai.

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

function svgCoordsFromEvent(e: MouseEvent, svg: SVGSVGElement, zoom: number) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom,
    y: (e.clientY - rect.top) / zoom,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AtomNodeProps {
  atom: Atom;
  isSelected: boolean;
  isBondingFrom: boolean;
  zoom: number;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function AtomNode({
  atom,
  isSelected,
  isBondingFrom,
  zoom,
  onClick,
  onDragEnd,
}: AtomNodeProps) {
  const { dispatch } = useMoleculeEditor();

  const hasDragged = useRef(false);
  const dragStart = useRef<{ clientX: number; clientY: number } | null>(null);

  // -------------------------------------------------------------------------
  // Drag — mousedown inicia; mousemove e mouseup ficam no SVG pai
  // -------------------------------------------------------------------------

  function handleMouseDown(e: React.MouseEvent<SVGGElement>) {
    e.preventDefault();
    e.stopPropagation();

    hasDragged.current = false;
    dragStart.current = { clientX: e.clientX, clientY: e.clientY };

    const svg = (e.currentTarget as SVGGElement).closest('svg') as SVGSVGElement | null;
    if (!svg) return;

    function onMouseMove(ev: MouseEvent) {
      if (!dragStart.current) return;

      // Só começa a mover após ultrapassar o threshold
      const dx = ev.clientX - dragStart.current.clientX;
      const dy = ev.clientY - dragStart.current.clientY;
      if (!hasDragged.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

      hasDragged.current = true;
      const { x, y } = svgCoordsFromEvent(ev, svg, zoom);
      dispatch({ type: 'MOVE_ATOM', atomId: atom.id, x, y });
    }

    function onMouseUp(ev: MouseEvent) {
      svg.removeEventListener('mousemove', onMouseMove);
      svg.removeEventListener('mouseup', onMouseUp);

      if (hasDragged.current) {
        const { x, y } = svgCoordsFromEvent(ev, svg, zoom);
        onDragEnd(x, y);
      }

      dragStart.current = null;
    }

    svg.addEventListener('mousemove', onMouseMove);
    svg.addEventListener('mouseup', onMouseUp);
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
  // Render
  // -------------------------------------------------------------------------

  const color = getAtomColor(atom.symbol);

  return (
    <g
      transform={`translate(${atom.x},${atom.y})`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'pointer' }}
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

      {/* Círculo principal */}
      <circle r={ATOM_RADIUS} fill={color} stroke="#1f2937" strokeWidth={1.5} />

      {/* Símbolo */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={atom.symbol.length > 1 ? 11 : 13}
        fontWeight="600"
        fill="#ffffff"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {atom.symbol}
      </text>
    </g>
  );
}
