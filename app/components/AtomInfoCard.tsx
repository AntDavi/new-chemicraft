// Barra inferior que exibe informações do átomo selecionado no canvas.
// Oculta por padrão (h-0); desliza para cima quando atomId é fornecido.
// Nunca deve ser exibida durante o modo de criação de ligações (bondingFrom !== null).

'use client';

import { atomData } from '../lib/atomData';
import { MoleculeGraph } from '../lib/moleculeGraph';
import { getAvailableValence } from '../lib/valenceCalculator';

interface AtomInfoCardProps {
  atomId: string | null;
  graph: MoleculeGraph;
}

export default function AtomInfoCard({ atomId, graph }: AtomInfoCardProps) {
  const atom = atomId ? graph.atoms.find((a) => a.id === atomId) : null;
  const data = atom ? atomData.find((d) => d.symbol === atom.symbol) : null;

  const visible = atom !== null && data !== null;
  const availableValence = atom ? getAvailableValence(atomId!, graph) : 0;
  const isSaturated = availableValence <= 0;

  return (
    // Wrapper anima a altura: h-0 (oculto) → h-14 (visível)
    <div
      className={`overflow-hidden transition-all duration-200 ease-out ${
        visible ? 'h-14 opacity-100' : 'h-0 opacity-0'
      }`}
    >
      {/* Conteúdo desliza para cima ao aparecer */}
      <div
        className={`flex items-center gap-4 h-14 px-4 border-t border-zinc-700 bg-zinc-800
          transition-transform duration-200 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {atom && data && (
          <>
            {/* Círculo colorido com símbolo do átomo */}
            <div
              className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full
                text-white text-sm font-bold"
              style={{ backgroundColor: data.color }}
            >
              {atom.symbol}
            </div>

            {/* Nome + id */}
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-100 text-sm font-medium leading-tight">
                {data.name}
              </span>
              <span className="text-zinc-500 text-xs font-mono truncate leading-tight">
                id: {atom.id}
              </span>
            </div>

            {/* Valências — empurradas para a direita */}
            <div className="ml-auto flex flex-col items-end shrink-0 gap-0.5">
              <span className="text-zinc-400 text-xs">
                valência total:{' '}
                <span className="text-zinc-200 font-semibold">{data.valency}</span>
              </span>
              <span className="text-xs text-zinc-400">
                valência disponível:{' '}
                <span
                  className={`font-semibold ${
                    isSaturated ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {availableValence}
                </span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
