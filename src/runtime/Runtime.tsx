import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { AnswerValue, InvitationConfig, Step } from '../lib/types'
import { fill, varsOf } from '../lib/template'
import { Ctx, SHADOWS, backgroundStyle, resolveAnim, stepVariants } from './ctx'
import { Confetti, Decorations } from './Effects'
import { MusicBar, useMusic } from './Music'
import { PrimaryButton, Photo, Reveal, StepView, Signature } from './StepViews'
import { hasContent, isComplete, isInputStep } from './answers'

// Conexión con el almacenamiento: en la invitación pública usa RPC; en la vista previa no registra nada.
export interface Adapter {
  markStarted(): Promise<void>
  save(step: Step, answer: AnswerValue, question: string): Promise<void>
  confirm(): Promise<void>
}

export interface RuntimeProps {
  config: InvitationConfig
  adapter: Adapter
  mode: 'public' | 'preview'
  initialAnswers?: Record<string, AnswerValue>
  initialStarted?: boolean
  initialConfirmed?: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function Runtime({ config, adapter, mode, initialAnswers = {}, initialStarted = false, initialConfirmed = false }: RuntimeProps) {
  const reduced = useReducedMotion()
  const motionOn = !reduced
  const vars = useMemo(() => varsOf(config), [config])
  const t = (s: string | undefined) => fill(s, vars as unknown as Record<string, string>)
  const th = config.theme
  const texts = config.texts
  const music = useMusic(config.music)

  const visible = useMemo(() => config.steps.filter((s) => !s.hidden), [config.steps])
  const [phase, setPhase] = useState<'envelope' | 'steps' | 'final'>(initialConfirmed ? 'final' : 'envelope')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [hint, setHint] = useState(false)
  const [toast, setToast] = useState('')
  const [burst, setBurst] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const busyRef = useRef(false)
  const startedRef = useRef(initialStarted)
  const saved = useRef<Record<string, string>>(
    Object.fromEntries(Object.entries(initialAnswers).map(([k, v]) => [k, JSON.stringify(v)])),
  )

  const cur = visible[Math.min(index, Math.max(0, visible.length - 1))]
  const lastIndex = visible.length - 1

  const showToast = (msg: string) => {
    if (!msg || !th.visibility.transitions) return
    setToast(msg)
    window.setTimeout(() => setToast(''), 1900)
  }

  const persist = async (st: Step, ans: AnswerValue | undefined) => {
    if (!ans || !hasContent(st, ans)) return
    const key = JSON.stringify(ans)
    if (saved.current[st.id] === key) return
    await adapter.save(st, ans, t(st.title))
    saved.current[st.id] = key
  }

  const open = () => {
    music.maybeStart('envelope')
    // Retomar: primer paso con pregunta sin responder (o el último)
    let start = 0
    if (Object.keys(initialAnswers).length) {
      const firstPending = visible.findIndex((s) => isInputStep(s) && !initialAnswers[s.id])
      start = firstPending === -1 ? lastIndex : firstPending
    }
    setIndex(Math.max(0, start))
    setPhase('steps')
  }

  const goTo = (i: number, msg: string) => {
    showToast(msg)
    setHint(false)
    setAttempts(0)
    setIndex(Math.max(0, Math.min(lastIndex, i)))
  }

  const ensureStarted = async () => {
    if (!startedRef.current) { await adapter.markStarted(); startedRef.current = true }
  }

  const goNext = async () => {
    if (busyRef.current || !cur) return
    music.maybeStart('first_step') // sincrónico: dentro del gesto del usuario
    const ans = answers[cur.id]
    if (isInputStep(cur) && cur.required && !isComplete(cur, ans)) { setHint(true); return }
    busyRef.current = true; setBusy(true); setError(false)
    try {
      await ensureStarted()
      await persist(cur, ans)
      if (cur.type === 'summary') {
        await adapter.confirm()
        setPhase('final'); setBurst((b) => b + 1)
      } else {
        goTo(index + 1, t(cur.transitionMessage))
      }
    } catch {
      setError(true)
    } finally {
      busyRef.current = false; setBusy(false)
    }
  }

  const onYes = async () => {
    if (busyRef.current || !cur) return
    music.maybeStart('first_step'); music.maybeStart('accept')
    busyRef.current = true; setBusy(true); setError(false)
    try {
      await ensureStarted()
      const ack: AnswerValue = { kind: 'button', ids: ['yes'], labels: [t(cur.yesText)] }
      await persist(cur, ack)
      setAnswers((a) => ({ ...a, [cur.id]: ack }))
      setBurst((b) => b + 1)
      showToast(t(cur.acceptMessage))
      if (motionOn) await sleep(700)
      goTo(index + 1, t(cur.transitionMessage))
    } catch {
      setError(true)
    } finally {
      busyRef.current = false; setBusy(false)
    }
  }

  const setAnswer = (st: Step) => (a: AnswerValue | undefined) => {
    setHint(false); setError(false)
    setAnswers((prev) => {
      const next = { ...prev }
      if (a) next[st.id] = a; else delete next[st.id]
      return next
    })
  }

  const funny = config.noButton.funnyMessages.filter((m) => m.trim())
  const attemptsMsg = attempts > config.noButton.messagesAfter && funny.length
    ? t(funny[(attempts - config.noButton.messagesAfter - 1) % funny.length]) : ''

  const an = resolveAnim(config, cur, motionOn)
  const sv = stepVariants(an)
  const cardStyle: CSSProperties = {
    background: th.card.bg, border: `${th.card.borderWidth}px solid ${th.card.border}`, borderRadius: th.card.radius,
    boxShadow: SHADOWS[th.card.shadow], maxWidth: th.card.maxWidth, width: '100%', padding: '24px 20px',
    fontFamily: `"${th.fonts.body}", system-ui, sans-serif`, color: th.text.body,
  }

  let body: ReactNode
  if (phase === 'envelope') {
    body = (
      <motion.div key="envelope" style={{ ...cardStyle, textAlign: th.align === 'left' ? 'left' : 'center' }}
        initial={motionOn ? { opacity: 0, scale: 0.9 } : false} animate={{ opacity: 1, scale: 1 }}
        exit={motionOn && config.animations.envelope ? { opacity: 0, scale: 1.2, rotateX: 60, y: -40 } : { opacity: 0 }}
        transition={{ duration: 0.5 / config.animations.speed }}>
        <motion.div aria-hidden className="mb-3 text-6xl" animate={motionOn && config.animations.envelope ? { y: [0, -8, 0], rotate: [0, -4, 4, 0] } : undefined}
          transition={{ repeat: Infinity, duration: 3 }}>💌</motion.div>
        <h1 className="mb-1" style={{ fontFamily: `"${th.fonts.title}", serif`, fontSize: th.sizes.title, color: th.text.title, fontWeight: 700, overflowWrap: 'anywhere' }}>{t(texts.envelopeTitle)}</h1>
        <p className="mb-5" style={{ fontSize: th.sizes.body }}>{t(texts.envelopeSubtitle)}</p>
        <PrimaryButton onClick={open}>{t(texts.envelopeButton)}</PrimaryButton>
      </motion.div>
    )
  } else if (phase === 'final') {
    const f = config.final
    body = (
      <motion.div key="final" style={{ ...cardStyle, textAlign: th.align }}
        initial={motionOn ? { opacity: 0, scale: 0.85 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
        {f.image?.url && <div className="mb-4"><Photo image={f.image} /></div>}
        {f.emoji && <motion.div aria-hidden className="mb-2 text-6xl" animate={motionOn ? { scale: [1, 1.2, 1] } : undefined} transition={{ repeat: Infinity, duration: 2 }}>{f.emoji}</motion.div>}
        <Reveal i={1}><h1 className="mb-2" style={{ fontFamily: `"${th.fonts.title}", serif`, fontSize: th.sizes.title, color: th.text.title, fontWeight: 700, overflowWrap: 'anywhere' }}>{t(f.title)}</h1></Reveal>
        <Reveal i={2}><p className="whitespace-pre-line leading-relaxed" style={{ fontSize: th.sizes.body, overflowWrap: 'anywhere' }}>{t(f.message)}</p></Reveal>
        {th.visibility.signature && f.signature && <Reveal i={3}><p className="mt-4 italic" style={{ color: th.text.accent, fontFamily: `"${th.fonts.title}", serif` }}>{t(f.signature)}</p></Reveal>}
      </motion.div>
    )
  } else if (!cur) {
    body = <div style={cardStyle}>Esta invitación aún no tiene pasos visibles.</div>
  } else {
    const noFooter = cur.type === 'question_buttons'
    const primary = cur.type === 'summary' ? (cur.buttonText || texts.confirmButton) : (cur.buttonText || texts.nextButton)
    body = (
      <motion.div key={`s-${cur.id}`} style={{ ...cardStyle, perspective: 800 }}
        initial={sv.initial} animate={sv.animate} exit={sv.exit} transition={sv.transition}>
        {th.visibility.progress && visible.length > 1 && (
          <div className="mb-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: th.options.border }}>
              <motion.div className="h-full rounded-full" style={{ background: th.text.accent }}
                animate={{ width: `${((index + 1) / visible.length) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
            <p className="mt-1 text-center text-xs opacity-70">{fill(texts.progressLabel, { actual: index + 1, total: visible.length })}</p>
          </div>
        )}
        <StepView step={cur} steps={visible} answers={answers} answer={answers[cur.id]} setAnswer={setAnswer(cur)}
          onYes={onYes} busy={busy} attemptsMsg={attemptsMsg} onAttempt={setAttempts} />
        <div className="mt-5 grid gap-2">
          {!noFooter && (
            <PrimaryButton onClick={goNext} disabled={busy}>{busy ? texts.saving : t(primary)}</PrimaryButton>
          )}
          {hint && <p role="alert" className="text-center text-sm" style={{ color: th.text.accent }}>{t(texts.requiredHint)}</p>}
          {error && (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {texts.saveError}{' '}
              <button type="button" className="font-semibold underline" onClick={cur.type === 'question_buttons' ? onYes : goNext}>{texts.retry}</button>
            </div>
          )}
          {index > 0 && (
            <button type="button" onClick={() => goTo(index - 1, '')} disabled={busy}
              className="mx-auto min-h-[40px] px-3 text-sm underline opacity-70">{texts.backButton}</button>
          )}
          {isInputStep(cur) && texts.privacyNote && <p className="text-center text-[11px] opacity-60">{t(texts.privacyNote)}</p>}
        </div>
      </motion.div>
    )
  }

  return (
    <Ctx.Provider value={{ cfg: config, vars, motionOn }}>
      <div className="relative w-full overflow-x-clip" style={{ ...backgroundStyle(th.background), minHeight: mode === 'preview' ? '100%' : '100dvh', fontFamily: `"${th.fonts.body}", system-ui, sans-serif` }}>
        {th.background.type === 'image' && th.background.image?.url && (
          <div aria-hidden className="absolute inset-0" style={{ background: `rgba(0,0,0,${th.background.overlay / 100})` }} />
        )}
        <Decorations />
        <MusicBar api={music} music={config.music} texts={texts} />
        <div className="relative z-10 mx-auto flex w-full items-center justify-center px-4 py-10" style={{ minHeight: mode === 'preview' ? '100%' : '100dvh' }}>
          <AnimatePresence mode="wait">{body}</AnimatePresence>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div role="status" key={toast} className="pointer-events-none fixed left-1/2 top-4 z-50 max-w-[90%] rounded-full px-4 py-2 text-center text-sm font-semibold shadow-lg"
              style={{ background: th.text.title, color: th.card.bg, translateX: '-50%' }}
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        <Confetti burst={burst} />
      </div>
    </Ctx.Provider>
  )
}
// Nota: Signature se reexporta para componentes externos que lo necesiten
export { Signature }
