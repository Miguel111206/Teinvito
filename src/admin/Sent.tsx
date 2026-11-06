import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PublicationStatus, TrackingStatus } from '../lib/types'
import { CHANNEL_LABELS, TRACKING_LABELS, publicUrl, trackingOf } from '../lib/api'
import { fmtDate } from '../lib/template'
import { btnGhost, inputCls } from './builder/Fields'
import { Loading, PublicationBadge, TrackingBadge, useOverview } from './shared'

export default function Sent() {
  const { items, error, reload } = useOverview()
  const [q, setQ] = useState('')
  const [track, setTrack] = useState<'' | TrackingStatus>('')
  const [pub, setPub] = useState<'' | PublicationStatus>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const rows = useMemo(() => (items ?? []).filter((i) => {
    if (!pub && i.publication_status === 'archived') return false
    if (q && !`${i.recipient_name} ${i.internal_name}`.toLowerCase().includes(q.toLowerCase())) return false
    if (track && trackingOf(i) !== track) return false
    if (pub && i.publication_status !== pub) return false
    if (from && i.created_at.slice(0, 10) < from) return false
    if (to && i.created_at.slice(0, 10) > to) return false
    return true
  }), [items, q, track, pub, from, to])

  if (!items) return <Loading error={error} retry={() => void reload()} />

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      <h1 className="mb-1 text-xl font-bold">Invitaciones enviadas</h1>
      <p className="mb-4 text-xs text-gray-500">
        “Marcada como enviada” y el canal los registra el administrador. Las aperturas corresponden al enlace y son orientativas: no prueban quién lo abrió.
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input className={inputCls} placeholder="Buscar destinatario" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar por destinatario" />
        <select className={inputCls} value={track} onChange={(e) => setTrack(e.target.value as typeof track)} aria-label="Estado de seguimiento">
          <option value="">Todos los seguimientos</option>
          {(Object.keys(TRACKING_LABELS) as TrackingStatus[]).map((k) => <option key={k} value={k}>{TRACKING_LABELS[k]}</option>)}
        </select>
        <select className={inputCls} value={pub} onChange={(e) => setPub(e.target.value as typeof pub)} aria-label="Estado de publicación">
          <option value="">Todas las publicaciones</option>
          <option value="draft">Borrador</option><option value="published">Publicada</option>
          <option value="disabled">Desactivada</option><option value="archived">Archivada</option>
        </select>
        <label className="text-xs text-gray-500">Creada desde <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-gray-500">hasta <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">No hay invitaciones con esos filtros.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {['Invitación', 'Destinatario', 'Creada', 'Publicada', 'Marcada como enviada', 'Canal', 'Enlace', 'Primera apertura', 'Última apertura', 'Publicación', 'Recorrido', 'Confirmada', 'Respuestas'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2 font-semibold"><Link className="hover:underline" to={`/admin/invitaciones/${i.id}/detalle`}>{i.internal_name}</Link></td>
                  <td className="px-3 py-2">{i.recipient_name || '—'}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.created_at)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.published_at)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.last_sent_at)}{i.sends_count > 1 ? ` (${i.sends_count} registros)` : ''}</td>
                  <td className="px-3 py-2 text-xs">{i.last_channel ? CHANNEL_LABELS[i.last_channel] : '—'}</td>
                  <td className="px-3 py-2">
                    {i.published_version_id
                      ? <button className={btnGhost} onClick={() => void navigator.clipboard?.writeText(publicUrl(i.token))}>Copiar</button>
                      : <span className="text-xs text-gray-400">sin publicar</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.first_opened_at)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.last_opened_at)}</td>
                  <td className="px-3 py-2"><PublicationBadge s={i.publication_status} /></td>
                  <td className="px-3 py-2"><TrackingBadge o={i} /></td>
                  <td className="px-3 py-2 text-xs">{fmtDate(i.confirmed_at)}</td>
                  <td className="px-3 py-2 text-xs">
                    <Link className="text-rose-600 underline" to={`/admin/invitaciones/${i.id}/detalle`}>{i.answers_count} respuesta(s)</Link>
                    <span className="block text-gray-400">{i.sessions_count} sesión(es)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
