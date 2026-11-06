import { useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { motion } from 'motion/react'
import type { AnswerValue, ImageRef, Step, Theme } from '../lib/types'
import { SHADOWS, useRt, useT } from './ctx'
import { NoButton } from './NoButton'
import { describeAnswer, isMulti, labelsFor } from './answers'

// ------------------------------------------------------------ Piezas base
export function Reveal({ i = 0, children, className, style }: { i?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const { cfg, motionOn } = useRt()
  const on = motionOn && cfg.animations.enabled && cfg.animations.textReveal
  if (!on) return <div className={className} style={style}>{children}</div>
  return (
    <motion.div className={className} style={style}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 / cfg.animations.speed, delay: 0.08 * i / cfg.animations.speed }}>
      {children}
    </motion.div>
  )
}

export function Photo({ image, ratio }: { image: ImageRef; ratio?: string }) {
  const { cfg, motionOn } = useRt()
  const th = cfg.theme.image
  const circle = th.shape === 'circle'
  const radius = circle ? '50%' : th.shape === 'square' ? 0 : th.shape === 'arch' ? `${th.radius * 8}px ${th.radius * 8}px ${th.radius}px ${th.radius}px` : th.radius
  const anim = motionOn && cfg.animations.enabled && cfg.animations.photoAnimation
  return (
    <motion.div
      className="mx-auto w-full overflow-hidden"
      style={{ aspectRatio: circle ? '1/1' : (ratio ?? th.ratio), borderRadius: radius, maxWidth: circle ? 260 : undefined, boxShadow: SHADOWS.soft }}
      initial={anim ? { opacity: 0, scale: 0.92 } : false} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 / cfg.animations.speed }}>
      <img src={image.url} alt="" loading="lazy" draggable={false}
        style={{ width: '100%', height: '100%', objectFit: image.fit, objectPosition: `${image.posX}% ${image.posY}%`, transform: `scale(${image.zoom})`, transformOrigin: `${image.posX}% ${image.posY}%` }} />
    </motion.div>
  )
}

export function primaryStyle(th: Theme): CSSProperties {
  const b = th.button
  const base: CSSProperties = { borderRadius: b.radius, color: b.text, minHeight: 48 }
  if (b.style === 'outline') return { ...base, background: 'transparent', color: b.bg, border: `2px solid ${b.bg}` }
  if (b.style === 'gradient') return { ...base, backgroundImage: `linear-gradient(135deg, ${b.bg}, ${b.bg2})`, boxShadow: '0 8px 20px rgba(0,0,0,.15)' }
  return { ...base, background: b.bg, boxShadow: '0 6px 16px rgba(0,0,0,.12)' }
}

export function PrimaryButton({ children, onClick, disabled, innerRef, full = true }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; innerRef?: RefObject<HTMLButtonElement>; full?: boolean
}) {
  const { cfg, motionOn } = useRt()
  const bounce = motionOn && cfg.animations.enabled && cfg.animations.buttonBounce
  return (
    <motion.button ref={innerRef} type="button" onClick={onClick} disabled={disabled}
      className={`${full ? 'w-full' : ''} touch-manipulation px-6 py-3 text-base font-semibold disabled:opacity-60`}
      style={primaryStyle(cfg.theme)}
      whileHover={bounce ? { scale: 1.04 } : undefined} whileTap={bounce ? { scale: 0.93 } : undefined}
      animate={bounce && !disabled ? { y: [0, -3, 0] } : undefined}
      transition={bounce ? { y: { repeat: Infinity, duration: 2.2 / cfg.animations.speed, ease: 'easeInOut' }, type: 'spring', stiffness: 400, damping: 12 } : undefined}>
      {children}
    </motion.button>
  )
}

export function StepHeader({ step }: { step: Step }) {
  const { cfg } = useRt()
  const t = useT()
  const th = cfg.theme
  const v = th.visibility
  return (
    <div style={{ textAlign: th.align }}>
      {v.label && step.label && (
        <Reveal i={0}><p className="mb-2 text-xs font-semibold tracking-[0.2em]" style={{ color: th.text.label }}>{t(step.label)}</p></Reveal>
      )}
      {step.emoji && <Reveal i={1}><div className="mb-2 text-4xl" aria-hidden>{step.emoji}</div></Reveal>}
      {v.image && step.image?.url && <div className="mb-4"><Photo image={step.image} /></div>}
      {step.title && (
        <Reveal i={2}>
          <h1 className="mb-2 leading-tight" style={{ fontFamily: `"${th.fonts.title}", serif`, fontSize: th.sizes.title, color: th.text.title, fontWeight: 700, overflowWrap: 'anywhere' }}>
            {t(step.title)}
          </h1>
        </Reveal>
      )}
      {v.description && step.description && (
        <Reveal i={3}><p className="mb-4 whitespace-pre-line leading-relaxed" style={{ fontSize: th.sizes.body, color: th.text.body, overflowWrap: 'anywhere' }}>{t(step.description)}</p></Reveal>
      )}
    </div>
  )
}

