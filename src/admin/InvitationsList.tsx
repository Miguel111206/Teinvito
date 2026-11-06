import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import type { PublicationStatus, ToneId } from '../lib/types'
import { TONES } from '../lib/defaults'
import { createInvitation, deleteInvitation, duplicateInvitation, getInvitation, publicUrl, setStatus } from '../lib/api'
import { fmtDate } from '../lib/template'
import { Field, Section, btnDanger, btnGhost, btnPrimary, inputCls } from './builder/Fields'
import { Loading, PublicationBadge, TrackingBadge, useOverview } from './shared'

export default function InvitationsList() {
  const nav = useNavigate()
  const { items, error, reload } = useOverview()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'activas' | PublicationStatus>('activas')
  const [name, setName] = useState('')
  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  const [tone, setTone] = useState<ToneId>('romantico')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const create = async (e?: FormEvent, sample = false) => {
    e?.preventDefault()
    setBusy(true); setErr('')
    try {
      const inv = await createInvitation(sample
        ? { internal_name: 'Ejemplo: cita con Hellen', recipient: 'Hellen', sender: 'Miguel', tone: 'romantico' }
        : { internal_name: name.trim() || `Invitación para ${recipient || 'alguien'}`, recipient: recipient.trim(), sender: sender.trim(), tone })
      nav(`/admin/invitaciones/${inv.id}`)
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'No se pudo crear'); setBusy(false) }
  }

  const act = async (fn: () => Promise<unknown>) => {
    try { await fn(); await reload() } catch (ex) { window.alert(ex instanceof Error ? ex.message : 'Error') }
  }

  if (!items) return <Loading error={error} retry={() => void reload()} />
  const list = items
    .filter((i) => (filter === 'activas' ? i.publication_status !== 'archived' : i.publication_status === filter))
    .filter((i) => `${i.internal_name} ${i.recipient_name}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-xl font-bold">Invitaciones</h1>
      <Section title="Crear invitación" defaultOpen={items.length === 0}>
        <form onSubmit={(e) => void create(e)} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre interno"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Cena con Hellen" /></Field>
          <Field label="Tono inicial">
            <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as ToneId)}>
              {TONES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
            </select>
          </Field>
          <Field label="Destinatario"><input className={inputCls} value={recipient} onChange={(e) => setRecipient(e.target.value)} /></Field>
          <Field label="Remitente"><input className={inputCls} value={sender} onChange={(e) => setSender(e.target.value)} /></Field>
          {err && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{err}</p>}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button className={btnPrimary} disabled={busy}>{busy ? 'Creando…' : 'Crear y editar'}</button>
            <button type="button" className={btnGhost} disabled={busy} onClick={() => void create(undefined, true)}>Crear invitación de ejemplo</button>
          </div>
        </form>
      </Section>

      <div className="my-4 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Buscar por nombre o destinatario" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <select className={`${inputCls} max-w-[200px]`} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtrar por estado de publicación">
          <option value="activas">Todas (sin archivadas)</option>
          <option value="draft">Borradores</option><option value="published">Publicadas</option>
          <option value="disabled">Desactivadas</option><option value="archived">Archivadas</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">No hay invitaciones que coincidan.</div>
      ) : (
        <ul className="grid gap-3">
          {list.map((i) => (
            <li key={i.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/invitaciones/${i.id}`} className="min-w-0 flex-1 truncate font-bold hover:underline">{i.internal_name}</Link>
                <PublicationBadge s={i.publication_status} /><TrackingBadge o={i} />
              </div>
              <p className="mt-1 text-xs text-gray-500">Para {i.recipient_name || '—'} · creada {fmtDate(i.created_at)}{i.published_at ? ` · publicada ${fmtDate(i.published_at)}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className={btnGhost} to={`/admin/invitaciones/${i.id}`}>Editar</Link>
                <Link className={btnGhost} to={`/admin/invitaciones/${i.id}/detalle`}>Envíos y respuestas</Link>
                {i.published_version_id && <button className={btnGhost} onClick={() => void navigator.clipboard?.writeText(publicUrl(i.token))}>Copiar enlace</button>}
                <button className={btnGhost} onClick={() => {
                  const r = window.prompt('Destinatario de la copia (se crea un enlace nuevo, con respuestas separadas):', '')
                  if (r === null) return
                  void act(async () => { const src = await getInvitation(i.id); await duplicateInvitation(src, r.trim() || undefined) })
                }}>Duplicar</button>
                {i.publication_status === 'published' && <button className={btnGhost} onClick={() => void act(() => setStatus(i.id, 'disabled'))}>Desactivar enlace</button>}
                {i.publication_status === 'disabled' && <button className={btnGhost} onClick={() => void act(() => setStatus(i.id, 'published'))}>Reactivar enlace</button>}
                {i.publication_status !== 'archived'
                  ? <button className={btnGhost} onClick={() => void act(() => setStatus(i.id, 'archived'))}>Archivar</button>
                  : <button className={btnGhost} onClick={() => void act(() => setStatus(i.id, i.published_version_id ? 'disabled' : 'draft'))}>Restaurar</button>}
                <button className={btnDanger} onClick={() => {
                  if (window.confirm(`¿Eliminar “${i.internal_name}”? Se borran también sus envíos y respuestas. No se puede deshacer.`)) void act(() => deleteInvitation(i.id))
                }}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
