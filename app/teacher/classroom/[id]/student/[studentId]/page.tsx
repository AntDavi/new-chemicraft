// Relatório individual de aluno: linha do tempo de sessões, taxa de conclusão
// por dificuldade, ações registradas agrupadas e histórico de feedbacks da IA.
// Server Component — acesso restrito ao professor dono da turma.

import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignOutButton } from '@/components/SignOutButton'
import { createServerClient } from '../../../../../../lib/supabase'
import {
  getChallengeById,
  type Difficulty,
} from '@/lib/challengeDatabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Session = {
  id: string
  challenge_id: string
  status: string
  started_at: string
  completed_at: string | null
  actions_count: number
  ai_requests_count: number
}

type SessionAction = {
  session_id: string
  action_type: string
}

type SessionFeedback = {
  id: string
  session_id: string
  feedback_text: string
  triggered_by: string
  created_at: string
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

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Análise manual',
  valence_error: 'Erro de valência',
  challenge_start: 'Início do desafio',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  iniciante: 'Iniciante',
  intermediário: 'Intermediário',
  avançado: 'Avançado',
}

const DIFFICULTY_ORDER: Difficulty[] = ['iniciante', 'intermediário', 'avançado']

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>
}) {
  const { id: classroomId, studentId } = await params
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

  // Verifica que o aluno está matriculado na turma e busca o perfil
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, users(name, email)')
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)
    .single()

  if (!enrollment) notFound()

  const studentProfile = enrollment.users as { name: string | null; email: string | null } | null
  const studentName = studentProfile?.name ?? studentProfile?.email ?? 'Aluno'

  // Sessões do aluno nesta turma, mais recentes primeiro
  const { data: sessionsRaw } = await supabase
    .from('challenge_sessions')
    .select(
      'id, challenge_id, status, started_at, completed_at, actions_count, ai_requests_count',
    )
    .eq('student_id', studentId)
    .eq('classroom_id', classroomId)
    .order('started_at', { ascending: false })

  const sessions = (sessionsRaw ?? []) as Session[]
  const sessionIds = sessions.map((s) => s.id)

  // Actions e feedbacks — apenas se houver sessões
  let actions: SessionAction[] = []
  let feedbacks: SessionFeedback[] = []

  if (sessionIds.length > 0) {
    const [{ data: actionsRaw }, { data: feedbacksRaw }] = await Promise.all([
      supabase
        .from('session_actions')
        .select('session_id, action_type')
        .in('session_id', sessionIds),
      supabase
        .from('session_feedback')
        .select('id, session_id, feedback_text, triggered_by, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false }),
    ])
    actions = (actionsRaw ?? []) as SessionAction[]
    feedbacks = (feedbacksRaw ?? []) as SessionFeedback[]
  }

  // ---------------------------------------------------------------------------
  // Métricas computadas no servidor
  // ---------------------------------------------------------------------------

  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const overallRate =
    sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0

  // Conclusão por dificuldade
  const byDifficulty = DIFFICULTY_ORDER.map((difficulty) => {
    const subset = sessions.filter(
      (s) => getChallengeById(s.challenge_id)?.difficulty === difficulty,
    )
    const done = subset.filter((s) => s.status === 'completed').length
    return { difficulty, total: subset.length, done }
  })

  // Ações agrupadas por tipo, ordenadas por frequência decrescente
  const actionCounts = actions.reduce<Record<string, number>>((acc, a) => {
    acc[a.action_type] = (acc[a.action_type] ?? 0) + 1
    return acc
  }, {})
  const sortedActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])

  // Mapa sessionId → challenge (para contexto nos feedbacks)
  const sessionChallengeMap = Object.fromEntries(
    sessions.map((s) => [s.id, getChallengeById(s.challenge_id)]),
  )

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
              {studentName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{classroom.name}</p>
          </div>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Cards de resumo geral */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{sessions.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">sessões</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{overallRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Conclusão por dificuldade */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Conclusão por dificuldade</h2>
          <Card>
            <CardContent className="py-4 space-y-4">
              {byDifficulty.map(({ difficulty, total, done }) => {
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div key={difficulty} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {DIFFICULTY_LABELS[difficulty]}
                      </span>
                      <span className="tabular-nums font-medium">
                        {total === 0 ? '—' : `${done}/${total}`}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      {total > 0 && (
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Linha do tempo de sessões */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Linha do tempo</h2>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhuma sessão registrada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const challenge = getChallengeById(session.challenge_id)
                const durationMin =
                  session.completed_at
                    ? Math.round(
                        (new Date(session.completed_at).getTime() -
                          new Date(session.started_at).getTime()) /
                          60000,
                      )
                    : null

                return (
                  <Card key={session.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-sm">
                              {challenge?.name ?? session.challenge_id}
                            </CardTitle>
                            {challenge && (
                              <DifficultyBadge difficulty={challenge.difficulty} />
                            )}
                            <StatusBadge status={session.status} />
                          </div>
                          <CardDescription className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {new Date(session.started_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {', '}
                            {new Date(session.started_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {durationMin !== null && ` · ${durationMin} min`}
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <FlaskConical className="size-3.5" />
                          <span className="tabular-nums">{session.actions_count}</span>
                          <span>ações</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Ações registradas agrupadas */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Ações registradas</h2>

          {sortedActions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhuma ação registrada.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4 space-y-3">
                {sortedActions.map(([actionType, count]) => {
                  const isError = ERROR_TYPES.has(actionType)
                  const label = ACTION_LABELS[actionType] ?? actionType
                  return (
                    <div
                      key={actionType}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            isError
                              ? 'bg-destructive/70'
                              : 'bg-muted-foreground/30'
                          }`}
                        />
                        <span
                          className={
                            isError ? 'text-destructive' : 'text-muted-foreground'
                          }
                        >
                          {label}
                        </span>
                      </div>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histórico de feedbacks da IA */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Feedbacks da IA</h2>

          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Nenhum feedback registrado.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((fb) => {
                const challenge = sessionChallengeMap[fb.session_id]
                return (
                  <Card key={fb.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {challenge?.name ?? 'Desafio desconhecido'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>
                            {TRIGGER_LABELS[fb.triggered_by] ?? fb.triggered_by}
                          </span>
                          <span>·</span>
                          <span>
                            {new Date(fb.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm leading-relaxed">{fb.feedback_text}</p>
                    </CardContent>
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 shrink-0">
        <CheckCircle2 className="size-3" />
        Concluído
      </span>
    )
  }
  if (status === 'abandoned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <XCircle className="size-3" />
        Abandonado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 shrink-0">
      <Clock className="size-3" />
      Em andamento
    </span>
  )
}
