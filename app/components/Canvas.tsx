// SVG interativo que renderiza o grafo molecular (átomos + ligações).
// Gerencia cliques, preview de ligação, delete via teclado e pan do canvas.
// Respeita o modo global: 'select' (selecionar + pan) | 'edit' (editar molécula).

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMoleculeEditor } from './MoleculeEditor';
import { getAvailableValence } from '../lib/valenceCalculator';
import { getConnectedComponents } from '../lib/moleculeGraph';
import AtomNode from './AtomNode';
import BondEdge from './BondEdge';
import FormulaLabel from './FormulaLabel';

// ---------------------------------------------------------------------------
// Canvas principal
// ---------------------------------------------------------------------------

export default function Canvas() {
  const { state, dispatch } = useMoleculeEditor();
  const { graph, mode, activeAtomSymbol, bondingFrom, selectedAtomId, selectedBondId, zoom, pan } = state;

  const svgRef = useRef<SVGSVGElement>(null);

  // Posição do mouse em coordenadas de conteúdo — usado para o preview de ligação
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Átomo atualmente sob o cursor (só usado durante o modo de ligação)
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);

  // Ref para detectar se o mousedown resultou em pan (evita disparar ações de click)
  const hasPannedRef = useRef(false);

  // -------------------------------------------------------------------------
  // Teclado: Delete/Backspace remove ligação ou átomo selecionado (modo edit),
  // Ctrl+Z desfaz, Ctrl+Shift+Z / Ctrl+Y refaz, I/Escape alternam o modo.
  // -------------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && mode === 'edit') {
        if (selectedBondId) {
          dispatch({ type: 'DELETE_BOND', bondId: selectedBondId });
          return;
        }
        if (selectedAtomId) {
          dispatch({ type: 'DELETE_ATOM', atomId: selectedAtomId });
          return;
        }
      }

      if (e.key === 'i' || e.key === 'I') {
        dispatch({ type: 'SET_MODE', mode: 'edit' });
        return;
      }

      if (e.key === 'Escape') {
        dispatch({ type: 'SET_MODE', mode: 'select' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAtomId, selectedBondId, mode, dispatch]);

  // -------------------------------------------------------------------------
  // Conversão de coordenadas tela → conteúdo (desconta pan e zoom)
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
  // Preview de ligação em andamento
  // -------------------------------------------------------------------------

  const handleSVGMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      setMousePos(toSVGCoords(e));
    },
    [toSVGCoords],
  );

  // -------------------------------------------------------------------------
  // Pan — inicia no mousedown do fundo do SVG
  // No modo select: sempre permite pan
  // No modo edit: só quando nenhuma ferramenta está ativa
  // -------------------------------------------------------------------------

  const handleSVGMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (mode === 'edit' && (activeAtomSymbol !== null || bondingFrom !== null)) return;

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
        dispatch({ type: 'SET_PAN', x: startPanX + dx, y: startPanY + dy });
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [mode, activeAtomSymbol, bondingFrom, pan.x, pan.y, dispatch],
  );

  // -------------------------------------------------------------------------
  // Clique em área vazia do SVG
  // -------------------------------------------------------------------------

  const handleSVGClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (hasPannedRef.current) {
        hasPannedRef.current = false;
        return;
      }

      if (mode === 'select') {
        dispatch({ type: 'DESELECT_ATOM' });
        return;
      }

      // Modo edit
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
    [mode, bondingFrom, activeAtomSymbol, dispatch, toSVGCoords],
  );

  // -------------------------------------------------------------------------
  // Clique em átomo
  // -------------------------------------------------------------------------

  const handleAtomClick = useCallback(
    (atomId: string) => {
      // Modo select: sempre seleciona / deseleciona
      if (mode === 'select') {
        if (selectedAtomId === atomId) {
          dispatch({ type: 'DESELECT_ATOM' });
        } else {
          dispatch({ type: 'SELECT_ATOM', atomId });
        }
        return;
      }

      // Modo edit: clicar num átomo inicia ligação; clicar em outro completa.
      // Repetir o gesto sobre o mesmo par promove simples → dupla → tripla.
      if (bondingFrom !== null) {
        if (bondingFrom === atomId) {
          dispatch({ type: 'CANCEL_BOND' });
        } else {
          dispatch({ type: 'COMPLETE_BOND', atomId });
        }
        return;
      }

      dispatch({ type: 'START_BOND', atomId });
    },
    [mode, bondingFrom, selectedAtomId, dispatch],
  );

  // -------------------------------------------------------------------------
  // Clique em ligação — seleciona/deseleciona para permitir apagar com Delete
  // -------------------------------------------------------------------------

  const handleBondClick = useCallback(
    (bondId: string) => {
      if (selectedBondId === bondId) {
        dispatch({ type: 'DESELECT_ATOM' });
      } else {
        dispatch({ type: 'SELECT_BOND', bondId });
      }
    },
    [selectedBondId, dispatch],
  );

  // -------------------------------------------------------------------------
  // Validade do alvo de ligação (feedback vermelho)
  // -------------------------------------------------------------------------

  const isBondTargetInvalid = useCallback(
    (atomId: string): boolean => {
      if (!bondingFrom || atomId === bondingFrom || hoveredAtomId !== atomId) return false;
      const existing = graph.bonds.find(
        (b) =>
          (b.fromId === bondingFrom && b.toId === atomId) ||
          (b.fromId === atomId && b.toId === bondingFrom),
      );
      // Tripla é o máximo — não há promoção possível
      if (existing?.type === 'triple') return true;
      // Criar ou promover sempre consome 1 de valência em cada átomo
      return (
        getAvailableValence(atomId, graph) < 1 ||
        getAvailableValence(bondingFrom, graph) < 1
      );
    },
    [bondingFrom, hoveredAtomId, graph],
  );

  // -------------------------------------------------------------------------
  // Cursor contextual
  // -------------------------------------------------------------------------

  const cursor =
    mode === 'select'
      ? 'default'
      : activeAtomSymbol !== null
      ? 'crosshair'
      : bondingFrom !== null
      ? 'cell'
      : 'grab';

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
      onContextMenu={(e) => e.preventDefault()}
      style={{
        cursor,
        backgroundColor: '#F5F0E8',
        backgroundImage: 'radial-gradient(circle, #C4BFB3 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Fundo clicável */}
      <rect width="100%" height="100%" fill="transparent" />

      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {/* Ligações */}
        {graph.bonds.map((bond) => {
          const from = graph.atoms.find((a) => a.id === bond.fromId);
          const to = graph.atoms.find((a) => a.id === bond.toId);
          if (!from || !to) return null;
          return (
            <BondEdge
              key={bond.id}
              bond={bond}
              fromAtom={from}
              toAtom={to}
              isSelected={bond.id === selectedBondId}
              onClick={() => handleBondClick(bond.id)}
            />
          );
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

        {getConnectedComponents(graph).map((component) => (
          <FormulaLabel
            key={component.atoms.map((a) => a.id).join('-')}
            graph={component}
          />
        ))}
      </g>
    </svg>
  );
}
