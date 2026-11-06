import { useState } from 'react'
import type { InvitationConfig, Option, Step, StepType, AnimStyle } from '../../lib/types'
import { STEP_TYPE_LABELS, newOption, newStep } from '../../lib/defaults'
import { uid } from '../../lib/template'
import { removeFile } from '../../lib/media'
import {
  AreaField, ImageField, RangeField, SelectField, TextField, ToggleField, btnDanger, btnGhost, btnPrimary, inputCls, Field, Section,
} from './Fields'

type Update = (fn: (c: InvitationConfig) => void) => void

const ANIM_STYLES: { value: AnimStyle; label: string }[] = [
  { value: 'fade', label: 'Desvanecer' }, { value: 'slide', label: 'Deslizar' }, { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Voltear' }, { value: 'bounce', label: 'Rebote' },
]

function move<T>(arr: T[], i: number, d: number) {
  const j = i + d
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function OptionsEditor({ step, onChange }: { step: Step; onChange: (fn: (s: Step) => void) => void }) {
  return (
    <Section title={`Opciones (${step.options.length})`}>
      {step.options.map((o, i) => (
        <div key={o.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-500">Opción {i + 1} {o.emoji}</span>
            <div className="flex gap-1">
              <button type="button" className={btnGhost} aria-label="Subir" disabled={i === 0} onClick={() => onChange((s) => move(s.options, i, -1))}>↑</button>
              <button type="button" className={btnGhost} aria-label="Bajar" disabled={i === step.options.length - 1} onClick={() => onChange((s) => move(s.options, i, 1))}>↓</button>
              <button type="button" className={btnDanger} aria-label="Quitar opción"
                onClick={() => { void removeFile(o.image?.path); onChange((s) => { s.options.splice(i, 1) }) }}>✕</button>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-[84px_1fr] gap-2">
              <TextField label="Emoji" value={o.emoji} max={8} onChange={(v) => onChange((s) => { s.options[i].emoji = v })} />
              <TextField label="Nombre" value={o.label} onChange={(v) => onChange((s) => { s.options[i].label = v })} />
            </div>
            <TextField label="Descripción (opcional)" value={o.description} onChange={(v) => onChange((s) => { s.options[i].description = v })} />
            <ImageField label="Imagen (opcional)" value={o.image} onChange={(v) => onChange((s) => { s.options[i].image = v })} />
          </div>
        </div>
      ))}
      <button type="button" className={btnGhost} onClick={() => onChange((s) => { s.options.push(newOption('Nueva opción', '✨') as Option) })}>＋ Añadir opción</button>
    </Section>
  )
}

function StepEditor({ step, onChange }: { step: Step; onChange: (fn: (s: Step) => void) => void }) {
  const t = step.type
  const hasOptions = t === 'single_choice' || t === 'multi_choice' || t === 'cards'
  const asksSomething = ['single_choice', 'multi_choice', 'cards', 'datetime', 'text', 'question_buttons'].includes(t)
  return (
    <div className="grid gap-3">
      <Section title="Contenido">
        <TextField label="Nombre interno (solo tú lo ves)" value={step.name} onChange={(v) => onChange((s) => { s.name = v })} />
        <TextField label="Etiqueta superior" value={step.label} onChange={(v) => onChange((s) => { s.label = v })} hint="Ej.: INVITACIÓN OFICIAL. Puedes usar {destinatario} y {remitente}." />
        <div className="grid grid-cols-[84px_1fr] gap-2">
          <TextField label="Emoji" value={step.emoji} max={8} onChange={(v) => onChange((s) => { s.emoji = v })} />
          <TextField label="Título / pregunta" value={step.title} onChange={(v) => onChange((s) => { s.title = v })} />
        </div>
        <AreaField label="Notita / descripción" value={step.description} onChange={(v) => onChange((s) => { s.description = v })} />
        <TextField label="Firma" value={step.signature} onChange={(v) => onChange((s) => { s.signature = v })} />
        <ImageField label="Foto del paso" value={step.image} onChange={(v) => onChange((s) => { s.image = v })} />
      </Section>

      <Section title="Botones y mensajes">
        {t === 'question_buttons' ? (
          <>
            <div className="grid grid-cols-[84px_1fr] gap-2">
              <TextField label="Emoji “Sí”" value={step.yesEmoji} max={8} onChange={(v) => onChange((s) => { s.yesEmoji = v })} />
              <TextField label="Texto “Sí”" value={step.yesText} onChange={(v) => onChange((s) => { s.yesText = v })} />
            </div>
            <TextField label="Mensaje al aceptar" value={step.acceptMessage} onChange={(v) => onChange((s) => { s.acceptMessage = v })} />
            <ToggleField label="Mostrar botón “No” que se mueve" checked={step.showNoButton} onChange={(v) => onChange((s) => { s.showNoButton = v })}
              hint="Se configura en la pestaña “Botón No”. Sus intentos nunca se guardan como respuesta." />
          </>
        ) : (
          <TextField label="Texto del botón principal" value={step.buttonText} onChange={(v) => onChange((s) => { s.buttonText = v })} />
        )}
        <TextField label="Mensaje de transición (al avanzar)" value={step.transitionMessage} onChange={(v) => onChange((s) => { s.transitionMessage = v })} />
      </Section>

      {asksSomething && (
        <Section title="Respuesta">
          <ToggleField label="Obligatorio" checked={step.required} onChange={(v) => onChange((s) => { s.required = v })} />
          {(t === 'multi_choice' || t === 'cards') && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Mínimo a elegir"><input type="number" min={1} max={20} className={inputCls} value={step.minSelect} onChange={(e) => onChange((s) => { s.minSelect = Math.max(1, Number(e.target.value) || 1) })} /></Field>
              <Field label="Máximo a elegir"><input type="number" min={1} max={20} className={inputCls} value={step.maxSelect} onChange={(e) => onChange((s) => { s.maxSelect = Math.max(1, Number(e.target.value) || 1) })} /></Field>
            </div>
          )}
          {hasOptions && (
            <SelectField label="Distribución" value={step.layout} onChange={(v) => onChange((s) => { s.layout = v })}
              options={[{ value: 'list', label: 'Lista' }, { value: 'grid2', label: 'Cuadrícula de 2' }, { value: 'grid3', label: 'Cuadrícula de 3' }]} />
          )}
          {t === 'datetime' && (
            <>
              <ToggleField label="Pedir fecha" checked={step.askDate} onChange={(v) => onChange((s) => { s.askDate = v })} />
              <ToggleField label="Pedir hora" checked={step.askTime} onChange={(v) => onChange((s) => { s.askTime = v })} />
            </>
          )}
          {t === 'text' && <TextField label="Texto de ayuda del campo" value={step.placeholder} onChange={(v) => onChange((s) => { s.placeholder = v })} />}
        </Section>
      )}

      {hasOptions && <OptionsEditor step={step} onChange={onChange} />}

      {t === 'gallery' && (
        <Section title={`Fotos de la galería (${step.gallery.length})`}>
          {step.gallery.map((g, i) => (
            <div key={g.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex justify-end gap-1">
                <button type="button" className={btnGhost} disabled={i === 0} onClick={() => onChange((s) => move(s.gallery, i, -1))}>↑</button>
                <button type="button" className={btnGhost} disabled={i === step.gallery.length - 1} onClick={() => onChange((s) => move(s.gallery, i, 1))}>↓</button>
                <button type="button" className={btnDanger} onClick={() => { void removeFile(g.image.path); onChange((s) => { s.gallery.splice(i, 1) }) }}>✕</button>
              </div>
              <ImageField label={`Foto ${i + 1}`} value={g.image.url ? g.image : undefined}
                onChange={(v) => onChange((s) => { if (v) s.gallery[i].image = v; else s.gallery.splice(i, 1) })} />
              <div className="mt-2"><TextField label="Pie de foto" value={g.caption} onChange={(v) => onChange((s) => { s.gallery[i].caption = v })} /></div>
            </div>
          ))}
          <button type="button" className={btnGhost}
            onClick={() => onChange((s) => { s.gallery.push({ id: uid(), caption: '', image: { url: '', fit: 'cover', posX: 50, posY: 50, zoom: 1 } }) })}>＋ Añadir foto</button>
        </Section>
      )}

      <Section title="Animación de este paso" defaultOpen={false}>
        <SelectField label="Activación" value={step.anim.enabled === undefined ? 'inherit' : step.anim.enabled ? 'on' : 'off'}
          onChange={(v) => onChange((s) => { s.anim.enabled = v === 'inherit' ? undefined : v === 'on' })}
          options={[{ value: 'inherit', label: 'Igual que la invitación' }, { value: 'on', label: 'Activada' }, { value: 'off', label: 'Desactivada' }]} />
        <SelectField label="Estilo de entrada" value={step.anim.style ?? ('' as AnimStyle)} onChange={(v) => onChange((s) => { s.anim.style = v || undefined })}
          options={[{ value: '' as AnimStyle, label: 'Igual que la invitación' }, ...ANIM_STYLES]} />
        <RangeField label="Velocidad" value={step.anim.speed ?? 1} min={0.5} max={2} step={0.1} suffix="x" onChange={(v) => onChange((s) => { s.anim.speed = v })} />
        <RangeField label="Intensidad" value={step.anim.intensity ?? 60} min={0} max={100} suffix="%" onChange={(v) => onChange((s) => { s.anim.intensity = v })} />
      </Section>
    </div>
  )
}

export function StepsPanel({ cfg, update, selected, setSelected }: {
  cfg: InvitationConfig; update: Update; selected: string | null; setSelected: (id: string | null) => void
}) {
  const [adding, setAdding] = useState<StepType>('single_choice')
  const sel = cfg.steps.find((s) => s.id === selected)

  const patchStep = (id: string) => (fn: (s: Step) => void) => update((c) => { const s = c.steps.find((x) => x.id === id); if (s) fn(s) })

  if (sel) {
    return (
      <div className="grid gap-3">
        <button type="button" className={`${btnGhost} justify-self-start`} onClick={() => setSelected(null)}>← Volver a la lista de pasos</button>
        <p className="text-sm font-bold text-gray-800">Editando: {sel.name} <span className="font-normal text-gray-400">({STEP_TYPE_LABELS[sel.type]})</span></p>
        <StepEditor step={sel} onChange={patchStep(sel.id)} />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-gray-500">Los pasos ocultos no se muestran a la persona invitada. Arrastra con ↑ ↓ para reordenar.</p>
      <ol className="grid gap-2">
        {cfg.steps.map((s, i) => (
          <li key={s.id} className={`rounded-xl border bg-white p-3 ${s.hidden ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">{i + 1}</span>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelected(s.id)}>
                <span className="block truncate text-sm font-semibold text-gray-800">{s.emoji} {s.name || s.title}</span>
                <span className="block truncate text-[11px] text-gray-400">{STEP_TYPE_LABELS[s.type]}{s.required ? ' · obligatorio' : ''}{s.hidden ? ' · oculto' : ''}</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" className={btnGhost} onClick={() => setSelected(s.id)}>Editar</button>
              <button type="button" className={btnGhost} disabled={i === 0} aria-label="Subir" onClick={() => update((c) => move(c.steps, i, -1))}>↑</button>
              <button type="button" className={btnGhost} disabled={i === cfg.steps.length - 1} aria-label="Bajar" onClick={() => update((c) => move(c.steps, i, 1))}>↓</button>
              <button type="button" className={btnGhost} onClick={() => update((c) => { c.steps[i].hidden = !c.steps[i].hidden })}>{s.hidden ? 'Mostrar' : 'Ocultar'}</button>
              <button type="button" className={btnGhost} onClick={() => update((c) => {
                const copy: Step = structuredClone(c.steps[i])
                copy.id = uid(); copy.role = undefined; copy.name = `${copy.name} (copia)`
                copy.options = copy.options.map((o) => ({ ...o, id: uid() }))
                c.steps.splice(i + 1, 0, copy)
              })}>Duplicar</button>
              <button type="button" className={btnDanger} onClick={() => {
                if (window.confirm(`¿Eliminar el paso “${s.name}”? Las respuestas ya recibidas se conservan.`)) update((c) => { c.steps.splice(i, 1) })
              }}>Eliminar</button>
            </div>
          </li>
        ))}
        {cfg.steps.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">No hay pasos. Añade el primero.</li>}
      </ol>
      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 p-3">
        <div className="min-w-[200px] flex-1">
          <SelectField label="Tipo de paso nuevo" value={adding} onChange={setAdding}
            options={(Object.keys(STEP_TYPE_LABELS) as StepType[]).map((k) => ({ value: k, label: STEP_TYPE_LABELS[k] }))} />
        </div>
        <button type="button" className={btnPrimary} onClick={() => {
          const st = newStep(adding)
          update((c) => { c.steps.push(st) })
          setSelected(st.id)
        }}>＋ Añadir paso</button>
      </div>
    </div>
  )
}