export function Signature({ step }: { step: Step }) {
  const { cfg } = useRt()
  const t = useT()
  if (!cfg.theme.visibility.signature || !step.signature) return null
  return <Reveal i={6}><p className="mt-4 italic" style={{ textAlign: cfg.theme.align, color: cfg.theme.text.accent, fontFamily: `"${cfg.theme.fonts.title}", serif` }}>{t(step.signature)}</p></Reveal>
}

// ------------------------------------------------------------ Opciones / tarjetas
function optionStyle(th: Theme, selected: boolean): CSSProperties {
  const o = th.options
  const common: CSSProperties = { color: o.text, textAlign: 'left' }
  switch (o.style) {
    case 'pill': return { ...common, borderRadius: 999, background: selected ? o.selectedBg : o.bg, border: `2px solid ${selected ? o.selectedBorder : o.border}` }
    case 'outline': return { ...common, borderRadius: 16, background: selected ? o.selectedBg : 'transparent', border: `2px solid ${selected ? o.selectedBorder : o.border}` }
    case 'minimal': return { ...common, borderRadius: 8, background: selected ? o.selectedBg : o.bg, border: 'none', borderBottom: `3px solid ${selected ? o.selectedBorder : o.border}` }
    default: return { ...common, borderRadius: 18, background: selected ? o.selectedBg : o.bg, border: `2px solid ${selected ? o.selectedBorder : o.border}`, boxShadow: selected ? SHADOWS.soft : 'none' }
  }
}

