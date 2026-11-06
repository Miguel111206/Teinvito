import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Runtime, type Adapter } from '../runtime/Runtime'
import { pubConfirm, pubMarkStarted, pubResume, pubSave, pubStart } from '../lib/api'
import { baseTexts } from '../lib/defaults'
import type { AnswerValue, PublicPayload } from '../lib/types'

const key = (token: string) => `invite-session:${token}`

function Screen({ emoji, title, text, action }: { emoji: string; title: string; text: string; action?: { label: string; run: () => void } }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-rose-50 to-purple-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <div className="mb-3 text-5xl" aria-hidden>{emoji}</div>
        <h1 className="mb-2 text-xl font-bold text-rose-900">{title}</h1>
        <p className="text-sm text-gray-600">{text}</p>
        {action && <button type="button" onClick={action.run} className="mt-5 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white">{action.label}</button>}
      </div>
    </div>
  )
}

export default function InvitePage() {
  const { token = '' } = useParams()
  const [data, setData] = useState<PublicPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const sessionRef = useRef<string | null>(null)
  const loading = useRef(false)

  const load = useCallback(async () => {
    if (loading.current) return
    loading.current = true
    setFailed(false); setData(null)
    try {
      let saved: string | null = null
      try { saved = localStorage.getItem(key(token)) } catch { /* sin almacenamiento local */ }
      let payload: PublicPayload | null = null
      if (saved) {
        payload = await pubResume(saved)
        if (payload.state === 'not_found') payload = null
      }
      if (!payload) payload = await pubStart(token)
      if (payload.state === 'ok' && payload.session_id) {
        sessionRef.current = payload.session_id
        try { localStorage.setItem(key(token), payload.session_id) } catch { /* ignorar */ }
      }
      setData(payload)
    } catch {
      setFailed(true)
    } finally {
      loading.current = false
    }
  }, [token])

  useEffect(() => { document.title = 'Invitación'; void load() }, [load])

  const adapter: Adapter = {
    async markStarted() {
      const r = await pubMarkStarted(sessionRef.current!)
      if (!r.ok) throw new Error('No se pudo iniciar')
    },
    async save(step, answer, question) {
      const r = await pubSave(sessionRef.current!, step.id, step.type, question, answer)
      if (!r.ok) throw new Error(r.error ?? 'No se pudo guardar')
    },
    async confirm() {
      const r = await pubConfirm(sessionRef.current!)
      if (!r.ok) throw new Error(r.error ?? 'No se pudo confirmar')
    },
  }

  if (failed) return <Screen emoji="📡" title="No pudimos cargar la invitación" text="Revisa tu conexión e inténtalo de nuevo." action={{ label: baseTexts.retry, run: () => void load() }} />
  if (!data) return <Screen emoji="💌" title="Cargando…" text="Un momento, por favor." />
  if (data.state === 'disabled') return <Screen emoji="🔒" title={baseTexts.disabledTitle} text={baseTexts.disabledText} />
  if (data.state === 'rate_limited') return <Screen emoji="⏳" title="Demasiados intentos" text="Vuelve a intentarlo en un rato." />
  if (data.state !== 'ok' || !data.config) return <Screen emoji="🔍" title={baseTexts.notFoundTitle} text={baseTexts.notFoundText} />

  const answers: Record<string, AnswerValue> = {}
  for (const a of data.answers ?? []) answers[a.step_id] = a.answer
  return <Runtime mode="public" config={data.config} adapter={adapter} initialAnswers={answers} initialStarted={Boolean(data.started)} initialConfirmed={Boolean(data.confirmed)} />
}
