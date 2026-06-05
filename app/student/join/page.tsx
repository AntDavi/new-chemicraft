// Tela de entrada em turma: o aluno digita o código de 6 chars (letras + números)
// gerado pelo professor. Valida no banco e insere em `enrollments`.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { createBrowserClient } from '../../../lib/supabase'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Aceita apenas letras e números, força maiúsculas, limita a 6 chars
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    setCode(value)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    setError(null)

    const user = await getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const supabase = createBrowserClient()

    // Busca a turma pelo código (case-insensitive)
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name')
      .ilike('join_code', code)
      .single()

    if (classroomError || !classroom) {
      setError('Código inválido. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    // Verifica se já está matriculado nessa turma
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('classroom_id', classroom.id)
      .maybeSingle()

    if (existing) {
      setError(`Você já está matriculado na turma "${classroom.name}".`)
      setLoading(false)
      return
    }

    // Insere matrícula
    const { error: enrollError } = await supabase.from('enrollments').insert({
      student_id: user.id,
      classroom_id: classroom.id,
    })

    if (enrollError) {
      setError('Erro ao entrar na turma. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/student/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <MoleculeIcon />
          <h1 className="text-xl font-semibold tracking-tight">Chemicraft</h1>
          <p className="text-sm text-muted-foreground">
            Editor visual de moléculas 2D
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar em turma</CardTitle>
            <CardDescription>
              Peça o código de 6 caracteres ao seu professor e insira abaixo.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="code">
                  Código da turma
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="AB12CD"
                  value={code}
                  onChange={handleCodeChange}
                  required
                  maxLength={6}
                  className="text-center text-xl font-mono tracking-[0.4em] h-12"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                />
                <p className="text-xs text-muted-foreground text-center tabular-nums">
                  {code.length} / 6
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || code.length !== 6}
              >
                {loading ? 'Verificando…' : 'Entrar na turma'}
              </Button>
              <Link
                href="/student/dashboard"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Voltar para o início
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

function MoleculeIcon() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="26" y1="10" x2="42" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="26" x2="26" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="42" x2="10" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="26" x2="26" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="10" r="6" fill="#888888" />
      <circle cx="42" cy="26" r="6" fill="#FF4444" />
      <circle cx="26" cy="42" r="6" fill="#4444FF" />
      <circle cx="10" cy="26" r="6" fill="#FF4444" />
    </svg>
  )
}
