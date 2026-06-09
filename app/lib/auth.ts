// Funções de autenticação client-side: signIn, signUp, signOut e getUser.

import { createBrowserClient } from '../../lib/supabase'

export type UserRole = 'teacher' | 'student'

// Garante que exista uma linha em `public.users` para o usuário autenticado.
// Precisa rodar com sessão ativa — sem ela, `auth.uid()` é null e a RLS
// (`auth.uid() = id`) bloqueia o insert. Por isso só é chamada após login,
// nunca logo após signUp (quando a confirmação de email ainda está pendente).
async function ensureUserProfile(
  supabase: ReturnType<typeof createBrowserClient>,
  userId: string,
  email: string,
) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name = (user?.user_metadata?.name as string | undefined) ?? email
  const role = (user?.user_metadata?.role as UserRole | undefined) ?? 'student'

  const { error } = await supabase.from('users').upsert(
    { id: userId, email, name, role },
    { onConflict: 'id', ignoreDuplicates: true },
  )
  if (error) {
    console.error('Erro ao criar perfil em public.users:', error)
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const result = await supabase.auth.signInWithPassword({ email, password })

  if (result.data.user && !result.error) {
    await ensureUserProfile(supabase, result.data.user.id, email)
  }

  return result
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
) {
  const supabase = createBrowserClient()
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  })

  // Se a confirmação de email estiver desativada, o signUp já retorna sessão
  // ativa — nesse caso podemos criar o perfil imediatamente.
  if (result.data.user && result.data.session && !result.error) {
    await ensureUserProfile(supabase, result.data.user.id, email)
  }

  return result
}

export async function signOut() {
  const supabase = createBrowserClient()
  return supabase.auth.signOut()
}

export async function getUser() {
  const supabase = createBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