function Options({ step, answer, setAnswer }: { step: Step; answer?: AnswerValue; setAnswer: (a: AnswerValue | undefined) => void }) {
  const { cfg, motionOn } = useRt()
  const t = useT()
  const th = cfg.theme
  const multi = isMulti(step)
  const selected = answer?.ids ?? []
  const react = motionOn && cfg.animations.enabled && cfg.animations.cardReaction
  const emojiReact = motionOn && cfg.animations.enabled && cfg.animations.emojiReaction
  const [pop, setPop] = useState<string | null>(null)

  const toggle = (id: string) => {
    let ids: string[]
    if (multi) {
      ids = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
      if (ids.length > Math.max(1, step.maxSelect)) ids = ids.slice(ids.length - Math.max(1, step.maxSelect))
    } else ids = [id]
    setPop(id)
    window.setTimeout(() => setPop(null), 700)
    setAnswer(ids.length ? { kind: multi ? 'multi' : 'single', ids, labels: labelsFor(step, ids).map((l) => t(l)) } : undefined)
  }

  const grid = step.layout === 'grid2' ? 'grid-cols-2' : step.layout === 'grid3' ? 'grid-cols-3' : 'grid-cols-1'
  const tile = step.layout !== 'list'
  return (
    <div className={`grid gap-3 ${grid}`} role={multi ? 'group' : 'radiogroup'}>
      {step.options.map((o, i) => {
        const sel = selected.includes(o.id)
        return (
          <motion.button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={sel}
            className={`relative min-w-0 touch-manipulation overflow-hidden ${tile ? 'flex flex-col items-center gap-1 p-3 text-center' : 'flex items-center gap-3 p-3'}`}
            style={optionStyle(th, sel)}
            initial={react ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0, scale: sel && react ? [1, 1.06, 1] : 1 }}
            transition={{ delay: react ? i * 0.05 : 0, duration: 0.35 }}
            whileTap={react ? { scale: 0.96 } : undefined}>
            {o.image?.url && (
              <div className={tile ? 'w-full' : 'shrink-0'} style={tile ? undefined : { width: 64 }}>
                <div className="overflow-hidden" style={{ aspectRatio: tile ? '4/3' : '1/1', borderRadius: 12 }}>
                  <img src={o.image.url} alt="" loading="lazy" draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: o.image.fit, objectPosition: `${o.image.posX}% ${o.image.posY}%`, transform: `scale(${o.image.zoom})` }} />
                </div>
              </div>
            )}
            {o.emoji && (
              <motion.span aria-hidden className={tile ? 'text-3xl' : 'text-2xl'}
                animate={emojiReact && sel ? { rotate: [0, -14, 14, -8, 0], scale: [1, 1.3, 1] } : { rotate: 0, scale: 1 }} transition={{ duration: 0.6 }}>
                {o.emoji}
              </motion.span>
            )}
            <span className="min-w-0 flex-1" style={{ overflowWrap: 'anywhere' }}>
              <span className="block font-semibold" style={{ fontSize: th.sizes.body }}>{t(o.label)}</span>
              {o.description && <span className="block text-sm opacity-75">{t(o.description)}</span>}
            </span>
            {sel && <span aria-hidden className="absolute right-2 top-2 text-sm" style={{ color: th.options.selectedBorder }}>✔</span>}
            {emojiReact && pop === o.id && o.emoji && (
              <motion.span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 text-2xl"
                initial={{ opacity: 1, y: 0, x: '-50%' }} animate={{ opacity: 0, y: -50 }} transition={{ duration: 0.7 }}>
                {o.emoji}
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------ Vistas por tipo
export interface ViewProps {
  step: Step
  steps: Step[]
  answers: Record<string, AnswerValue>
  answer?: AnswerValue
  setAnswer: (a: AnswerValue | undefined) => void
  onYes: () => void
  busy: boolean
  attemptsMsg: string
  onAttempt: (n: number) => void
}

const fieldStyle = (th: Theme): CSSProperties => ({
  width: '100%', minHeight: 48, padding: '10px 14px', borderRadius: 14, fontSize: 16, // 16px evita zoom en iOS
  border: `2px solid ${th.options.border}`, background: th.options.bg, color: th.options.text,
})

export function StepView(p: ViewProps) {
  const { cfg } = useRt()
  const t = useT()
  const th = cfg.theme
  const { step } = p
  const yesRef = useRef<HTMLButtonElement>(null)

  switch (step.type) {
    case 'question_buttons':
      return (
        <div>
          <StepHeader step={step} />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton innerRef={yesRef} onClick={p.onYes} disabled={p.busy} full={false}>
              {t(step.yesText)} {step.yesEmoji}
            </PrimaryButton>
            {step.showNoButton && <NoButton yesRef={yesRef} onAttempt={p.onAttempt} />}
          </div>
          <div aria-live="polite" className="mt-3 min-h-[1.5rem] text-center text-sm" style={{ color: th.text.accent }}>{p.attemptsMsg}</div>
          <Signature step={step} />
        </div>
      )
    case 'single_choice':
    case 'multi_choice':
    case 'cards':
      return (
        <div>
          <StepHeader step={step} />
          <Options step={step} answer={p.answer} setAnswer={p.setAnswer} />
          <Signature step={step} />
        </div>
      )
    case 'datetime': {
      const today = new Date().toISOString().slice(0, 10)
      const a = p.answer
      const set = (patch: Partial<AnswerValue>) => p.setAnswer({ kind: 'datetime', ...a, ...patch })
      return (
        <div>
          <StepHeader step={step} />
          <div className="grid gap-3">
            {step.askDate && (
              <label className="block text-left text-sm" style={{ color: th.text.body }}>{t(cfg.texts.datePlaceholder)}
                <input type="date" min={today} value={a?.date ?? ''} onChange={(e) => set({ date: e.target.value })} style={fieldStyle(th)} className="mt-1" />
              </label>
            )}
            {step.askTime && (
              <label className="block text-left text-sm" style={{ color: th.text.body }}>{t(cfg.texts.timePlaceholder)}
                <input type="time" value={a?.time ?? ''} onChange={(e) => set({ time: e.target.value })} style={fieldStyle(th)} className="mt-1" />
              </label>
            )}
          </div>
          <Signature step={step} />
        </div>
      )
    }
    case 'text':
      return (
        <div>
          <StepHeader step={step} />
          <textarea rows={4} maxLength={1000} value={p.answer?.text ?? ''} placeholder={t(step.placeholder)}
            onChange={(e) => p.setAnswer(e.target.value ? { kind: 'text', text: e.target.value } : undefined)}
            style={{ ...fieldStyle(th), resize: 'vertical' }} />
          <Signature step={step} />
        </div>
      )
    case 'gallery':
      return (
        <div>
          <StepHeader step={step} />
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
            {step.gallery.map((g) => (
              <figure key={g.id} className="w-[78%] shrink-0 snap-center">
                <Photo image={g.image} />
                {g.caption && <figcaption className="mt-1 text-center text-sm" style={{ color: th.text.body }}>{t(g.caption)}</figcaption>}
              </figure>
            ))}
          </div>
          <Signature step={step} />
        </div>
      )
    case 'summary': {
      const rows = p.steps.filter((s) => !s.hidden && ['single_choice', 'multi_choice', 'cards', 'datetime', 'text', 'question_buttons'].includes(s.type))
      return (
        <div>
          <StepHeader step={step} />
          <ul className="grid gap-2">
            {rows.map((s) => (
              <li key={s.id} className="rounded-2xl px-4 py-3" style={{ background: th.options.bg, border: `1px solid ${th.options.border}`, textAlign: 'left' }}>
                <p className="text-xs font-semibold" style={{ color: th.text.label, overflowWrap: 'anywhere' }}>{t(s.title)}</p>
                <p style={{ color: th.text.title, overflowWrap: 'anywhere' }}>{describeAnswer(p.answers[s.id], cfg.texts.noAnswer)}</p>
              </li>
            ))}
          </ul>
          <Signature step={step} />
        </div>
      )
    }
    default: // intro, message
      return (
        <div>
          <StepHeader step={step} />
          <Signature step={step} />
        </div>
      )
  }
}
