// Singleton helpers do Supabase: createBrowserClient para Client Components,
// createServerClient para Server Components, API Routes e middleware.

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import {
  createServerClient as _createServerClient,
  type CookieMethods,
} from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usado em Client Components ("use client")
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Usado em Server Components, Route Handlers e middleware.
// Recebe o objeto `cookies()` do Next.js para leitura/escrita de sessão.
export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  const cookies: CookieMethods = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          // ReadonlyRequestCookies só permite set em Server Actions / Route Handlers
          (cookieStore as unknown as { set: Function }).set(name, value, options);
        } catch {
          // Em Server Components o set é silenciosamente ignorado — o middleware
          // é o responsável por renovar a sessão nesses casos.
        }
      });
    },
  };

  return _createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
}
