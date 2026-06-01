// SVG interativo que renderiza o grafo molecular (átomos + ligações).
// Gerencia cliques (colocar átomo, criar ligação, selecionar), preview de
// ligação em andamento, delete via teclado e pan (arrastar fundo) do canvas.

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMoleculeEditor } from './MoleculeEditor';
import { Bond, Atom } from '../lib/moleculeGraph';
import { getAvailableValence, bondOrder } from '../lib/valenceCalculator';
import AtomNode from './AtomNode';
import BondEdge from './BondEdge';
import FormulaLabel from './FormulaLabel';

// ---------------------------------------------------------------------------
// Canvas principal
// ---------------------------------------------------------------------------

export default function Canvas() {
  const { state, dispatch } = useMoleculeEditor();
  const { graph, activeAtomSymbol, activeBondType, bondingFrom, selectedAtomId, zoom } = state;

  const svgRef = useRef<SVGSVGElement>(null);

  // Posição do mouse em coordenadas SVG — usado para o preview de ligação
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Átomo atualmente sob o cursor (só usado durante o modo de ligação)
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);

  // Pan do canvas — deslocamento em pixels SVG viewport
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Ref para detectar se o mousedown resultou em pan (evita disparar PLACE_ATOM / DESELECT_ATOM)
  const hasPannedRef = useRef(false);

  // -------------------------------------------------------------------------
  // Delete / Backspace — remove átomo selecionado
  // -------------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAtomId) {
        dispatch({ type: 'DELETE_ATOM', atomId: selectedAtomId });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAtomId, dispatch]);

  // -------------------------------------------------------------------------
  // Conversão de coordenadas tela → SVG (desconta zoom)
  // -------------------------------------------------------------------------

  const toSVGCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan],
  );

  // -------------------------------------------------------------------------
  // Preview de ligação em andamento — atualiza mousePos via onMouseMove do SVG
  // -------------------------------------------------------------------------

  const handleSVGMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      setMousePos(toSVGCoords(e));
    },
    [toSVGCoords],
  );

  // -------------------------------------------------------------------------
  // Pan — mousedown no fundo do SVG em modo padrão inicia pan
  // -------------------------------------------------------------------------

  const handleSVGMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Pan só acontece em modo padrão (sem átomo ativo, sem ligação em andamento)
      if (activeAtomSymbol !== null || bondingFrom !== null) return;

      hasPannedRef.current = false;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;

      const THRESHOLD = 4;

      function onMouseMove(ev: MouseEvent) {
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
        if (!hasPannedRef.current && Math.sqrt(dx * dx + dy * dy) < THRESHOLD) return;
        hasPannedRef.current = true;
        setPan({ x: startPanX + dx, y: startPanY + dy });
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [activeAtomSymbol, bondingFrom, pan.x, pan.y],
  );

  // -------------------------------------------------------------------------
  // Clique em área vazia do SVG
  // (átomos chamam e.stopPropagation(), então este handler só dispara no fundo)
  // -------------------------------------------------------------------------

  const handleSVGClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Se o mousedown resultou em pan, ignora o click
      if (hasPannedRef.current) {
        hasPannedRef.current = false;
        return;
      }

      const { x, y } = toSVGCoords(e);

      if (bondingFrom !== null) {
        dispatch({ type: 'CANCEL_BOND' });
        return;
      }

      if (activeAtomSymbol !== null) {
        dispatch({ type: 'PLACE_ATOM', symbol: activeAtomSymbol, x, y });
        return;
      }

      dispatch({ type: 'DESELECT_ATOM' });
    },
    [bondingFrom, activeAtomSymbol, dispatch, toSVGCoords],
  );

  // -------------------------------------------------------------------------
  // Clique em átomo — chamado pelo AtomNode via prop onClick
  // -------------------------------------------------------------------------

  const handleAtomClick = useCallback(
    (atomId: string) => {
      if (bondingFrom !== null) {
        if (bondingFrom === atomId) {
          dispatch({ type: 'CANCEL_BOND' });
        } else {
          dispatch({ type: 'COMPLETE_BOND', atomId });
        }
        return;
      }

      if (activeAtomSymbol !== null) {
        dispatch({ type: 'START_BOND', atomId });
        return;
      }

      if (selectedAtomId === atomId) {
        dispatch({ type: 'DESELECT_ATOM' });
      } else {
        dispatch({ type: 'SELECT_ATOM', atomId });
      }
    },
    [bondingFrom, activeAtomSymbol, selectedAtomId, dispatch],
  );

  // Retorna true se o átomo for um alvo inválido para a ligação em andamento
  const isBondTargetInvalid = useCallback(
    (atomId: string): boolean => {
      if (!bondingFrom || atomId === bondingFrom || hoveredAtomId !== atomId) return false;
      const order = bondOrder[activeBondType];
      return (
        getAvailableValence(atomId, graph) < order ||
        getAvailableValence(bondingFrom, graph) < order
      );
    },
    [bondingFrom, hoveredAtomId, activeBondType, graph],
  );

  // -------------------------------------------------------------------------
  // Cursor contextual
  // -------------------------------------------------------------------------

  const cursor =
    activeAtomSymbol !== null
      ? 'crosshair'
      : bondingFrom !== null
      ? 'cell'
      : 'grab';

  // Átomo de origem da ligação (para a linha de preview)
  const bondingAtom = bondingFrom ? graph.atoms.find((a) => a.id === bondingFrom) : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      onClick={handleSVGClick}
      onMouseDown={handleSVGMouseDown}
      onMouseMove={handleSVGMouseMove}
      onMouseLeave={() => setMousePos(null)}
      style={{
        cursor,
        backgroundColor: '#F5F0E8',
        backgroundImage: 'radial-gradient(circle, #C4BFB3 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Fundo clicável — garante que cliques em área vazia disparem onClick do SVG */}
      <rect width="100%" height="100%" fill="transparent" />

      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {/* Ligações */}
        {graph.bonds.map((bond) => {
          const from = graph.atoms.find((a) => a.id === bond.fromId);
          const to = graph.atoms.find((a) => a.id === bond.toId);
          if (!from || !to) return null;
          return <BondEdge key={bond.id} bond={bond} fromAtom={from} toAtom={to} />;
        })}

        {/* Preview de ligação em andamento */}
        {bondingAtom && mousePos && (
          <line
            x1={bondingAtom.x}
            y1={bondingAtom.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="5,4"
            pointerEvents="none"
          />
        )}

        {/* Átomos */}
        {graph.atoms.map((atom) => (
          <AtomNode
            key={atom.id}
            atom={atom}
            isSelected={atom.id === selectedAtomId}
            isBondingFrom={atom.id === bondingFrom}
            isInvalidBondTarget={isBondTargetInvalid(atom.id)}
            zoom={zoom}
            onClick={() => handleAtomClick(atom.id)}
            onDragEnd={() => {/* posição já atualizada via MOVE_ATOM em AtomNode */}}
            onMouseEnter={() => setHoveredAtomId(atom.id)}
            onMouseLeave={() => setHoveredAtomId(null)}
          />
        ))}

        <FormulaLabel graph={graph} />
      </g>
    </svg>
  );
}
