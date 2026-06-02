// Painel de histórico de feedbacks da IA tutora.
// Exibe as mensagens mais recentes no topo, spinner durante análise
// e mensagem neutra quando não há feedbacks.

'use client';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIFeedbackPanelProps {
  feedback: string[];
  isAnalyzing: boolean;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function AIFeedbackPanel({ feedback, isAnalyzing }: AIFeedbackPanelProps) {
  const empty = feedback.length === 0 && !isAnalyzing;

  return (
    <div className="flex flex-col gap-2">
      {/* ── Cabeçalho ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-400">
          Tutor IA
        </span>
        {isAnalyzing && (
          <span className="inline-block w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* ── Estado vazio ─────────────────────────────────────────── */}
      {empty && (
        <p className="text-xs text-stone-400 italic">
          Construa a molécula e clique em Analisar.
        </p>
      )}

      {/* ── Skeleton de loading ───────────────────────────────────── */}
      {isAnalyzing && (
        <div className="flex flex-col gap-1.5 animate-pulse">
          <div className="h-3 rounded bg-stone-200 w-full" />
          <div className="h-3 rounded bg-stone-200 w-4/5" />
          <div className="h-3 rounded bg-stone-200 w-3/5" />
        </div>
      )}

      {/* ── Lista de feedbacks (mais recente no topo) ─────────────── */}
      {feedback.length > 0 && (
        <ol className="flex flex-col gap-2">
          {feedback.map((text, index) => {
            const isLatest = index === 0;
            return (
              <li
                key={index}
                className={`
                  rounded-lg px-3 py-2.5 text-xs leading-relaxed border
                  ${isLatest
                    ? 'bg-stone-50 border-stone-200 text-stone-700'
                    : 'bg-white border-stone-100 text-stone-400'}
                `}
              >
                {text}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
