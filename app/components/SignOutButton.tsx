// Botão de logout reutilizável em dashboards. Client Component necessário
// porque signOut() usa createBrowserClient (acesso ao DOM/cookies do browser).

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? 'Saindo…' : 'Sair'}
    </Button>
  )
}
