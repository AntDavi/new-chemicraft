// Tela de login: formulário de email e senha com redirecionamento pós-autenticação.

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
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await signIn(email, password)

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    const dest =
      role === 'teacher'
        ? '/teacher/dashboard'
        : role === 'student'
          ? '/student/dashboard'
          : '/app'

    router.push(dest)
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
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link
                  href="/register"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  Cadastre-se
                </Link>
              </p>
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
