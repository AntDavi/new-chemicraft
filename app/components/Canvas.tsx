// SVG interativo que renderiza o grafo molecular (átomos + ligações).
// Gerencia cliques (colocar átomo, criar ligação, selecionar), preview de
// ligação em andamento e delete via teclado. O drag dos átomos é encapsulado
// em AtomNode — Canvas apenas recebe onDragEnd para eventual cleanup futuro.

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMoleculeEditor } from './MoleculeEditor';
import { Bond, Atom } from '../lib/moleculeGraph';
import AtomNode from './AtomNode';
import BondEdge from './BondEdge';
import FormulaLabel from './FormulaLabel';

// ---------------------------------------------------------------------------
// Canvas principal
// ---------------------------------------------------------------------------

export default function Canvas() {
  const { state, dispatch } = useMoleculeEditor();
  const { graph, activeAtomSymbol, bondingFrom, selectedAtomId, zoom } = state;

  const svgRef = useRef<SVGSVGElement>(null);

  // Posição do mouse em coordenadas SVG — usado para o preview de ligação
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

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
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom],
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
  // Clique em área vazia do SVG
  // (átomos chamam e.stopPropagation(), então este handler só dispara no fundo)
  // -------------------------------------------------------------------------

  const handleSVGClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
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

  // -------------------------------------------------------------------------
  // Cursor contextual
  // -------------------------------------------------------------------------

  const cursor =
    activeAtomSymbol !== null ? 'crosshair' : bondingFrom !== null ? 'cell' : 'default';

  // Átomo de origem da ligação (para a linha de preview)
  const bondingAtom = bondingFrom ? graph.atoms.find((a) => a.id === bondingFrom) : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-zinc-900"
      onClick={handleSVGClick}
      onMouseMove={handleSVGMouseMove}
      onMouseLeave={() => setMousePos(null)}
      style={{ cursor }}
    >
      {/* Fundo clicável — garante que cliques em área vazia disparem onClick do SVG */}
      <rect width="100%" height="100%" fill="transparent" />

      <g transform={`scale(${zoom})`}>
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
            stroke="#a1a1aa"
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
            zoom={zoom}
            onClick={() => handleAtomClick(atom.id)}
            onDragEnd={() => {/* posição já atualizada via MOVE_ATOM em AtomNode */}}
          />
        ))}

        <FormulaLabel graph={graph} />
      </g>
    </svg>
  );
}
