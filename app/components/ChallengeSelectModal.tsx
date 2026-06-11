// Modal de seleção de desafios. Lista todos os desafios agrupados por dificuldade.
// Ao clicar em "Iniciar", despacha START_CHALLENGE e fecha o modal.

'use client';

import { challenges } from '../lib/challengeDatabase';
import type { Challenge } from '../lib/challengeDatabase';
import { useMoleculeEditor } from './MoleculeEditor';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChallengeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const difficultyOrder: Challenge['difficulty'][] = [
  'iniciante',
  'intermediário',
  'avançado',
];

const difficultyConfig: Record<
  Challenge['difficulty'],
  { label: string; badgeClass: string; headingClass: string }
> = {
  iniciante:     { label: 'Iniciante',     badgeClass: 'bg-green-100 text-green-700 border border-green-200',  headingClass: 'text-green-700' },
  intermediário: { label: 'Intermediário', badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',  headingClass: 'text-amber-700' },
  avançado:      { label: 'Avançado',      badgeClass: 'bg-red-100   text-red-700   border border-red-200',    headingClass: 'text-red-700'   },
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function ChallengeSelectModal({ isOpen, onClose }: ChallengeSelectModalProps) {
  const { state, dispatch } = useMoleculeEditor();

  if (!isOpen) return null;

  function handleStart(challenge: Challenge) {
    dispatch({ type: 'START_CHALLENGE', challenge });
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Painel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-800">Escolha um desafio</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Construa a molécula correta no canvas para completar.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Lista agrupada por dificuldade */}
        <div className="flex flex-col gap-5 px-6 py-5">
          {difficultyOrder.map((difficulty) => {
            const group = challenges.filter((c) => c.difficulty === difficulty);
            if (group.length === 0) return null;
            const cfg = difficultyConfig[difficulty];

            return (
              <section key={difficulty}>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cfg.headingClass}`}>
                  {cfg.label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.map((challenge) => {
                    const isActive = state.activeChallenge?.id === challenge.id;
                    return (
                      <li
                        key={challenge.id}
                        className={`
                          flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors
                          ${isActive
                            ? 'bg-stone-800 border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'}
                        `}
                      >
                        {/* Info — a fórmula nunca é exibida: o aluno deve
                            descobri-la a partir do nome e das dicas */}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-stone-800'}`}>
                            {challenge.name}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isActive && (
                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
                              ativo
                            </span>
                          )}
                          <button
                            onClick={() => handleStart(challenge)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                              ${isActive
                                ? 'bg-white text-stone-800 hover:bg-stone-100'
                                : 'bg-stone-800 text-white hover:bg-stone-700 active:bg-stone-900'}
                            `}
                          >
                            {isActive ? 'Reiniciar' : 'Iniciar'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
