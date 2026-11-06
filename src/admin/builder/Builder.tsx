import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router-dom'
import type { InvitationConfig, InvitationRow } from '../../lib/types'
import { getInvitation, getVersionConfig, publicUrl, publish, saveDraft, setStatus, PUBLICATION_LABELS } from '../../lib/api'
import { BuilderCtx, btnGhost, btnPrimary } from './Fields'
import { StepsPanel } from './StepsPanel'
import { AnimationsPanel, AppearancePanel, GeneralPanel, MusicPanel, NoButtonPanel, TonePanel } from './StylePanels'
import { Preview } from './Preview'

const TABS = [
  ['pasos', '🧩 Pasos'], ['tono', '🎭 Tono'], ['general', '✏️ General'], ['apariencia', '🎨 Apariencia'],
  ['musica', '🎵 Música'], ['animaciones', '✨ Animaciones'], ['no', '🙈 Botón No'],
] as const
type Tab = (typeof TABS)[number][0]

export default function Builder() {
  const { id = '' } = useParams()
  const [inv, setInv] = useState<InvitationRow | null>(null)
  const [cfg, setCfg] = useState<InvitationConfig | null>(null)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState('')
  const [pubJson, setPubJson] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pasos')
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [busy, setBusy] = useState<'' | 'save' | 'publish'>('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoadErr('')
      const row = await getInvitation(id)
      setInv(row); setCfg(row.draft_config); setName(row.internal_name)
      setSaved(JSON.stringify({ c: row.draft_config, n: row.internal_name }))
      setPubJson(row.published_version_id ? JSON.stringify(await getVersionConfig(row.published_version_id)) : null)
    } catch (e) { setLoadErr(e instanceof Error ? e.message : 'No se pudo cargar') }
  }, [id])
  useEffect(() => { void load() }, [load])

  const dirty = useMemo(() => cfg !== null && JSON.stringify({ c: cfg, n: name }) !== saved, [cfg, name, saved])
  const unpublished = useMemo(
    () => cfg !== null && inv?.publication_status !== 'draft' && pubJson !== null && JSON.stringify(cfg) !== pubJson,
    [cfg, inv, pubJson],
  )

  // Aviso de cambios sin guardar (cierre de pestaña y navegación interna)
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])
  const blocker = useBlocker(dirty)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) blocker.proceed(); else blocker.reset()
    }
  }, [blocker])

  const update = useCallback((fn: (c: InvitationConfig) => void) => {
    setCfg((prev) => { if (!prev) return prev; const n = structuredClone(prev); fn(n); return n })
  }, [])
  const replace = useCallback((c: InvitationConfig) => setCfg(c), [])

  if (loadErr) return <div className="p-6 text-red-600" role="alert">{loadErr} <button className={btnGhost} onClick={() => void load()}>Reintentar</button></div>
  if (!inv || !cfg) return <div className="p-6 text-gray-500" role="status">Cargando editor…</div>

  const doSave = async () => {
    setBusy('save'); setMsg(null)
    try { await saveDraft(id, cfg, name); setSaved(JSON.stringify({ c: cfg, n: name })); setMsg({ ok: true, text: 'Borrador guardado. La versión pública no cambió.' }) }
    catch (e) { setMsg({ ok: false, text: `No se pudo guardar: ${e instanceof Error ? e.message : 'error'}` }) }
    finally { setBusy('') }
  }

  const doPublish = async () => {
    if (!window.confirm('Se publicará esta versión y el enlace público mostrará estos cambios. Las sesiones ya iniciadas siguen con la versión que abrieron. ¿Continuar?')) return
    setBusy('publish'); setMsg(null)
    try {
      await publish(id, cfg)
      await saveDraft(id, cfg, name)
      setSaved(JSON.stringify({ c: cfg, n: name }))
      await load()
      setMsg({ ok: true, text: 'Publicada. El enlace ya muestra esta versión.' })
    } catch (e) { setMsg({ ok: false, text: `No se pudo publicar: ${e instanceof Error ? e.message : 'error'}` }) }
    finally { setBusy('') }
  }

  const toggleLink = async () => {
    const next = inv.publication_status === 'published' ? 'disabled' : 'published'
    try { await setStatus(id, next); await load() } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Error' }) }
  }

  const link = publicUrl(inv.token)
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { window.prompt('Copia el enlace:', link) } }

  return (
    <BuilderCtx.Provider value={{ invitationId: id }}>
      <div className="flex min-h-full flex-col">
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
            <Link to="/admin/invitaciones" className="text-sm text-gray-500 hover:underline">← Invitaciones</Link>
            <h1 className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">{name || 'Sin nombre'}</h1>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{PUBLICATION_LABELS[inv.publication_status]}</span>
            {dirty && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Sin guardar</span>}
            {!dirty && unpublished && <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">Cambios sin publicar</span>}
            <button className={btnGhost} onClick={doSave} disabled={busy !== '' || !dirty}>{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
            <button className={btnPrimary} onClick={doPublish} disabled={busy !== ''}>{busy === 'publish' ? 'Publicando…' : 'Publicar cambios'}</button>
          </div>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mx-auto mt-2 max-w-[1400px] text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
          {inv.published_version_id && (
            <div className="mx-auto mt-2 flex max-w-[1400px] flex-wrap items-center gap-2 text-xs text-gray-600">
              <code className="max-w-full truncate rounded bg-gray-100 px-2 py-1">{link}</code>
              <button className={btnGhost} onClick={copy}>{copied ? '¡Copiado!' : 'Copiar enlace'}</button>
              <button className={btnGhost} onClick={toggleLink}>{inv.publication_status === 'published' ? 'Desactivar enlace' : 'Reactivar enlace'}</button>
              <Link className={btnGhost} to={`/admin/invitaciones/${id}/detalle`}>Envíos y respuestas</Link>
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4">
          <div className="mb-3 flex gap-2 lg:hidden">
            <button className={view === 'edit' ? btnPrimary : btnGhost} onClick={() => setView('edit')}>Editar</button>
            <button className={view === 'preview' ? btnPrimary : btnGhost} onClick={() => setView('preview')}>Vista previa</button>
          </div>
          <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
            <div className={view === 'edit' ? 'block' : 'hidden lg:block'}>
              <div className="mb-3 flex flex-wrap gap-1" role="tablist">
                {TABS.map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); if (k !== 'pasos') setSelected(null) }}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === k ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>{l}</button>
                ))}
              </div>
              {tab === 'pasos' && <StepsPanel cfg={cfg} update={update} selected={selected} setSelected={setSelected} />}
              {tab === 'tono' && <TonePanel cfg={cfg} update={update} replace={replace} />}
              {tab === 'general' && <GeneralPanel cfg={cfg} update={update} replace={replace} internalName={name} setInternalName={setName} />}
              {tab === 'apariencia' && <AppearancePanel cfg={cfg} update={update} replace={replace} />}
              {tab === 'musica' && <MusicPanel cfg={cfg} update={update} replace={replace} />}
              {tab === 'animaciones' && <AnimationsPanel cfg={cfg} update={update} replace={replace} />}
              {tab === 'no' && <NoButtonPanel cfg={cfg} update={update} replace={replace} />}
            </div>
            <div className={view === 'preview' ? 'block' : 'hidden lg:block'}>
              <div className="lg:sticky lg:top-36"><Preview cfg={cfg} /></div>
            </div>
          </div>
        </div>
      </div>
    </BuilderCtx.Provider>
  )
}
