// Tela de registro: nome, email, senha e seleção de papel (aluno ou professor).

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, BookOpen } from 'lucide-react'
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
import { signUp, type UserRole } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await signUp(email, password, name, role)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Se email de confirmação for exigido pelo Supabase, session vem null
    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    router.push('/app')
    router.refresh()
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2">
            <MoleculeIcon />
            <h1 className="text-xl font-semibold tracking-tight">Chemicraft</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Verifique seu email</CardTitle>
              <CardDescription>
                Enviamos um link de confirmação para{' '}
                <span className="text-foreground font-medium">{email}</span>.
                Acesse o link para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-8">
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
            <CardTitle>Criar conta</CardTitle>
            <CardDescription>Preencha os dados para se cadastrar</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Seletor de papel */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Você é…</label>
                <div className="grid grid-cols-2 gap-2">
                  <RoleCard
                    icon={<GraduationCap className="size-5" />}
                    label="Aluno"
                    description="Praticar desafios"
                    selected={role === 'student'}
                    onClick={() => setRole('student')}
                  />
                  <RoleCard
                    icon={<BookOpen className="size-5" />}
                    label="Professor"
                    description="Gerenciar turmas"
                    selected={role === 'teacher'}
                    onClick={() => setRole('teacher')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="name">
                  Nome completo
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="password">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Criando conta…' : 'Criar conta'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors cursor-pointer',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
      )}
    >
      {icon}
      <span className="text-sm font-medium leading-none">{label}</span>
      <span className="text-xs leading-none opacity-80">{description}</span>
    </button>
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
