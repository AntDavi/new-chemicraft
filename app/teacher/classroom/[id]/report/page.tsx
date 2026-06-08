// Relatório agregado da turma: taxa de conclusão por molécula, top 5 erros
// mais frequentes e distribuição de alunos por nível de dificuldade alcançado.
// Server Component — acesso restrito ao professor dono da turma.

import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, FlaskConical, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignOutButton } from '@/components/SignOutButton'
import { createServerClient } from '../../../../../lib/supabase'
import { getChallengeById, challenges, type Difficulty } from '@/lib/challengeDatabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Session = {
  id: string
  student_id: string
  challenge_id: string
  status: string
}

type SessionAction = {
  action_type: string
}

type Enrollment = {
  student_id: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  place_atom: 'Átomo posicionado',
  add_bond: 'Ligação criada',
  delete_atom: 'Átomo removido',
  valence_blocked: 'Bloqueio de valência',
  wrong_atom: 'Átomo incorreto',
}

const ERROR_TYPES = new Set(['valence_blocked', 'wrong_atom'])

const DIFFICULTY_ORDER: Difficulty[] = ['iniciante', 'intermediário', 'avançado']

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  iniciante: 'Iniciante',
  intermediário: 'Intermediário',
  avançado: 'Avançado',
}

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  iniciante: 1,
  intermediário: 2,
  avançado: 3,
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ClassroomReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: classroomId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verifica que o professor é dono da turma
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('id', classroomId)
    .eq('teacher_id', user.id)
    .single()

  if (!classroom) notFound()

  // Alunos matriculados
  const { data: enrollmentsRaw } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('classroom_id', classroomId)

  const enrollments = (enrollmentsRaw ?? []) as Enrollment[]

  // Sessões da turma
  const { data: sessionsRaw } = await supabase
    .from('challenge_sessions')
    .select('id, student_id, challenge_id, status')
    .eq('classroom_id', classroomId)

  const sessions = (sessionsRaw ?? []) as Session[]
  const sessionIds = sessions.map((s) => s.id)

  // Actions — somente se houver sessões
  let actions: SessionAction[] = []
  if (sessionIds.length > 0) {
    const { data: actionsRaw } = await supabase
      .from('session_actions')
      .select('action_type')
      .in('session_id', sessionIds)
    actions = (actionsRaw ?? []) as SessionAction[]
  }

  // ---------------------------------------------------------------------------
  // Métricas computadas no servidor
  // ---------------------------------------------------------------------------

  const totalStudents = enrollments.length
  const completedSessions = sessions.filter((s) => s.status === 'completed').length
  const overallRate =
    sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0

  // --- Taxa de conclusão por molécula ---
  // Agrupa sessões por challenge_id; exibe apenas desafios com ≥1 sessão
  const challengeMap = new Map<string, { total: number; completed: number }>()
  for (const session of sessions) {
    const existing = challengeMap.get(session.challenge_id) ?? { total: 0, completed: 0 }
    existing.total += 1
    if (session.status === 'completed') existing.completed += 1
    challengeMap.set(session.challenge_id, existing)
  }

  const moleculeStats = Array.from(challengeMap.entries())
    .map(([challengeId, stats]) => {
      const challenge = getChallengeById(challengeId)
      const rate = Math.round((stats.completed / stats.total) * 100)
      return {
        challengeId,
        name: challenge?.name ?? challengeId,
        formula: challenge?.formula ?? '—',
        difficulty: challenge?.difficulty ?? null,
        ...stats,
        rate,
      }
    })
    .sort((a, b) => b.rate - a.rate)

  // --- Top 5 erros mais frequentes ---
  const actionCounts = actions.reduce<Record<string, number>>((acc, a) => {
    acc[a.action_type] = (acc[a.action_type] ?? 0) + 1
    return acc
  }, {})
  const top5Errors = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // --- Distribuição de alunos por maior nível de dificuldade alcançado ---
  // Para cada aluno matriculado, encontra a maior dificuldade de desafio concluído
  const studentMaxDifficulty = enrollments.map(({ student_id }) => {
    const completedByStudent = sessions.filter(
      (s) => s.student_id === student_id && s.status === 'completed',
    )

    let maxDifficulty: Difficulty | null = null
    let maxRank = 0

    for (const session of completedByStudent) {
      const challenge = getChallengeById(session.challenge_id)
      if (!challenge) continue
      const rank = DIFFICULTY_RANK[challenge.difficulty] ?? 0
      if (rank > maxRank) {
        maxRank = rank
        maxDifficulty = challenge.difficulty
      }
    }

    return maxDifficulty
  })

  const difficultyDistribution: Record<Difficulty | 'sem_progresso', number> = {
    iniciante: 0,
    intermediário: 0,
    avançado: 0,
    sem_progresso: 0,
  }
  for (const d of studentMaxDifficulty) {
    if (d === null) difficultyDistribution.sem_progresso += 1
    else difficultyDistribution[d] += 1
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/classroom/${classroomId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <p className="font-semibold text-sm leading-none truncate max-w-[180px] sm:max-w-none">
              {classroom.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Relatório agregado</p>
          </div>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Resumo geral */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{totalStudents}</p>
              <p className="text-xs text-muted-foreground mt-0.5">alunos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{sessions.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">sessões</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{overallRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Taxa de conclusão por molécula */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Conclusão por molécula</h2>
          </div>

          {moleculeStats.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhuma sessão registrada ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4 space-y-4">
                {moleculeStats.map(({ challengeId, name, formula, difficulty, total, completed, rate }) => (
                  <div key={challengeId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{name}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {formula}
                        </span>
                        {difficulty && (
                          <DifficultyBadge difficulty={difficulty} />
                        )}
                      </div>
                      <span className="tabular-nums text-muted-foreground shrink-0 text-xs">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right tabular-nums">
                      {rate}%
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top 5 erros mais frequentes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Top 5 ações mais frequentes</h2>
          </div>

          {top5Errors.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhuma ação registrada ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4 space-y-3">
                {top5Errors.map(([actionType, count], index) => {
                  const isError = ERROR_TYPES.has(actionType)
                  const label = ACTION_LABELS[actionType] ?? actionType
                  const maxCount = top5Errors[0][1]
                  const barPct = Math.round((count / maxCount) * 100)

                  return (
                    <div key={actionType} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground tabular-nums w-4 text-right shrink-0">
                            {index + 1}.
                          </span>
                          <span
                            className={isError ? 'text-destructive' : 'text-foreground'}
                          >
                            {label}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isError ? 'bg-destructive/60' : 'bg-primary/50'
                          }`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Distribuição de alunos por nível de dificuldade alcançado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Distribuição por nível alcançado</h2>
          </div>

          {totalStudents === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhum aluno matriculado ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4 space-y-4">
                {DIFFICULTY_ORDER.map((difficulty) => {
                  const count = difficultyDistribution[difficulty]
                  const pct = Math.round((count / totalStudents) * 100)
                  return (
                    <div key={difficulty} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {DIFFICULTY_LABELS[difficulty]}
                        </span>
                        <span className="tabular-nums font-medium">
                          {count} aluno{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        {count > 0 && (
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Sem progresso */}
                {difficultyDistribution.sem_progresso > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sem progresso</span>
                      <span className="tabular-nums font-medium">
                        {difficultyDistribution.sem_progresso} aluno
                        {difficultyDistribution.sem_progresso !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/30 rounded-full"
                        style={{
                          width: `${Math.round(
                            (difficultyDistribution.sem_progresso / totalStudents) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    iniciante:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    intermediário:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    avançado:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  }
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${styles[difficulty]}`}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}
