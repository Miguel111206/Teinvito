import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AnswerRow, InvitationRow, SendRow, SessionRow } from '../lib/types'
import { CHANNEL_LABELS, getInvitation, listAnswers, listSends, listSessions, publicUrl } from '../lib/api'
import { fmtDate } from '../lib/template'
import { describeAnswer } from '../runtime/answers'
import { btnGhost } from './builder/Fields'
import { Loading, MarkSentForm, PublicationBadge } from './shared'

interface Data { inv: InvitationRow; sends: SendRow[]; sessions: SessionRow[]; answers: AnswerRow[] }

export default function Detail() {
  const { id = '' } = useParams()
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      setErr('')
      const [inv, sends, sessions] = await Promise.all([getInvitation(id), listSends(id), listSessions(id)])
      const answers = await listAnswers(sessions.map((s) => s.id))
      setD({ inv, sends, sessions, answers })
    } catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo cargar') }
  }, [id])
  useEffect(() => { void load() }, [load])

  if (!d) return <Loading error={err} retry={() => void load()} />
  const { inv, sends, sessions, answers } = d
  const link = publicUrl(inv.token)
  const live = inv.publication_status === 'published'
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', link) } }
  const wa = `https://wa.me/?text=${encodeURIComponent(`Tengo una invitación para ti 💌 ${link}`)}`

  return (
    <div className="mx-auto max-w-5xl p-4">
      <Link to="/admin/invitaciones" className="text-sm text-gray-500 hover:underline">← Invitaciones</Link>
      <div className="mb-4 mt-1 flex flex-wrap items-center gap-2">
        <h1 className="flex-1 text-xl font-bold">{inv.internal_name}</h1>
        <PublicationBadge s={inv.publication_status} />
        <Link to={`/admin/invitaciones/${id}`} className={btnGhost}>Editar</Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm">
          <p className="font-semibold">Compartir</p>
          {inv.published_version_id ? (
            <>
              <code className="break-all rounded bg-gray-100 p-2 text-xs">{link}</code>
              {!live && <p className="text-xs text-red-600">El enlace está {inv.publication_status === 'disabled' ? 'desactivado' : 'archivado'}: quien lo abra verá un aviso.</p>}
              <div className="flex flex-wrap gap-2">
                <button className={btnGhost} onClick={copy}>{copied ? '¡Copiado!' : 'Copiar enlace'}</button>
                <a className={btnGhost} href={wa} target="_blank" rel="noreferrer">Abrir WhatsApp</a>
              </div>
              <p className="text-xs text-gray-500">Copiar el enlace o abrir WhatsApp no demuestra que enviaste el mensaje. Cuando lo envíes, regístralo a la derecha.</p>
            </>
          ) : <p className="text-gray-500">Aún no está publicada. Publica desde el editor para obtener el enlace.</p>}
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
            <dt>Creada</dt><dd>{fmtDate(inv.created_at)}</dd>
            <dt>Publicada</dt><dd>{fmtDate(inv.published_at)}</dd>
            <dt>Primera apertura</dt><dd>{fmtDate(inv.first_opened_at)}</dd>
            <dt>Última apertura</dt><dd>{fmtDate(inv.last_opened_at)}</dd>
          </dl>
          <p className="text-[11px] text-gray-400">Las aperturas son orientativas: corresponden al enlace y no prueban la identidad de quien lo abrió.</p>
        </div>
        <div className="grid gap-3">
          <MarkSentForm invitationId={id} onDone={() => void load()} />
          {sends.length > 0 && (
            <ul className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
              {sends.map((s) => (
                <li key={s.id} className="border-b border-gray-100 py-1 last:border-0">
                  {fmtDate(s.sent_at)} · {CHANNEL_LABELS[s.channel]} · <span className="text-gray-400">registrado por el administrador</span>{s.note ? ` · ${s.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="mb-2 font-bold">Sesiones y respuestas ({sessions.length})</h2>
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">Nadie ha abierto esta invitación todavía.</div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s, n) => {
            const mine = answers.filter((a) => a.session_id === s.id).sort((a, b) => a.answered_at.localeCompare(b.answered_at))
            const yes = mine.find((a) => a.step_type === 'question_buttons')
            return (
              <section key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">Sesión {sessions.length - n}</h3>
                  {s.confirmed_at
                    ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Confirmada {fmtDate(s.confirmed_at)}</span>
                    : <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">{mine.length || s.started_at ? 'En curso: selecciones parciales, sin confirmar' : 'Solo abierta'}</span>}
                </div>
                <ul className="mb-3 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                  <li>👀 Abierta: {fmtDate(s.created_at)}</li>
                  <li>{yes ? '✅' : '⬜'} Pulsó “Sí”: {yes ? fmtDate(yes.answered_at) : 'no'}</li>
                  <li>{s.started_at ? '✅' : '⬜'} Inició el recorrido: {fmtDate(s.started_at)}</li>
                  <li>{s.confirmed_at ? '✅' : '⬜'} Terminó y confirmó: {fmtDate(s.confirmed_at)}</li>
                </ul>
                {mine.length === 0 ? <p className="text-sm text-gray-400">Sin respuestas guardadas.</p> : (
                  <ul className="grid gap-2">
                    {mine.map((a) => (
                      <li key={a.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="text-xs font-semibold text-gray-500" style={{ overflowWrap: 'anywhere' }}>{a.question_text || a.step_id}</p>
                        <p className="font-medium text-gray-900" style={{ overflowWrap: 'anywhere' }}>{describeAnswer(a.answer, '—')}</p>
                        <p className="text-[11px] text-gray-400">{fmtDate(a.updated_at)}{!s.confirmed_at ? ' · parcial' : ''}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
