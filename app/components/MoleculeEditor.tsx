// Componente raiz do editor de moléculas. Detém todo o estado via useReducer,
// expõe estado + dispatch via contexto e monta o layout completo da aplicação.

'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  MoleculeGraph,
  addAtom,
  addBond,
  removeAtom,
} from '../lib/moleculeGraph';
import { getAvailableValence, bondOrder } from '../lib/valenceCalculator';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import AtomInfoCard from './AtomInfoCard';
import BottomBar from './BottomBar';

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

export type BondType = 'single' | 'double' | 'triple';

export interface EditorState {
  graph: MoleculeGraph;
  activeAtomSymbol: string | null;
  activeBondType: BondType;
  bondingFrom: string | null;
  selectedAtomId: string | null;
  zoom: number;
}

const initialState: EditorState = {
  graph: { atoms: [], bonds: [] },
  activeAtomSymbol: null,
  activeBondType: 'single',
  bondingFrom: null,
  selectedAtomId: null,
  zoom: 1,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'SET_ACTIVE_ATOM'; symbol: string | null }
  | { type: 'SET_BOND_TYPE'; bondType: BondType }
  | { type: 'PLACE_ATOM'; symbol: string; x: number; y: number }
  | { type: 'START_BOND'; atomId: string }
  | { type: 'COMPLETE_BOND'; atomId: string }
  | { type: 'CANCEL_BOND' }
  | { type: 'SELECT_ATOM'; atomId: string }
  | { type: 'DESELECT_ATOM' }
  | { type: 'MOVE_ATOM'; atomId: string; x: number; y: number }
  | { type: 'DELETE_ATOM'; atomId: string }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'CLEAR' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_ACTIVE_ATOM':
      return { ...state, activeAtomSymbol: action.symbol };

    case 'SET_BOND_TYPE':
      return { ...state, activeBondType: action.bondType };

    case 'PLACE_ATOM':
      return {
        ...state,
        graph: addAtom(state.graph, {
          id: crypto.randomUUID(),
          symbol: action.symbol,
          x: action.x,
          y: action.y,
        }),
      };

    case 'START_BOND':
      return { ...state, bondingFrom: action.atomId, selectedAtomId: null };

    case 'COMPLETE_BOND': {
      if (!state.bondingFrom || state.bondingFrom === action.atomId) {
        return { ...state, bondingFrom: null };
      }
      // Ligação duplicada — não permitido no MVP
      const alreadyBonded = state.graph.bonds.some(
        (b) =>
          (b.fromId === state.bondingFrom && b.toId === action.atomId) ||
          (b.fromId === action.atomId && b.toId === state.bondingFrom),
      );
      if (alreadyBonded) return state;
      const order = bondOrder[state.activeBondType];
      if (
        getAvailableValence(state.bondingFrom, state.graph) < order ||
        getAvailableValence(action.atomId, state.graph) < order
      ) {
        // Valência insuficiente — ignora sem sair do modo de ligação
        return state;
      }
      return {
        ...state,
        bondingFrom: null,
        graph: addBond(state.graph, {
          id: crypto.randomUUID(),
          fromId: state.bondingFrom,
          toId: action.atomId,
          type: state.activeBondType,
        }),
      };
    }

    case 'CANCEL_BOND':
      return { ...state, bondingFrom: null };

    case 'SELECT_ATOM':
      return { ...state, selectedAtomId: action.atomId };

    case 'DESELECT_ATOM':
      return { ...state, selectedAtomId: null };

    case 'MOVE_ATOM':
      return {
        ...state,
        graph: {
          ...state.graph,
          atoms: state.graph.atoms.map((a) =>
            a.id === action.atomId ? { ...a, x: action.x, y: action.y } : a,
          ),
        },
      };

    case 'DELETE_ATOM':
      return {
        ...state,
        selectedAtomId:
          state.selectedAtomId === action.atomId ? null : state.selectedAtomId,
        graph: removeAtom(state.graph, action.atomId),
      };

    case 'ZOOM_IN':
      return { ...state, zoom: Math.min(ZOOM_MAX, +(state.zoom + ZOOM_STEP).toFixed(1)) };

    case 'ZOOM_OUT':
      return { ...state, zoom: Math.max(ZOOM_MIN, +(state.zoom - ZOOM_STEP).toFixed(1)) };

    case 'CLEAR':
      return { ...initialState };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface MoleculeEditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
}

const MoleculeEditorContext = createContext<MoleculeEditorContextValue | null>(null);

export function useMoleculeEditor(): MoleculeEditorContextValue {
  const ctx = useContext(MoleculeEditorContext);
  if (!ctx) throw new Error('useMoleculeEditor must be used inside MoleculeEditor');
  return ctx;
}

// ---------------------------------------------------------------------------
// Layout interno — conecta state/dispatch aos filhos
// ---------------------------------------------------------------------------

function EditorLayout() {
  const { state, dispatch } = useMoleculeEditor();

  // AtomInfoCard só aparece fora do modo de criação de ligações
  const infoAtomId = state.bondingFrom === null ? state.selectedAtomId : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Área principal: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
      </div>

      {/* Barra inferior: AtomInfoCard (esquerda) + BottomBar (direita) */}
      <div className="flex">
        <div className="flex-1 overflow-hidden">
          <AtomInfoCard atomId={infoAtomId} graph={state.graph} />
        </div>
        <BottomBar
          hasAtoms={state.graph.atoms.length > 0}
          onZoomIn={() => dispatch({ type: 'ZOOM_IN' })}
          onZoomOut={() => dispatch({ type: 'ZOOM_OUT' })}
          onClear={() => dispatch({ type: 'CLEAR' })}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

export default function MoleculeEditor({ children }: { children?: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <MoleculeEditorContext.Provider value={{ state, dispatch }}>
      {children ?? <EditorLayout />}
    </MoleculeEditorContext.Provider>
  );
}
