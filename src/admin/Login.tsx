import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'
import { btnPrimary, inputCls } from './builder/Fields'

export default function Login() {
  const { session, isAdmin, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  const switchMode = (m: 'login' | 'register') => { setMode(m); setErr(''); setInfo(''); setPassword2('') }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setErr(error.message.toLowerCase().includes('confirm') ? 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja.' : 'Correo o contraseña incorrectos.')
      } else {
        if (password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
        if (password !== password2) { setErr('Las contraseñas no coinciden.'); return }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/admin` },
        })
        if (error) {
          setErr(/registered|exists/i.test(error.message) ? 'Ya existe una cuenta con ese correo. Inicia sesión.' : 'No se pudo crear la cuenta. Inténtalo de nuevo.')
        } else if (data.user && data.user.identities?.length === 0) {
          setErr('Ya existe una cuenta con ese correo. Inicia sesión.')
        } else if (!data.session) {
          setInfo('¡Cuenta creada! Te enviamos un correo para confirmarla. Ábrelo y luego inicia sesión.')
          setMode('login'); setPassword(''); setPassword2('')
        }
        // Si hay sesión (confirmación de correo desactivada), el estado de auth redirige solo al panel.
      }
    } finally { setBusy(false) }
  }

  const register = mode === 'register'
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-purple-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        <div className="mb-1 text-4xl" aria-hidden>💌</div>
        <h1 className="mb-1 text-xl font-bold text-gray-900">{register ? 'Crea tu cuenta' : 'Panel de invitaciones'}</h1>
        <p className="mb-5 text-sm text-gray-500">
          {register ? 'Crea y comparte tus propias invitaciones. Solo tú verás tus respuestas.' : 'Inicia sesión para gestionar tus invitaciones.'}
        </p>
        <label className="mb-3 block text-xs font-semibold text-gray-600">Correo
          <input className={`${inputCls} mt-1`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mb-3 block text-xs font-semibold text-gray-600">Contraseña
          <input className={`${inputCls} mt-1`} type="password" required minLength={register ? 8 : undefined}
            autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {register && (
          <label className="mb-3 block text-xs font-semibold text-gray-600">Repite la contraseña
            <input className={`${inputCls} mt-1`} type="password" required autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
          </label>
        )}
        {err && <p role="alert" className="mb-3 text-sm text-red-600">{err}</p>}
        {info && <p role="status" className="mb-3 text-sm text-green-700">{info}</p>}
        <button className={`${btnPrimary} w-full`} disabled={busy}>
          {busy ? 'Un momento…' : register ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          {register ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
          <button type="button" className="font-semibold text-rose-600 underline" onClick={() => switchMode(register ? 'login' : 'register')}>
            {register ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </form>
    </div>
  )
}
