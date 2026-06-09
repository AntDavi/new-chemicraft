// Componente raiz do editor de moléculas. Detém todo o estado via useReducer,
// expõe estado + dispatch via contexto e monta o layout completo da aplicação.

'use client';

import { createContext, useContext, useReducer, useRef, useCallback, useState, ReactNode } from 'react';

// crypto.randomUUID só existe em contextos seguros (HTTPS/localhost).
// Fallback para HTTP em rede local.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return generateId();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
import {
  createSession,
  logAction,
  logFeedback,
  completeSession,
} from '../lib/sessionLogger';
import {
  MoleculeGraph,
  addAtom,
  addBond,
  removeAtom,
} from '../lib/moleculeGraph';
import { getAvailableValence, bondOrder } from '../lib/valenceCalculator';
import type { Challenge } from '../lib/challengeDatabase';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import AtomInfoCard from './AtomInfoCard';
import BottomBar from './BottomBar';
import TopBar from './TopBar';
import ChallengeSelectModal from './ChallengeSelectModal';
import ChallengePanel from './ChallengePanel';
import AIFeedbackPanel from './AIFeedbackPanel';

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

export type BondType = 'single' | 'double' | 'triple';
export type EditorMode = 'select' | 'edit';
export type ChallengeStatus = 'idle' | 'active' | 'completed';

export interface EditorState {
  graph: MoleculeGraph;
  mode: EditorMode;
  activeAtomSymbol: string | null;
  activeBondType: BondType;
  bondingFrom: string | null;
  selectedAtomId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  // IA Tutora
  activeChallenge: Challenge | null;
  challengeStatus: ChallengeStatus;
  aiFeedback: string[];
  isAnalyzing: boolean;
}

