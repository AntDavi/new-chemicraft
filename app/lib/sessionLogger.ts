// Logging fire-and-forget de sessões de desafio. Nunca use await ao chamar
// estas funções na UI — todas usam .then().catch() internamente.

import { createBrowserClient } from '../../lib/supabase'

// Cria a sessão e retorna o sessionId gerado (Promise — guarde em ref, não awaite na UI).
export function createSession(
  challengeId: string,
  classroomId: string | null,
): Promise<string | null> {
  const supabase = createBrowserClient()
  return supabase.auth
    .getUser()
    .then(({ data: { user } }) => {
      if (!user) return null
      return supabase
        .from('challenge_sessions')
        .insert({
          student_id: user.id,
          challenge_id: challengeId,
          classroom_id: classroomId,
          status: 'in_progress',
        })
        .select('id')
        .single()
        .then(({ data }) => data?.id ?? null)
    })
    .catch(() => null)
}

// Insere uma ação e reatualiza actions_count com o total real de ações da sessão.
// A recontagem evita inconsistência sem precisar de RPC de incremento atômico.
export function logAction(
  sessionId: string | null,
  actionType: string,
  payload: Record<string, unknown> = {},
): void {
  if (!sessionId) return
  const supabase = createBrowserClient()
  Promise.resolve(
    supabase
      .from('session_actions')
      .insert({ session_id: sessionId, action_type: actionType, payload }),
  )
    .then(() =>
      supabase
        .from('session_actions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
    )
    .then(({ count }) => {
      if (count !== null) {
        return supabase
          .from('challenge_sessions')
          .update({ actions_count: count })
          .eq('id', sessionId)
      }
    })
    .catch(() => {})
}

// Insere feedback da IA e reatualiza ai_requests_count.
export function logFeedback(
  sessionId: string | null,
  feedbackText: string,
  triggeredBy: 'manual' | 'valence_error' | 'challenge_start',
): void {
  if (!sessionId) return
  const supabase = createBrowserClient()
  Promise.resolve(
    supabase.from('session_feedback').insert({
      session_id: sessionId,
      feedback_text: feedbackText,
      triggered_by: triggeredBy,
    }),
  )
    .then(() =>
      supabase
        .from('session_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
    )
    .then(({ count }) => {
      if (count !== null) {
        return supabase
          .from('challenge_sessions')
          .update({ ai_requests_count: count })
          .eq('id', sessionId)
      }
    })
    .catch(() => {})
}

// Marca a sessão como concluída.
export function completeSession(sessionId: string | null): void {
  if (!sessionId) return
  const supabase = createBrowserClient()
  Promise.resolve(
    supabase
      .from('challenge_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId),
  ).catch(() => {})
}
