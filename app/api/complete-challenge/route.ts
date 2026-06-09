// Rota POST /api/complete-challenge
// Recebe { challengeId } e marca a sessão do aluno como concluída no banco.
// Procura uma sessão in_progress existente e atualiza; se não encontrar, cria
// uma nova já como completed. Em ambos os casos preenche classroom_id.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  let challengeId: string
  try {
    const body = await request.json()
    challengeId = body.challengeId
    if (!challengeId) throw new Error()
  } catch {
    return NextResponse.json({ error: 'challengeId obrigatório' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // classroom_id da matrícula mais recente do aluno
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const classroomId = enrollment?.classroom_id ?? null

  // Procura sessão in_progress mais recente para este desafio
  const { data: existing } = await supabase
    .from('challenge_sessions')
    .select('id')
    .eq('student_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()

  if (existing) {
    // Atualiza sessão existente — também corrige classroom_id se estava null.
    // .select('id') é necessário para detectar bloqueio silencioso de RLS:
    // sem ele, um UPDATE bloqueado retorna 200 com 0 linhas sem erro.
    const { data: updated, error } = await supabase
      .from('challenge_sessions')
      .update({ status: 'completed', completed_at: now, classroom_id: classroomId })
      .eq('id', existing.id)
      .select('id')

    if (error || !updated || updated.length === 0) {
      console.error('[complete-challenge] Erro ao atualizar sessão (RLS?):', error)
      return NextResponse.json({ error: 'Falha ao salvar progresso' }, { status: 500 })
    }
  } else {
    // Fire-and-forget falhou — cria sessão já como completed
    const { error } = await supabase
      .from('challenge_sessions')
      .insert({
        student_id: user.id,
        challenge_id: challengeId,
        classroom_id: classroomId,
        status: 'completed',
        completed_at: now,
      })

    if (error) {
      console.error('[complete-challenge] Erro ao criar sessão:', error)
      return NextResponse.json({ error: 'Falha ao salvar progresso' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
