// Editor de moléculas — rota pública /app, acessível com ou sem login.
// Quando o aluno está autenticado e matriculado em uma turma, passa o
// classroomId ao MoleculeEditor para que as sessões sejam associadas à turma.

import { cookies } from 'next/headers'
import MoleculeEditor from '../components/MoleculeEditor'
import { createServerClient } from '../../lib/supabase'

export default async function AppPage() {
  let classroomId: string | null = null

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('enrollments')
        .select('classroom_id')
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      classroomId = data?.classroom_id ?? null
    }
  } catch {
    // Falha silenciosa — o editor funciona sem classroomId
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      <MoleculeEditor classroomId={classroomId} />
    </main>
  )
}
