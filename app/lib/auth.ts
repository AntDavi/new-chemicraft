// Funções de autenticação client-side: signIn, signUp, signOut e getUser.

import { createBrowserClient } from '../../lib/supabase'

export type UserRole = 'teacher' | 'student'

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
) {
  const supabase = createBrowserClient()
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  })
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
