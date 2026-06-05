// Dashboard do professor: lista turmas criadas + contagem de alunos por turma.
// Server Component — dados buscados no servidor.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignOutButton } from '@/components/SignOutButton'
import { CreateClassroomModal } from '@/components/CreateClassroomModal'
import { CopyButton } from '@/components/CopyButton'
import { createServerClient } from '../../../lib/supabase'

type Classroom = {
  id: string
  name: string
  join_code: string
  created_at: string
}

export default async function TeacherDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const teacherName = (user.user_metadata?.name as string | undefined) ?? 'professor'

  // Busca turmas do professor
  const { data: classroomsRaw } = await supabase
    .from('classrooms')
    .select('id, name, join_code, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const classrooms = (classroomsRaw ?? []) as Classroom[]

  // Contagem de alunos por turma (uma query para todas as turmas)
  const classroomIds = classrooms.map((c) => c.id)
  const { data: enrollmentsRaw } = classroomIds.length
    ? await supabase
        .from('enrollments')
        .select('classroom_id')
        .in('classroom_id', classroomIds)
    : { data: [] }

  const enrollmentCount = (enrollmentsRaw ?? []).reduce<Record<string, number>>(
    (acc, e) => {
      const id = e.classroom_id as string
      acc[id] = (acc[id] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MoleculeIcon />
          <div>
            <p className="font-semibold text-sm leading-none">Chemicraft</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Painel do professor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Olá, {teacherName}
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
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">
                {classrooms.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">turmas criadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">
                {Object.values(enrollmentCount).reduce((s, n) => s + n, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                alunos matriculados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de turmas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Minhas turmas</h2>
            <CreateClassroomModal />
          </div>

          {classrooms.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {classrooms.map((classroom) => (
                <Link
                  key={classroom.id}
                  href={`/teacher/classroom/${classroom.id}`}
                  className="block group"
                >
                  <Card className="transition-colors group-hover:border-foreground/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {classroom.name}
                          </CardTitle>
                          <CardDescription>
                            Criada em{' '}
                            {new Date(classroom.created_at).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Código de acesso */}
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.preventDefault()}
                          >
                            <span className="font-mono text-sm font-semibold tracking-widest bg-muted px-2 py-0.5 rounded">
                              {classroom.join_code}
                            </span>
                            <CopyButton text={classroom.join_code} />
                          </div>

                          {/* Contagem de alunos */}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="size-4" />
                            <span className="tabular-nums">
                              {enrollmentCount[classroom.id] ?? 0}
                            </span>
                          </div>

                          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Users className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Nenhuma turma ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua primeira turma e compartilhe o código com os alunos.
          </p>
        </div>
        <CreateClassroomModal />
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
