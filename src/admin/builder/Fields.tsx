import { createContext, useContext, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ImageRef } from '../../lib/types'
import { emptyImage } from '../../lib/defaults'
import { removeFile, uploadImage } from '../../lib/media'

export const BuilderCtx = createContext<{ invitationId: string }>({ invitationId: '' })

export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
export const btnCls =
  'inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-50'
export const btnPrimary = `${btnCls} bg-rose-600 text-white hover:bg-rose-700`
export const btnGhost = `${btnCls} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`
export const btnDanger = `${btnCls} border border-red-200 bg-white text-red-600 hover:bg-red-50`

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

export function TextField({ label, value, onChange, hint, placeholder, max = 300 }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; max?: number
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputCls} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function AreaField({ label, value, onChange, hint, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea className={inputCls} rows={rows} value={value} maxLength={1200} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function RangeField({ label, value, min, max, step = 1, onChange, suffix = '' }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string
}) {
  return (
    <Field label={`${label}: ${value}${suffix}`}>
      <input type="range" className="w-full accent-rose-600" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </Field>
  )
}

export function ToggleField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-0.5 h-5 w-5 accent-rose-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
        {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}
      </label>
    </div>
  )
}

export function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hex = /^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : '#000000'
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" className="h-9 w-11 shrink-0 cursor-pointer rounded border border-gray-300 bg-white p-0.5" value={hex} onChange={(e) => onChange(e.target.value)} />
        <input className={inputCls} value={value} maxLength={9} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  )
}

export function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer select-none list-none rounded-xl px-4 py-3 text-sm font-bold text-gray-800">
        <span className="mr-2 inline-block text-gray-400 transition group-open:rotate-90">▸</span>{title}
      </summary>
      <div className="grid gap-3 border-t border-gray-100 px-4 py-4">{children}</div>
    </details>
  )
}

// Subida de foto con vista previa, progreso, errores, reemplazo, eliminación y encuadre.
export function ImageField({ label, value, onChange }: { label: string; value?: ImageRef; onChange: (v: ImageRef | undefined) => void }) {
  const { invitationId } = useContext(BuilderCtx)
  const input = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState('')

  const pick = async (file?: File) => {
    if (!file) return
    setErr(''); setPct(0)
    try {
      const up = await uploadImage(file, invitationId, setPct)
      const old = value?.path
      onChange({ ...(value ?? emptyImage()), url: up.url, path: up.path })
      void removeFile(old)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo subir la imagen.')
    } finally {
      setPct(null)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">{label}</p>
      {value?.url && (
        <div className="mb-3 overflow-hidden rounded-lg bg-gray-100" style={{ aspectRatio: '16/9' }}>
          <img src={value.url} alt="" className="h-full w-full"
            style={{ objectFit: value.fit, objectPosition: `${value.posX}% ${value.posY}%`, transform: `scale(${value.zoom})`, transformOrigin: `${value.posX}% ${value.posY}%` }} />
        </div>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnGhost} disabled={pct !== null} onClick={() => input.current?.click()}>
          {value?.url ? 'Reemplazar foto' : '📷 Subir foto'}
        </button>
        {value?.url && (
          <button type="button" className={btnDanger} disabled={pct !== null}
            onClick={() => { void removeFile(value.path); onChange(undefined) }}>Quitar</button>
        )}
      </div>
      {pct !== null && (
        <div className="mt-2" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-gray-500">Subiendo… {pct}%</p>
        </div>
      )}
      {err && <p role="alert" className="mt-2 text-xs text-red-600">{err}</p>}
      {value?.url && (
        <div className="mt-3 grid gap-2">
          <SelectField label="Ajuste" value={value.fit} onChange={(fit) => onChange({ ...value, fit })}
            options={[{ value: 'cover', label: 'Rellenar (recorta)' }, { value: 'contain', label: 'Mostrar completa' }]} />
          <RangeField label="Encuadre horizontal" value={value.posX} min={0} max={100} suffix="%" onChange={(posX) => onChange({ ...value, posX })} />
          <RangeField label="Encuadre vertical" value={value.posY} min={0} max={100} suffix="%" onChange={(posY) => onChange({ ...value, posY })} />
          <RangeField label="Zoom" value={value.zoom} min={1} max={3} step={0.05} suffix="x" onChange={(zoom) => onChange({ ...value, zoom })} />
        </div>
      )}
    </div>
  )
}
