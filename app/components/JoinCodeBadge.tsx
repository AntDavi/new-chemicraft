// Exibe o código de acesso de uma turma + botão de copiar, dentro de um card
// que é um link — Client Component necessário para impedir que o clique nessa
// área dispare a navegação do Link pai (stopPropagation/preventDefault).

'use client'

import { CopyButton } from '@/components/CopyButton'

export function JoinCodeBadge({ code }: { code: string }) {
  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span className="font-mono text-sm font-semibold tracking-widest bg-muted px-2 py-0.5 rounded">
        {code}
      </span>
      <CopyButton text={code} />
    </div>
  )
}
