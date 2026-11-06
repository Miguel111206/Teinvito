import { Link } from 'react-router-dom'
import { trackingOf } from '../lib/api'
import type { InvitationOverview } from '../lib/types'
import { fmtDate } from '../lib/template'
import { Loading, PublicationBadge, TrackingBadge, useOverview } from './shared'

export default function Dashboard() {
  const { items, error, reload } = useOverview()
  if (!items) return <Loading error={error} retry={() => void reload()} />
  const active = items.filter((i) => i.publication_status !== 'archived')
  const count = (f: (i: InvitationOverview) => boolean) => active.filter(f).length
  const cards: [string, number][] = [
    ['Invitaciones', active.length],
    ['Publicadas', count((i) => i.publication_status === 'published')],
    ['Abiertas', count((i) => ['abierta', 'en_curso', 'confirmada'].includes(trackingOf(i)))],
    ['En curso', count((i) => trackingOf(i) === 'en_curso')],
    ['Confirmadas', count((i) => trackingOf(i) === 'confirmada')],
    ['Sin envío registrado', count((i) => trackingOf(i) === 'sin_envio' && i.publication_status === 'published')],
  ]
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-xl font-bold">Inicio</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([l, n]) => (
          <div key={l} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold text-rose-600">{n}</p>
            <p className="text-xs text-gray-500">{l}</p>
          </div>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Actividad reciente</h2>
        <Link className="text-sm text-rose-600 underline" to="/admin/invitaciones">Ver todas</Link>
      </div>
      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
          Aún no hay invitaciones. <Link className="text-rose-600 underline" to="/admin/invitaciones">Crea la primera</Link>.
        </div>
      ) : (
        <ul className="grid gap-2">
          {[...active].sort((a, b) => (b.last_opened_at ?? b.updated_at).localeCompare(a.last_opened_at ?? a.updated_at)).slice(0, 8).map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
              <Link to={`/admin/invitaciones/${i.id}/detalle`} className="min-w-0 flex-1 truncate font-semibold hover:underline">{i.internal_name} <span className="font-normal text-gray-400">· {i.recipient_name || 'sin destinatario'}</span></Link>
              <PublicationBadge s={i.publication_status} /><TrackingBadge o={i} />
              <span className="text-xs text-gray-400">{fmtDate(i.last_opened_at ?? i.updated_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
