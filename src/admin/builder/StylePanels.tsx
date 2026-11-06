import { useRef, useState } from 'react'
import type { AnimStyle, InvitationConfig, ToneId } from '../../lib/types'
import { FONT_OPTIONS } from '../../lib/types'
import { THEMES, TONES, getTheme, hasEditsFromBaseline, mergeTone } from '../../lib/defaults'
import { fill, varsOf } from '../../lib/template'
import { removeFile, uploadAudio } from '../../lib/media'
import {
  AreaField, BuilderCtx, ColorField, ImageField, RangeField, Section, SelectField, TextField, ToggleField, btnDanger, btnGhost, btnPrimary, Field, inputCls,
} from './Fields'
import { useContext } from 'react'

type Update = (fn: (c: InvitationConfig) => void) => void
interface P { cfg: InvitationConfig; update: Update; replace: (c: InvitationConfig) => void }

const fonts = FONT_OPTIONS.map((f) => ({ value: f, label: f }))
const ANIM_STYLES: { value: AnimStyle; label: string }[] = [
  { value: 'fade', label: 'Desvanecer' }, { value: 'slide', label: 'Deslizar' }, { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Voltear' }, { value: 'bounce', label: 'Rebote' },
]

// ------------------------------------------------------------ Tono
export function TonePanel({ cfg, replace }: P) {
  const vars = varsOf(cfg)
  const apply = (id: ToneId) => {
    if (id !== 'personalizado' && hasEditsFromBaseline(cfg) &&
      !window.confirm('Esta invitación tiene cambios hechos por ti. Aplicar el tono sobrescribirá textos y apariencia de los pasos estándar. ¿Continuar?')) return
    replace(mergeTone(cfg, id))
  }
  return (
    <div className="grid gap-3">
      <p className="text-xs text-gray-500">Cada tono propone textos y apariencia iniciales. Después puedes cambiar todo manualmente. Los pasos que añadiste y las fotos no se tocan.</p>
      <div className="grid grid-cols-2 gap-2">
        {TONES.map((t) => (
          <button key={t.id} type="button" onClick={() => apply(t.id)}
            className={`rounded-xl border p-3 text-left ${cfg.meta.tone === t.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <span className="text-2xl">{t.emoji}</span>
            <span className="block text-sm font-bold text-gray-800">{t.name}</span>
            <span className="block text-[11px] text-gray-500">{t.description}</span>
          </button>
        ))}
      </div>
      <Section title="Variables y vista previa" defaultOpen>
        <p className="text-xs text-gray-500">Usa <code>{'{destinatario}'}</code> y <code>{'{remitente}'}</code> en cualquier texto.</p>
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <p className="text-xs font-semibold text-gray-500">Así se verá:</p>
          <p>{fill('Hola {destinatario}, te escribe {remitente}.', vars as unknown as Record<string, string>)}</p>
        </div>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ General (nombres, textos de interfaz, final)
const TEXT_LABELS: Record<string, string> = {
  envelopeTitle: 'Pantalla del sobre: título', envelopeSubtitle: 'Pantalla del sobre: subtítulo', envelopeButton: 'Botón para abrir',
  nextButton: 'Botón continuar (por defecto)', backButton: 'Botón atrás', confirmButton: 'Botón confirmar (por defecto)',
  progressLabel: 'Texto de progreso ({actual} de {total})', saving: 'Texto al guardar', saveError: 'Mensaje de error al guardar', retry: 'Botón reintentar',
  privacyNote: 'Aviso de privacidad', summaryTitle: 'Título del resumen', requiredHint: 'Aviso de respuesta obligatoria',
  datePlaceholder: 'Etiqueta de fecha', timePlaceholder: 'Etiqueta de hora', noAnswer: 'Texto “sin respuesta”',
  musicPlay: 'Música: reproducir', musicPause: 'Música: pausar', musicMute: 'Música: silenciar', musicUnmute: 'Música: activar sonido',
  disabledTitle: 'Enlace desactivado: título', disabledText: 'Enlace desactivado: texto', notFoundTitle: 'No encontrada: título', notFoundText: 'No encontrada: texto',
}

export function GeneralPanel({ cfg, update, internalName, setInternalName }: P & { internalName: string; setInternalName: (v: string) => void }) {
  return (
    <div className="grid gap-3">
      <Section title="Nombres">
        <TextField label="Nombre interno de la invitación" value={internalName} onChange={setInternalName} hint="Solo lo ves tú en el panel." />
        <TextField label="Destinatario ({destinatario})" value={cfg.meta.recipient} onChange={(v) => update((c) => { c.meta.recipient = v })} />
        <TextField label="Remitente ({remitente})" value={cfg.meta.sender} onChange={(v) => update((c) => { c.meta.sender = v })} />
      </Section>
      <Section title="Pantalla final (tras confirmar)">
        <div className="grid grid-cols-[84px_1fr] gap-2">
          <TextField label="Emoji" value={cfg.final.emoji} max={8} onChange={(v) => update((c) => { c.final.emoji = v })} />
          <TextField label="Título" value={cfg.final.title} onChange={(v) => update((c) => { c.final.title = v })} />
        </div>
        <AreaField label="Mensaje final" value={cfg.final.message} onChange={(v) => update((c) => { c.final.message = v })} />
        <TextField label="Firma" value={cfg.final.signature} onChange={(v) => update((c) => { c.final.signature = v })} />
        <ImageField label="Foto final" value={cfg.final.image} onChange={(v) => update((c) => { c.final.image = v })} />
      </Section>
      <Section title="Textos de la interfaz" defaultOpen={false}>
        {(Object.keys(cfg.texts) as (keyof typeof cfg.texts)[]).map((k) => (
          <TextField key={k} label={TEXT_LABELS[k] ?? k} value={cfg.texts[k]} onChange={(v) => update((c) => { c.texts[k] = v })} />
        ))}
        <p className="text-[11px] text-gray-400">Los textos de “enlace desactivado / no encontrada” se muestran antes de cargar la invitación, por eso usan los valores por defecto del sistema.</p>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ Apariencia
export function AppearancePanel({ cfg, update, replace }: P) {
  const th = cfg.theme
  const restore = () => {
    if (!window.confirm('Se restaurarán los valores originales del tema elegido (se pierden tus cambios de apariencia). ¿Continuar?')) return
    const keep = th.background.image
    replace({ ...cfg, theme: { ...getTheme(cfg.meta.themeId), background: { ...getTheme(cfg.meta.themeId).background, ...(keep ? {} : {}) } } })
  }
  return (
    <div className="grid gap-3">
      <Section title="Temas">
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => replace({ ...cfg, meta: { ...cfg.meta, themeId: t.id }, theme: getTheme(t.id) })}
              className={`overflow-hidden rounded-xl border-2 text-left ${cfg.meta.themeId === t.id ? 'border-rose-500' : 'border-gray-200'}`}>
              <div className="h-10" style={{ backgroundImage: `linear-gradient(120deg, ${t.theme.background.from}, ${t.theme.background.to})`, backgroundColor: t.theme.background.color }} />
              <div className="px-2 py-1 text-xs font-semibold text-gray-700">{t.name}</div>
            </button>
          ))}
        </div>
        <button type="button" className={btnGhost} onClick={restore}>↺ Restaurar valores del tema</button>
      </Section>

      <Section title="Fondo">
        <SelectField label="Tipo" value={th.background.type} onChange={(v) => update((c) => { c.theme.background.type = v })}
          options={[{ value: 'solid', label: 'Color sólido' }, { value: 'gradient', label: 'Degradado' }, { value: 'image', label: 'Fotografía' }]} />
        {th.background.type === 'solid' && <ColorField label="Color" value={th.background.color} onChange={(v) => update((c) => { c.theme.background.color = v })} />}
        {th.background.type === 'gradient' && (
          <>
            <ColorField label="Color inicial" value={th.background.from} onChange={(v) => update((c) => { c.theme.background.from = v })} />
            <ColorField label="Color final" value={th.background.to} onChange={(v) => update((c) => { c.theme.background.to = v })} />
            <RangeField label="Ángulo" value={th.background.angle} min={0} max={360} suffix="°" onChange={(v) => update((c) => { c.theme.background.angle = v })} />
          </>
        )}
        {th.background.type === 'image' && (
          <>
            <ImageField label="Foto de fondo" value={th.background.image} onChange={(v) => update((c) => { c.theme.background.image = v })} />
            <RangeField label="Oscurecer foto" value={th.background.overlay} min={0} max={80} suffix="%" onChange={(v) => update((c) => { c.theme.background.overlay = v })} />
          </>
        )}
      </Section>

      <Section title="Tarjeta">
        <ColorField label="Fondo" value={th.card.bg} onChange={(v) => update((c) => { c.theme.card.bg = v })} />
        <ColorField label="Borde" value={th.card.border} onChange={(v) => update((c) => { c.theme.card.border = v })} />
        <RangeField label="Grosor del borde" value={th.card.borderWidth} min={0} max={6} suffix="px" onChange={(v) => update((c) => { c.theme.card.borderWidth = v })} />
        <RangeField label="Redondeo" value={th.card.radius} min={0} max={48} suffix="px" onChange={(v) => update((c) => { c.theme.card.radius = v })} />
        <RangeField label="Ancho máximo" value={th.card.maxWidth} min={300} max={640} step={10} suffix="px" onChange={(v) => update((c) => { c.theme.card.maxWidth = v })} />
        <SelectField label="Sombra" value={th.card.shadow} onChange={(v) => update((c) => { c.theme.card.shadow = v })}
          options={[{ value: 'none', label: 'Sin sombra' }, { value: 'soft', label: 'Suave' }, { value: 'medium', label: 'Media' }, { value: 'strong', label: 'Fuerte' }]} />
      </Section>

      <Section title="Texto y tipografía">
        <ColorField label="Color de títulos" value={th.text.title} onChange={(v) => update((c) => { c.theme.text.title = v })} />
        <ColorField label="Color de texto" value={th.text.body} onChange={(v) => update((c) => { c.theme.text.body = v })} />
        <ColorField label="Color de etiquetas" value={th.text.label} onChange={(v) => update((c) => { c.theme.text.label = v })} />
        <ColorField label="Color de acento" value={th.text.accent} onChange={(v) => update((c) => { c.theme.text.accent = v })} />
        <SelectField label="Fuente de títulos" value={th.fonts.title} options={fonts} onChange={(v) => update((c) => { c.theme.fonts.title = v })} />
        <SelectField label="Fuente de texto" value={th.fonts.body} options={fonts} onChange={(v) => update((c) => { c.theme.fonts.body = v })} />
        <RangeField label="Tamaño de títulos" value={th.sizes.title} min={20} max={52} suffix="px" onChange={(v) => update((c) => { c.theme.sizes.title = v })} />
        <RangeField label="Tamaño de texto" value={th.sizes.body} min={13} max={22} suffix="px" onChange={(v) => update((c) => { c.theme.sizes.body = v })} />
        <SelectField label="Alineación" value={th.align} onChange={(v) => update((c) => { c.theme.align = v })}
          options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]} />
      </Section>

      <Section title="Botones" defaultOpen={false}>
        <SelectField label="Estilo" value={th.button.style} onChange={(v) => update((c) => { c.theme.button.style = v })}
          options={[{ value: 'solid', label: 'Sólido' }, { value: 'gradient', label: 'Degradado' }, { value: 'outline', label: 'Contorno' }]} />
        <ColorField label="Color principal" value={th.button.bg} onChange={(v) => update((c) => { c.theme.button.bg = v })} />
        <ColorField label="Color secundario (degradado)" value={th.button.bg2} onChange={(v) => update((c) => { c.theme.button.bg2 = v })} />
        <ColorField label="Color del texto" value={th.button.text} onChange={(v) => update((c) => { c.theme.button.text = v })} />
        <RangeField label="Redondeo" value={th.button.radius} min={0} max={999} step={1} suffix="px" onChange={(v) => update((c) => { c.theme.button.radius = v })} />
      </Section>

      <Section title="Imágenes" defaultOpen={false}>
        <SelectField label="Forma" value={th.image.shape} onChange={(v) => update((c) => { c.theme.image.shape = v })}
          options={[{ value: 'rounded', label: 'Redondeada' }, { value: 'circle', label: 'Círculo' }, { value: 'square', label: 'Cuadrada' }, { value: 'arch', label: 'Arco' }]} />
        <SelectField label="Proporción" value={th.image.ratio} onChange={(v) => update((c) => { c.theme.image.ratio = v })}
          options={[{ value: '16/9', label: '16:9' }, { value: '4/3', label: '4:3' }, { value: '1/1', label: '1:1' }, { value: '3/4', label: '3:4 (vertical)' }]} />
        <RangeField label="Redondeo" value={th.image.radius} min={0} max={48} suffix="px" onChange={(v) => update((c) => { c.theme.image.radius = v })} />
      </Section>

      <Section title="Opciones y tarjetas" defaultOpen={false}>
        <SelectField label="Estilo" value={th.options.style} onChange={(v) => update((c) => { c.theme.options.style = v })}
          options={[{ value: 'card', label: 'Tarjeta' }, { value: 'pill', label: 'Píldora' }, { value: 'outline', label: 'Contorno' }, { value: 'minimal', label: 'Minimalista' }]} />
        <ColorField label="Fondo" value={th.options.bg} onChange={(v) => update((c) => { c.theme.options.bg = v })} />
        <ColorField label="Borde" value={th.options.border} onChange={(v) => update((c) => { c.theme.options.border = v })} />
        <ColorField label="Fondo seleccionada" value={th.options.selectedBg} onChange={(v) => update((c) => { c.theme.options.selectedBg = v })} />
        <ColorField label="Borde seleccionada" value={th.options.selectedBorder} onChange={(v) => update((c) => { c.theme.options.selectedBorder = v })} />
        <ColorField label="Texto" value={th.options.text} onChange={(v) => update((c) => { c.theme.options.text = v })} />
      </Section>

      <Section title="Visibilidad de secciones" defaultOpen={false}>
        {([['label', 'Etiquetas superiores'], ['image', 'Fotos de los pasos'], ['description', 'Notitas y descripciones'], ['signature', 'Firmas'], ['progress', 'Barra de progreso'], ['transitions', 'Mensajes de transición']] as const).map(([k, l]) => (
          <ToggleField key={k} label={l} checked={th.visibility[k]} onChange={(v) => update((c) => { c.theme.visibility[k] = v })} />
        ))}
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ Música
export function MusicPanel({ cfg, update }: P) {
  const { invitationId } = useContext(BuilderCtx)
  const m = cfg.music
  const input = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState('')

  const pick = async (file?: File) => {
    if (!file) return
    setErr(''); setPct(0)
    try {
      const up = await uploadAudio(file, invitationId, setPct)
      const old = m.path
      update((c) => { c.music.url = up.url; c.music.path = up.path; c.music.fileName = file.name; c.music.enabled = true })
      void removeFile(old)
    } catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo subir la canción.') }
    finally { setPct(null); if (input.current) input.current.value = '' }
  }

  return (
    <div className="grid gap-3">
      <Section title="Canción">
        <ToggleField label="Activar música" checked={m.enabled} onChange={(v) => update((c) => { c.music.enabled = v })} />
        <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={pct !== null} onClick={() => input.current?.click()}>{m.url ? 'Reemplazar canción' : '🎵 Subir canción'}</button>
          {m.url && <button type="button" className={btnDanger} onClick={() => { void removeFile(m.path); update((c) => { c.music.url = ''; c.music.path = undefined; c.music.fileName = undefined }) }}>Quitar</button>}
        </div>
        {pct !== null && <p role="status" className="text-xs text-gray-500">Subiendo… {pct}%</p>}
        {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
        {m.url && (
          <div>
            <p className="mb-1 text-xs text-gray-500">{m.fileName ?? 'Canción cargada'}</p>
            <audio controls src={m.url} className="w-full" />
          </div>
        )}
        <p className="text-[11px] text-gray-400">El navegador no permite sonido automático: la música empieza cuando la persona toca un botón (por ejemplo “Abrir invitación”).</p>
      </Section>
      <Section title="Reproducción">
        <RangeField label="Volumen inicial" value={m.volume} min={0} max={100} suffix="%" onChange={(v) => update((c) => { c.music.volume = v })} />
        <ToggleField label="Repetir en bucle" checked={m.loop} onChange={(v) => update((c) => { c.music.loop = v })} />
        <SelectField label="Momento de inicio" value={m.startAt} onChange={(v) => update((c) => { c.music.startAt = v })}
          options={[{ value: 'envelope', label: 'Al abrir la invitación (sobre)' }, { value: 'first_step', label: 'Al avanzar desde el primer paso' }, { value: 'accept', label: 'Al pulsar “Sí”' }]} />
        <SelectField label="Reproductor" value={m.playerVisibility} onChange={(v) => update((c) => { c.music.playerVisibility = v })}
          options={[{ value: 'visible', label: 'Visible' }, { value: 'discreet', label: 'Discreto' }, { value: 'hidden', label: 'Oculto' }]} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ Animaciones
export function AnimationsPanel({ cfg, update }: P) {
  const a = cfg.animations
  return (
    <div className="grid gap-3">
      <Section title="General">
        <ToggleField label="Activar animaciones" checked={a.enabled} onChange={(v) => update((c) => { c.animations.enabled = v })} hint="Si la persona usa “reducir movimiento” en su dispositivo, se desactivan automáticamente." />
        <RangeField label="Intensidad" value={a.intensity} min={0} max={100} suffix="%" onChange={(v) => update((c) => { c.animations.intensity = v })} />
        <RangeField label="Velocidad" value={a.speed} min={0.5} max={2} step={0.1} suffix="x" onChange={(v) => update((c) => { c.animations.speed = v })} />
        <SelectField label="Transición entre pasos" value={a.stepTransition} options={ANIM_STYLES} onChange={(v) => update((c) => { c.animations.stepTransition = v })} />
      </Section>
      <Section title="Efectos">
        <ToggleField label="Apertura del sobre" checked={a.envelope} onChange={(v) => update((c) => { c.animations.envelope = v })} />
        <ToggleField label="Aparición progresiva de textos" checked={a.textReveal} onChange={(v) => update((c) => { c.animations.textReveal = v })} />
        <ToggleField label="Botones con rebote" checked={a.buttonBounce} onChange={(v) => update((c) => { c.animations.buttonBounce = v })} />
        <ToggleField label="Tarjetas que reaccionan al elegirlas" checked={a.cardReaction} onChange={(v) => update((c) => { c.animations.cardReaction = v })} />
        <ToggleField label="Reacciones con emojis" checked={a.emojiReaction} onChange={(v) => update((c) => { c.animations.emojiReaction = v })} />
        <ToggleField label="Animación de fotos" checked={a.photoAnimation} onChange={(v) => update((c) => { c.animations.photoAnimation = v })} />
        <ToggleField label="Confeti al aceptar / confirmar" checked={a.confetti} onChange={(v) => update((c) => { c.animations.confetti = v })} />
        <TextField label="Emojis del confeti" value={a.confettiEmojis} max={24} onChange={(v) => update((c) => { c.animations.confettiEmojis = v })} />
      </Section>
      <Section title="Corazones y partículas">
        <ToggleField label="Corazones flotantes" checked={a.hearts.enabled} onChange={(v) => update((c) => { c.animations.hearts.enabled = v })} />
        <TextField label="Emoji de corazones" value={a.hearts.emoji} max={8} onChange={(v) => update((c) => { c.animations.hearts.emoji = v })} />
        <RangeField label="Cantidad" value={a.hearts.count} min={0} max={40} onChange={(v) => update((c) => { c.animations.hearts.count = v })} />
        <ToggleField label="Partículas" checked={a.particles.enabled} onChange={(v) => update((c) => { c.animations.particles.enabled = v })} />
        <TextField label="Emoji de partículas" value={a.particles.emoji} max={8} onChange={(v) => update((c) => { c.animations.particles.emoji = v })} />
        <RangeField label="Cantidad" value={a.particles.count} min={0} max={40} onChange={(v) => update((c) => { c.animations.particles.count = v })} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ Botón "No"
export function NoButtonPanel({ cfg, update }: P) {
  const n = cfg.noButton
  const msgs = n.funnyMessages.join('\n')
  return (
    <div className="grid gap-3">
      <p className="text-xs text-gray-500">Aparece en los pasos “Pregunta con botones” que tengan activado el botón “No”. Nunca se guarda como respuesta.</p>
      <Section title="Apariencia">
        <div className="grid grid-cols-[84px_1fr] gap-2">
          <TextField label="Emoji" value={n.emoji} max={8} onChange={(v) => update((c) => { c.noButton.emoji = v })} />
          <TextField label="Texto" value={n.text} max={30} onChange={(v) => update((c) => { c.noButton.text = v })} />
        </div>
        <RangeField label="Tamaño del texto" value={n.size} min={12} max={28} suffix="px" onChange={(v) => update((c) => { c.noButton.size = v })} />
        <ColorField label="Color de fondo" value={n.bg} onChange={(v) => update((c) => { c.noButton.bg = v })} />
        <ColorField label="Color del texto" value={n.color} onChange={(v) => update((c) => { c.noButton.color = v })} />
      </Section>
      <Section title="Movimiento">
        <SelectField label="Estilo" value={n.style} onChange={(v) => update((c) => { c.noButton.style = v })}
          options={[{ value: 'smooth', label: 'Suave' }, { value: 'teleport', label: 'Teletransporte' }, { value: 'spin', label: 'Giratorio' }, { value: 'shrink', label: 'Se encoge' }]} />
        <RangeField label="Velocidad" value={n.speed} min={0.5} max={2} step={0.1} suffix="x" onChange={(v) => update((c) => { c.noButton.speed = v })} />
        <RangeField label="Distancia" value={n.distance} min={40} max={300} suffix="px" onChange={(v) => update((c) => { c.noButton.distance = v })} />
      </Section>
      <Section title="Frases divertidas">
        <RangeField label="Aparecen tras N intentos" value={n.messagesAfter} min={0} max={10} onChange={(v) => update((c) => { c.noButton.messagesAfter = v })} />
        <Field label="Frases (una por línea)">
          <textarea className={inputCls} rows={5} value={msgs} onChange={(e) => update((c) => { c.noButton.funnyMessages = e.target.value.split('\n').slice(0, 20) })} />
        </Field>
      </Section>
    </div>
  )
}
