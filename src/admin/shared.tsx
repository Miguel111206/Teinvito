import { useCallback, useEffect, useState } from 'react'
import type { InvitationOverview, SendChannel, TrackingStatus, PublicationStatus } from '../lib/types'
import { CHANNEL_LABELS, PUBLICATION_LABELS, TRACKING_LABELS, listOverview, markSent, trackingOf } from '../lib/api'
import { btnGhost, btnPrimary, inputCls } from './builder/Fields'

export function useOverview() {
  const [items, setItems] = useState<InvitationOverview[] | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    try { setError(''); setItems(await listOverview()) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar') }
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { items, error, reload }
}

const trackColor: Record<TrackingStatus, string> = {
  sin_envio: 'bg-gray-100 text-gray-600', enviada: 'bg-sky-100 text-sky-800', abierta: 'bg-amber-100 text-amber-800',
  en_curso: 'bg-violet-100 text-violet-800', confirmada: 'bg-green-100 text-green-800',
}
const pubColor: Record<PublicationStatus, string> = {
  draft: 'bg-gray-100 text-gray-600', published: 'bg-green-100 text-green-800', disabled: 'bg-red-100 text-red-700', archived: 'bg-stone-200 text-stone-600',
}

export const TrackingBadge = ({ o }: { o: InvitationOverview }) => {
  const s = trackingOf(o)
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${trackColor[s]}`}>{TRACKING_LABELS[s]}</span>
}
export const PublicationBadge = ({ s }: { s: PublicationStatus }) =>
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pubColor[s]}`}>{PUBLICATION_LABELS[s]}</span>

export function Loading({ error, retry }: { error: string; retry: () => void }) {
  if (error) return <div role="alert" className="p-6 text-sm text-red-600">{error} <button className={btnGhost} onClick={retry}>Reintentar</button></div>
  return <div role="status" className="p-6 text-sm text-gray-500">Cargando…</div>
}

// Registro EXPLÍCITO de envío: lo confirma el administrador. Copiar el enlace o abrir WhatsApp no prueba nada.
export function MarkSentForm({ invitationId, onDone }: { invitationId: string; onDone: () => void }) {
  const [channel, setChannel] = useState<SendChannel>('whatsapp')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    setBusy(true); setErr('')
    try { await markSent(invitationId, channel, note.trim()); setNote(''); onDone() }
    catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo registrar') }
    finally { setBusy(false) }
  }
  return (
    <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-sm font-semibold text-gray-800">Marcar como enviada</p>
      <p className="text-xs text-gray-500">Confirmas tú que la enviaste. No es una comprobación de entrega ni de lectura.</p>
      <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value as SendChannel)} aria-label="Canal de envío">
        {(Object.keys(CHANNEL_LABELS) as SendChannel[]).map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
      </select>
      <input className={inputCls} placeholder="Nota (opcional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
      <button className={btnPrimary} disabled={busy} onClick={() => void go()}>{busy ? 'Registrando…' : 'Registrar envío'}</button>
    </div>
  )
}