const initialState: EditorState = {
  graph: { atoms: [], bonds: [] },
  mode: 'edit',
  activeAtomSymbol: null,
  activeBondType: 'single',
  bondingFrom: null,
  selectedAtomId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  // IA Tutora
  activeChallenge: null,
  challengeStatus: 'idle',
  aiFeedback: [],
  isAnalyzing: false,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'SET_MODE'; mode: EditorMode }
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
  | { type: 'SET_PAN'; x: number; y: number }
  | { type: 'CLEAR' }
  // IA Tutora
  | { type: 'START_CHALLENGE'; challenge: Challenge }
  | { type: 'REQUEST_ANALYSIS' }
  | { type: 'SET_AI_FEEDBACK'; feedback: string; isCorrect: boolean }
  | { type: 'COMPLETE_CHALLENGE' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        // Ao entrar em select, limpa ferramentas ativas
        activeAtomSymbol: action.mode === 'select' ? null : state.activeAtomSymbol,
        bondingFrom: action.mode === 'select' ? null : state.bondingFrom,
      };

    case 'SET_PAN':
      return { ...state, pan: { x: action.x, y: action.y } };

    case 'SET_ACTIVE_ATOM':
      return { ...state, activeAtomSymbol: action.symbol };

    case 'SET_BOND_TYPE':
      return { ...state, activeBondType: action.bondType };

    case 'PLACE_ATOM':
      return {
        ...state,
        graph: addAtom(state.graph, {
          id: generateId(),
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
          id: generateId(),
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

    // ── IA Tutora ────────────────────────────────────────────────────────────

    case 'START_CHALLENGE':
      return {
        ...initialState,
        // Preserva zoom/pan do estado atual para não desorientar o aluno
        zoom: state.zoom,
        pan: state.pan,
        activeChallenge: action.challenge,
        challengeStatus: 'active',
        aiFeedback: [action.challenge.initialHint],
        isAnalyzing: false,
      };

    case 'REQUEST_ANALYSIS':
      return { ...state, isAnalyzing: true };

    case 'SET_AI_FEEDBACK':
      return {
        ...state,
        // Feedback mais recente no topo
        aiFeedback: [action.feedback, ...state.aiFeedback],
        isAnalyzing: false,
        // Dispara conclusão automaticamente quando a API confirma acerto
        challengeStatus: action.isCorrect ? 'completed' : state.challengeStatus,
      };

    case 'COMPLETE_CHALLENGE':
      return { ...state, challengeStatus: 'completed' };

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
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);

  // AtomInfoCard só aparece no modo select e fora do modo de criação de ligações
  const infoAtomId =
    state.mode === 'select' && state.bondingFrom === null
      ? state.selectedAtomId
      : null;

  // Chama a API para marcar o desafio como concluído no banco
  async function handleComplete() {
    if (!state.activeChallenge) return;
    const res = await fetch('/api/complete-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: state.activeChallenge.id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Falha ao concluir desafio');
    }
  }

  // Chama a API de análise e despacha as actions correspondentes
  async function handleAnalyze() {
    if (!state.activeChallenge) return;
    dispatch({ type: 'REQUEST_ANALYSIS' });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: state.activeChallenge.id,
          currentGraph: state.graph,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      dispatch({ type: 'SET_AI_FEEDBACK', feedback: data.feedback, isCorrect: data.isCorrect });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao obter feedback.';
      dispatch({ type: 'SET_AI_FEEDBACK', feedback: message, isCorrect: false });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900">
      {/* Modal de seleção de desafios */}
      <ChallengeSelectModal
        isOpen={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
      />

      {/* Barra de topo */}
      <TopBar onOpenChallenges={() => setChallengeModalOpen(true)} />

      {/* Área principal: sidebar + canvas + painel direito (quando há desafio) */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />

        {/* Painel direito — visível somente quando activeChallenge !== null */}
        {state.activeChallenge && (
          <>
            {/* Desktop: coluna fixa ao lado do canvas */}
            <aside className="hidden md:flex flex-col w-72 shrink-0 border-l border-stone-200 bg-white overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <ChallengePanel
                  challenge={state.activeChallenge}
                  challengeStatus={state.challengeStatus}
                  isAnalyzing={state.isAnalyzing}
                  onAnalyze={handleAnalyze}
                  onComplete={handleComplete}
                  onNewChallenge={() => setChallengeModalOpen(true)}
                />
                <AIFeedbackPanel
                  feedback={state.aiFeedback}
                  isAnalyzing={state.isAnalyzing}
                />
              </div>
            </aside>

            {/* Mobile: overlay fixo sobre o canvas, ancorado à direita */}
            <aside className="md:hidden fixed right-0 top-10 bottom-16 w-72 z-40 border-l border-stone-200 bg-white overflow-y-auto shadow-xl">
              <div className="flex flex-col gap-4 p-4">
                <ChallengePanel
                  challenge={state.activeChallenge}
                  challengeStatus={state.challengeStatus}
                  isAnalyzing={state.isAnalyzing}
                  onAnalyze={handleAnalyze}
                  onComplete={handleComplete}
                  onNewChallenge={() => setChallengeModalOpen(true)}
                />
                <AIFeedbackPanel
                  feedback={state.aiFeedback}
                  isAnalyzing={state.isAnalyzing}
                />
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Barra inferior: AtomInfoCard (esquerda) + BottomBar (direita) */}
      <div className="flex">
        <div className="flex-1 overflow-hidden">
          <AtomInfoCard
            atomId={infoAtomId}
            graph={state.graph}
            onClose={() => dispatch({ type: 'DESELECT_ATOM' })}
          />
        </div>
        <BottomBar
          hasAtoms={state.graph.atoms.length > 0}
          zoom={state.zoom}
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

export default function MoleculeEditor({
  children,
  classroomId = null,
}: {
  children?: ReactNode;
  classroomId?: string | null;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // sessionIdRef guarda o ID da sessão ativa sem causar re-render
  const sessionIdRef = useRef<string | null>(null);

  // Wrap de dispatch: dispara o logging fire-and-forget antes/após cada action.
  // O reducer permanece puro — efeitos colaterais ficam aqui.
  const loggedDispatch = useCallback(
    (action: Action) => {
      dispatch(action);

      switch (action.type) {
        case 'START_CHALLENGE':
          sessionIdRef.current = null;
          // Cria a sessão em background; armazena o ID assim que resolver
          createSession(action.challenge.id, classroomId).then((id) => {
            sessionIdRef.current = id;
          });
          break;

        case 'PLACE_ATOM':
          logAction(sessionIdRef.current, 'place_atom', {
            symbol: action.symbol,
            x: action.x,
            y: action.y,
          });
          break;

        case 'COMPLETE_BOND':
          logAction(sessionIdRef.current, 'add_bond', { atomId: action.atomId });
          break;

        case 'DELETE_ATOM':
          logAction(sessionIdRef.current, 'delete_atom', { atomId: action.atomId });
          break;

        case 'SET_AI_FEEDBACK':
          logFeedback(sessionIdRef.current, action.feedback, 'manual');
          break;

        case 'COMPLETE_CHALLENGE':
          completeSession(sessionIdRef.current);
          break;
      }
    },
    [dispatch],
  );

  return (
    <MoleculeEditorContext.Provider value={{ state, dispatch: loggedDispatch }}>
      {children ?? <EditorLayout />}
    </MoleculeEditorContext.Provider>
  );
}
