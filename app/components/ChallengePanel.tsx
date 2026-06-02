// Painel do desafio ativo: exibe nome, fórmula alvo e dificuldade do desafio,
// botão "Analisar" (desabilitado durante análise) e banner de celebração
// com botão "Próximo desafio" ao completar.

'use client';

import type { Challenge } from '../lib/challengeDatabase';
import type { ChallengeStatus } from './MoleculeEditor';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChallengePanelProps {
  challenge: Challenge;
  challengeStatus: ChallengeStatus;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onNewChallenge: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const difficultyConfig: Record<
  Challenge['difficulty'],
  { label: string; className: string }
> = {
  iniciante:     { label: 'Iniciante',     className: 'bg-green-100 text-green-700 border border-green-200' },
  intermediário: { label: 'Intermediário', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  avançado:      { label: 'Avançado',      className: 'bg-red-100   text-red-700   border border-red-200'   },
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function ChallengePanel({
  challenge,
  challengeStatus,
  isAnalyzing,
  onAnalyze,
  onNewChallenge,
}: ChallengePanelProps) {
  const completed = challengeStatus === 'completed';
  const diff = difficultyConfig[challenge.difficulty];

  return (
    <div
      className={`
        flex flex-col gap-3 p-4 rounded-xl border bg-white shadow-sm transition-all
        ${completed
          ? 'border-emerald-300 ring-2 ring-emerald-100'
          : 'border-stone-200'}
      `}
    >
      {/* ── Banner de celebração ─────────────────────────────────── */}
      {completed && (
        <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-emerald-50 border border-emerald-200 animate-pulse">
          <span className="text-3xl select-none">🎉</span>
          <p className="text-sm font-bold text-emerald-700 tracking-tight">
            Molécula correta!
          </p>
          <p className="text-xs text-emerald-600">
            Você construiu {challenge.name} com sucesso.
          </p>
        </div>
      )}

      {/* ── Informações do desafio ───────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {/* Badge de dificuldade */}
        <span
          className={`self-start px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${diff.className}`}
        >
          {diff.label}
        </span>

        {/* Nome */}
        <h3 className="text-sm font-bold text-stone-800 leading-tight">
          {challenge.name}
        </h3>

        {/* Fórmula */}
        <p className="text-xl font-mono font-bold text-stone-600 tracking-wider">
          {challenge.formula}
        </p>
      </div>

      {/* ── Ações ───────────────────────────────────────────────── */}
      {!completed ? (
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`
            w-full py-2 rounded-lg text-sm font-semibold transition-colors
            ${isAnalyzing
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-stone-800 text-white hover:bg-stone-700 active:bg-stone-900'}
          `}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              Analisando…
            </span>
          ) : (
            'Analisar'
          )}
        </button>
      ) : (
        <button
          onClick={onNewChallenge}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 transition-colors"
        >
          Próximo desafio →
        </button>
      )}
    </div>
  );
}
