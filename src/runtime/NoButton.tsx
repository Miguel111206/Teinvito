import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { motion } from 'motion/react'
import { useRt, useT, visibleBounds } from './ctx'

interface Props {
  yesRef: RefObject<HTMLElement | null>
  onAttempt: (count: number) => void
}

// Botón "No" juguetón. Nunca guarda nada: solo huye y cuenta intentos locales para mostrar frases.
export function NoButton({ yesRef, onAttempt }: Props) {
  const { cfg, motionOn } = useRt()
  const t = useT()
  const nb = cfg.noButton
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, r: 0, s: 1 })
  const posRef = useRef(pos)
  posRef.current = pos
  const attempts = useRef(0)
  const last = useRef(0)

  const flee = useCallback((px: number, py: number) => {
    const el = ref.current
    if (!el) return
    const now = performance.now()
    if (now - last.current < 260 / Math.max(0.4, nb.speed)) return
    last.current = now
    const r = el.getBoundingClientRect()
    const p = posRef.current
    const homeCx = r.left + r.width / 2 - p.x
    const homeCy = r.top + r.height / 2 - p.y
    const b = visibleBounds(el)
    const w = r.width, h = r.height
    const yes = yesRef.current?.getBoundingClientRect()
    const prot = Array.from(document.querySelectorAll('[data-protected]')).map((n) => n.getBoundingClientRect())
    const hits = (l: number, tp: number, rc: DOMRect, m: number) =>
      l < rc.right + m && l + w > rc.left - m && tp < rc.bottom + m && tp + h > rc.top - m

    let best: { cx: number; cy: number } | null = null
    let bestScore = -1
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2
      const rad = nb.distance * (0.55 + Math.random() * 0.7)
      let cx = homeCx + Math.cos(ang) * rad
      let cy = homeCy + Math.sin(ang) * rad
      const left = Math.min(Math.max(cx - w / 2, b.left + 8), Math.max(b.left + 8, b.right - 8 - w))
      const top = Math.min(Math.max(cy - h / 2, b.top + 8), Math.max(b.top + 8, b.bottom - 8 - h))
      cx = left + w / 2
      cy = top + h / 2
      if (yes && hits(left, top, yes, 14)) continue
      if (prot.some((rc) => hits(left, top, rc, 10))) continue
      const score = Math.hypot(cx - px, cy - py)
      if (score > bestScore) { bestScore = score; best = { cx, cy } }
    }
    if (!best) return
    attempts.current += 1
    onAttempt(attempts.current)
    setPos({
      x: best.cx - homeCx,
      y: best.cy - homeCy,
      r: nb.style === 'spin' ? p.r + 360 : 0,
      s: nb.style === 'shrink' ? Math.max(0.55, 1 - attempts.current * 0.07) : 1,
    })
  }, [nb.distance, nb.speed, nb.style, onAttempt, yesRef])

  // Escritorio: reacciona a la proximidad del cursor
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      if (d < Math.max(r.width / 2 + 46, 80)) flee(e.clientX, e.clientY)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [flee])

  const center = () => {
    const r = ref.current?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 }
  }

  const instant = !motionOn || !cfg.animations.enabled || nb.style === 'teleport'
  return (
    <motion.button
      ref={ref}
      type="button"
      // Móvil: reacciona al intento de tocarlo (antes de que se complete el clic)
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') { e.preventDefault(); flee(e.clientX, e.clientY) } }}
      onClick={(e) => { e.preventDefault(); const c = center(); flee(e.clientX || c.x, e.clientY || c.y) }}
      animate={{ x: pos.x, y: pos.y, rotate: pos.r, scale: pos.s }}
      transition={instant ? { duration: 0 } : { type: 'spring', stiffness: 260 * nb.speed, damping: 20 }}
      className="relative z-20 inline-flex touch-manipulation items-center justify-center gap-1.5 rounded-full px-5 py-3 font-semibold shadow-sm"
      style={{ background: nb.bg, color: nb.color, fontSize: nb.size, minHeight: 44 }}
    >
      <span>{t(nb.text)}</span>
      {nb.emoji && <span aria-hidden>{nb.emoji}</span>}
    </motion.button>
  )
}
