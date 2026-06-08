// Proxy (middleware) de proteção de rotas: autentica sessão e redireciona por papel (role).
// No Next.js 16 usa-se proxy.ts em vez de middleware.ts.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser valida o JWT com o servidor — mais seguro que getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const role = user?.user_metadata?.role as string | undefined

  const isAuthRoute = path === '/login' || path === '/register'
  const isRoot = path === '/'
  const isTeacherRoute = path.startsWith('/teacher')
  const isStudentRoute = path.startsWith('/student')

  // Usuário NÃO autenticado
  if (!user) {
    // Raiz e dashboards protegidos → login
    if (isRoot || isTeacherRoute || isStudentRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Usuário AUTENTICADO
  const teacherDest = '/teacher/dashboard'
  const studentDest = '/student/dashboard'
  const homeDest = role === 'teacher' ? teacherDest : studentDest

  // Raiz ou páginas de auth → dashboard correto
  if (isRoot || isAuthRoute) {
    return NextResponse.redirect(new URL(homeDest, request.url))
  }

  // Aluno tentando acessar rota de professor
  if (role === 'student' && isTeacherRoute) {
    return NextResponse.redirect(new URL(studentDest, request.url))
  }

  // Professor tentando acessar rota de aluno
  if (role === 'teacher' && isStudentRoute) {
    return NextResponse.redirect(new URL(teacherDest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/login', '/register', '/teacher/:path*', '/student/:path*'],
}
