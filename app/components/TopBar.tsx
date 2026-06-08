// Barra de topo. Exibe nome do app, toggle de modo (select/edit),
// indicador do modo ativo e contadores de átomos/ligações.

'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useMoleculeEditor } from './MoleculeEditor';
import { atomData } from '../lib/atomData';
import { signOut, getUser } from '../lib/auth';

interface TopBarProps {
  onOpenChallenges?: () => void;
}

export default function TopBar({ onOpenChallenges }: TopBarProps) {
  const { state, dispatch } = useMoleculeEditor();
  const router = useRouter();
  const { graph, mode, activeAtomSymbol, bondingFrom } = state;

  async function handleSignOut() {
    // Só faz logout se houver sessão ativa; ignora silenciosamente caso contrário
    const user = await getUser();
    if (!user) return;
    await signOut();
    router.push('/login');
    router.refresh();
  }

  // Texto e cor do indicador de modo/ferramenta ativa
  let modeText = 'livre';
  let modeDotColor = '#9ca3af';

  if (activeAtomSymbol !== null) {
    const data = atomData.find((d) => d.symbol === activeAtomSymbol);
    modeText = `posicionar ${data?.name.toLowerCase() ?? activeAtomSymbol}`;
    modeDotColor = data?.color ?? '#9ca3af';
  } else if (bondingFrom !== null) {
    modeText = 'criar ligação';
    modeDotColor = '#f59e0b';
  } else if (mode === 'select') {
    modeText = 'selecionar';
    modeDotColor = '#3b82f6';
  }

  return (
    <header className="flex items-center h-10 px-4 bg-white border-b border-stone-200 shrink-0 gap-3 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-bold text-stone-800 text-sm tracking-tight">Chemicraft</span>
        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-stone-100 border border-stone-200 rounded text-stone-500 uppercase">
          2D
        </span>
      </div>

      {/* Separador */}
      <div className="h-4 w-px bg-stone-200 shrink-0" />

      {/* Toggle de modo */}
      <div className="flex items-center gap-0.5 bg-stone-100 rounded-md p-0.5 shrink-0">
        <button
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'select' })}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'select'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Selecionar
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'edit' })}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'edit'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Editar
        </button>
      </div>

      {/* Separador */}
      <div className="h-4 w-px bg-stone-200 shrink-0" />

      {/* Ferramenta ativa */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold tracking-widest uppercase text-stone-400">
          Modo:
        </span>
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: modeDotColor }}
        />
        <span className="text-stone-600 text-xs">{modeText}</span>
      </div>

      {/* Botão de desafios */}
      {onOpenChallenges && (
        <button
          onClick={onOpenChallenges}
          className={`
            flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors
            ${state.activeChallenge
              ? 'bg-stone-800 text-white hover:bg-stone-700'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'}
          `}
        >
          <span>Desafios</span>
          {state.activeChallenge && (
            <span className="text-[9px] font-bold tracking-widest uppercase text-stone-400">
              · ativo
            </span>
          )}
        </button>
      )}

      {/* Stats */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-stone-400 shrink-0">
        <span>{graph.atoms.length} átomos</span>
        <span className="h-3 w-px bg-stone-300" />
        <span>{graph.bonds.length} ligações</span>
      </div>

      {/* Separador */}
      <div className="h-4 w-px bg-stone-200 shrink-0" />

      {/* Logout */}
      <button
        onClick={handleSignOut}
        title="Sair da conta"
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
      >
        <LogOut className="size-3.5" />
        <span>Sair</span>
      </button>
    </header>
  );
}
