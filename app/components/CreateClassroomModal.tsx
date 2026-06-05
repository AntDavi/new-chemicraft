// Modal de criação de turma: professor informa o nome e o join_code é gerado
// automaticamente com crypto.getRandomValues (A–Z + 0–9, 6 chars).

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getUser } from '@/lib/auth'
import { createBrowserClient } from '../../lib/supabase'

const JOIN_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateJoinCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((byte) => JOIN_CODE_CHARS[byte % JOIN_CODE_CHARS.length])
    .join('')
}

export function CreateClassroomModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setOpen(false)
    setName('')
    setError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const user = await getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const supabase = createBrowserClient()
    const joinCode = generateJoinCode()

    const { error } = await supabase.from('classrooms').insert({
      name: name.trim(),
      teacher_id: user.id,
      join_code: joinCode,
    })

    if (error) {
      // Colisão de código (unique constraint) — pede nova tentativa
      setError(
        error.code === '23505'
          ? 'Código duplicado. Tente novamente.'
          : 'Erro ao criar turma. Tente novamente.',
      )
      setLoading(false)
      return
    }

    handleClose()
    router.refresh()
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Nova turma
      </Button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleCreate}>
          <CardHeader>
            <CardTitle>Nova turma</CardTitle>
            <CardDescription>
              Um código de 6 caracteres será gerado automaticamente para os
              alunos entrarem.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="classroom-name">
                Nome da turma
              </label>
              <Input
                id="classroom-name"
                type="text"
                placeholder="Ex: 3º Ano A — Química"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                maxLength={80}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <CardFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Criando…' : 'Criar turma'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
