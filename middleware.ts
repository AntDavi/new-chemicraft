// Middleware de proteção de rotas: autentica sessão e redireciona por papel (role).
// Protege /teacher/* e /student/* — impede acesso cruzado entre roles.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // getUser valida o JWT com o servidor — não usar getSession() aqui (inseguro)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isTeacherRoute = path.startsWith('/teacher')
  const isStudentRoute = path.startsWith('/student')
  const isAuthRoute = path === '/login' || path === '/register'

  // Usuário não autenticado tentando acessar rota protegida
  if (!user && (isTeacherRoute || isStudentRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined

    // Aluno tentando acessar rota de professor
    if (role === 'student' && isTeacherRoute) {
      return NextResponse.redirect(new URL('/app', request.url))
    }

    // Professor tentando acessar rota de aluno
    if (role === 'teacher' && isStudentRoute) {
      return NextResponse.redirect(new URL('/app', request.url))
    }

    // Já autenticado tentando acessar login/registro — vai direto para o app
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/login', '/register'],
}
