// Barra inferior que exibe informações do átomo selecionado no canvas.
// Oculta por padrão (h-0); desliza para cima quando atomId é fornecido.
// Nunca deve ser exibida durante o modo de criação de ligações (bondingFrom !== null).

'use client';

import { atomData } from '../lib/atomData';
import { MoleculeGraph } from '../lib/moleculeGraph';
import { getAvailableValence, getUsedValence } from '../lib/valenceCalculator';

interface AtomInfoCardProps {
  atomId: string | null;
  graph: MoleculeGraph;
  onClose: () => void;
}

export default function AtomInfoCard({ atomId, graph, onClose }: AtomInfoCardProps) {
  const atom = atomId ? graph.atoms.find((a) => a.id === atomId) : null;
  const data = atom ? atomData.find((d) => d.symbol === atom.symbol) : null;

  const visible = atom !== null && data !== null;
  const availableValence = atom ? getAvailableValence(atomId!, graph) : 0;
  const usedValence = atom ? getUsedValence(atomId!, graph) : 0;
  const isOver = availableValence < 0;

  // Cor do dot de valência disponível
  const dotColor =
    availableValence > 0 ? '#3b82f6' : availableValence === 0 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={`overflow-hidden transition-all duration-200 ease-out ${
        visible ? 'h-16 opacity-100' : 'h-0 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 h-16 px-4 bg-white border-t border-stone-200
          transition-transform duration-200 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {atom && data && (
          <>
            {/* Círculo colorido com símbolo do átomo */}
            <div
              className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full
                text-stone-800 text-sm font-bold"
              style={{ backgroundColor: data.color }}
            >
              {atom.symbol}
            </div>

            {/* ELEMENTO */}
            <div className="flex flex-col min-w-[96px]">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
                Elemento
              </span>
              <span className="text-stone-800 text-sm font-semibold leading-tight">
                {data.name}
              </span>
              <span className="text-stone-400 text-[9px] font-mono leading-tight">
                id: {atom.id.slice(0, 8)}
              </span>
            </div>

            <div className="h-8 w-px bg-stone-200 shrink-0" />

            {/* VALÊNCIA TOTAL */}
            <div className="flex flex-col items-center min-w-[64px]">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
                Val. Total
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-stone-800 text-xl font-bold leading-none">
                  {data.valency}
                </span>
                <span className="text-stone-400 text-[9px] leading-none">ligações</span>
              </div>
            </div>

            <div className="h-8 w-px bg-stone-200 shrink-0" />

            {/* VALÊNCIA DISPONÍVEL */}
            <div className="flex flex-col items-center min-w-[72px]">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
                Val. Disp.
              </span>
              <div className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span
                  className={`text-xl font-bold leading-none ${
                    isOver ? 'text-red-500' : 'text-stone-800'
                  }`}
                >
                  {availableValence}
                </span>
                <span className="text-stone-400 text-[9px] leading-none">disp.</span>
              </div>
            </div>

            <div className="h-8 w-px bg-stone-200 shrink-0" />

            {/* SATURAÇÃO */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
                Saturação
              </span>
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: data.valency }).map((_, i) => {
                  const filled = i < Math.min(usedValence, data.valency);
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        filled
                          ? isOver
                            ? 'bg-red-400'
                            : 'bg-blue-500'
                          : 'bg-stone-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Botão fechar */}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="shrink-0 ml-1 w-6 h-6 flex items-center justify-center rounded
                text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors
                text-lg leading-none"
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
}
