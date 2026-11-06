import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from '../lib/supabase'
import { isAdminUser } from '../lib/api'

interface AuthState {
  session: Session | null
  loading: boolean
  isAdmin: boolean
  error: string
  signOut: () => Promise<void>
}
const AuthCtx = createContext<AuthState | null>(null)

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isConfigured) { setLoading(false); setError('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'); return }
    let alive = true
    const check = async (s: Session | null) => {
      if (!alive) return
      setSession(s)
      if (!s) { setIsAdmin(false); setLoading(false); return }
      try { setIsAdmin(await isAdminUser()); setError('') }
      catch (e) { setIsAdmin(false); setError(e instanceof Error ? e.message : 'No se pudo verificar el acceso') }
      if (alive) setLoading(false)
    }
    void supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { void check(s) })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthCtx.Provider value={{ session, loading, isAdmin, error, signOut }}>{children}</AuthCtx.Provider>
}

// Ruta privada: exige sesión iniciada (la seguridad real la aplican RLS y las RPC)
export function RequireAdmin() {
  const { session, loading, isAdmin, error, signOut } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500" role="status">Verificando acceso…</div>
  if (!session) return <Navigate to="/admin/login" replace />
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow">
          <h1 className="mb-2 text-lg font-bold">No se pudo verificar tu sesión</h1>
          <p className="mb-4 text-sm text-gray-600">Vuelve a iniciar sesión. {error}</p>
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => void signOut()}>Cerrar sesión</button>
        </div>
      </div>
    )
  }
  return <Outlet />
}
