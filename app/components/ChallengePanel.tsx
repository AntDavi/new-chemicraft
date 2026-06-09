// Painel do desafio ativo: exibe nome, fórmula alvo e dificuldade do desafio,
// botão "Analisar" durante a tentativa, botão "Concluir desafio" ao acertar
// (salva no banco) e botão "Próximo desafio" após confirmação.

'use client';

import { useState, useEffect } from 'react';
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
  onComplete: () => Promise<void>;
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
  onComplete,
  onNewChallenge,
}: ChallengePanelProps) {
  const completed = challengeStatus === 'completed';
  const diff = difficultyConfig[challenge.difficulty];

  // Controla estado local pós-conclusão: false = mostra "Concluir", true = mostra "Próximo"
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Reseta ao trocar de desafio
  useEffect(() => {
    setSaved(false);
    setSaveError(false);
  }, [challenge.id]);

  async function handleComplete() {
    setIsSaving(true);
    setSaveError(false);
    try {
      await onComplete();
      setSaved(true);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

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
        <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
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
        <span
          className={`self-start px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${diff.className}`}
        >
          {diff.label}
        </span>
        <h3 className="text-sm font-bold text-stone-800 leading-tight">
          {challenge.name}
        </h3>
        <p className="text-xl font-mono font-bold text-stone-600 tracking-wider">
          {challenge.formula}
        </p>
      </div>

      {/* ── Ações ───────────────────────────────────────────────── */}
      {!completed && (
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
      )}

      {completed && !saved && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleComplete}
            disabled={isSaving}
            className={`
              w-full py-2 rounded-lg text-sm font-semibold transition-colors
              ${isSaving
                ? 'bg-emerald-300 text-white cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'}
            `}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Salvando…
              </span>
            ) : (
              'Concluir desafio'
            )}
          </button>
          {saveError && (
            <p className="text-xs text-red-600 text-center">
              Falha ao salvar. Tente novamente.
            </p>
          )}
        </div>
      )}

      {completed && saved && (
        <button
          onClick={onNewChallenge}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-stone-800 text-white hover:bg-stone-700 active:bg-stone-900 transition-colors"
        >
          Próximo desafio →
        </button>
      )}
    </div>
  );
}
