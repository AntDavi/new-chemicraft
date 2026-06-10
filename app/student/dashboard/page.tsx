// Dashboard do aluno: lista turmas matriculadas e progresso geral de desafios.
// Server Component — dados buscados no servidor com createServerClient.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FlaskConical, Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignOutButton } from '@/components/SignOutButton'
import { createServerClient } from '../../../lib/supabase'

type Classroom = { id: string; name: string }

type Enrollment = {
  id: string
  joined_at: string
  classrooms: Classroom | null
}

type Session = {
  id: string
  status: string
  challenge_id: string
  classroom_id: string | null
}

export default async function StudentDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = (user.user_metadata?.name as string | undefined) ?? 'aluno'

  // Turmas do aluno com dados da classroom
  const { data: enrollmentsRaw } = await supabase
    .from('enrollments')
    .select('id, joined_at, classrooms(id, name)')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: false })

  const enrollments = (enrollmentsRaw ?? []) as unknown as Enrollment[]

  // Sessões de desafio do aluno para calcular progresso
  const { data: sessionsRaw } = await supabase
    .from('challenge_sessions')
    .select('id, status, challenge_id, classroom_id')
    .eq('student_id', user.id)

  const sessions = (sessionsRaw ?? []) as Session[]

  const totalSessions = sessions.length
  const completedSessions = sessions.filter((s) => s.status === 'completed').length
  const completionRate =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MoleculeIcon />
          <div>
            <p className="font-semibold text-sm leading-none">Chemicraft</p>
            <p className="text-xs text-muted-foreground mt-0.5">Painel do aluno</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Olá, {name}
          </span>
          <Link href="/app">
            <Button variant="outline" size="sm">
              Abrir editor
            </Button>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Cards de progresso */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{completedSessions}</p>
              <p className="text-xs text-muted-foreground mt-0.5">concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{totalSessions}</p>
              <p className="text-xs text-muted-foreground mt-0.5">tentativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{completionRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">aproveitamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de turmas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Minhas turmas</h2>
            <Link href="/student/join">
              <Button size="sm" variant="outline">
                <Plus className="size-3.5" />
                Entrar em turma
              </Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => {
                const classroom = enrollment.classrooms
                if (!classroom) return null

                const classroomSessions = sessions.filter(
                  (s) => s.classroom_id === classroom.id,
                )
                const classroomCompleted = classroomSessions.filter(
                  (s) => s.status === 'completed',
                ).length

                return (
                  <Card key={enrollment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {classroom.name}
                          </CardTitle>
                          <CardDescription>
                            Entrou em{' '}
                            {new Date(enrollment.joined_at).toLocaleDateString(
                              'pt-BR',
                              { day: '2-digit', month: 'short', year: 'numeric' },
                            )}
                          </CardDescription>
                        </div>
                        <ClassroomProgress
                          completed={classroomCompleted}
                          total={classroomSessions.length}
                        />
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ClassroomProgress({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
      {completed > 0 && total > 0 && completed === total ? (
        <Trophy className="size-4 text-foreground" />
      ) : (
        <FlaskConical className="size-4" />
      )}
      <span className="tabular-nums">
        {completed}/{total}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <BookOpen className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Nenhuma turma ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Peça o código ao seu professor e entre em uma turma.
          </p>
        </div>
        <Link href="/student/join">
          <Button size="sm">Entrar em turma</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function MoleculeIcon() {
  return (
    <svg
      width="32"
      height="32"
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
