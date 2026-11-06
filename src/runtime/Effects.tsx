import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useRt } from './ctx'

function rnd(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function Floaters({ emoji, count, seedBase, size }: { emoji: string; count: number; seedBase: number; size: number }) {
  const { cfg } = useRt()
  const an = cfg.animations
  const n = Math.round(count * (0.3 + an.intensity / 100 * 0.7))
  const items = useMemo(
    () => Array.from({ length: n }, (_, i) => ({
      left: rnd(seedBase + i) * 100,
      delay: rnd(seedBase + i + 50) * 8,
      dur: 9 + rnd(seedBase + i + 99) * 8,
      s: size * (0.7 + rnd(seedBase + i + 7) * 0.8),
      sway: (rnd(seedBase + i + 3) - 0.5) * 60,
    })),
    [n, seedBase, size],
  )
  return (
    <>
      {items.map((it, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute select-none"
          style={{ left: `${it.left}%`, bottom: -40, fontSize: it.s, opacity: 0.0 }}
          animate={{ y: [0, -(window.innerHeight + 120)], x: [0, it.sway, -it.sway, 0], opacity: [0, 0.75, 0.75, 0] }}
          transition={{ duration: it.dur / Math.max(0.4, an.speed), delay: it.delay, repeat: Infinity, ease: 'linear' }}
        >
          {emoji}
        </motion.span>
      ))}
    </>
  )
}

// Corazones y partículas flotantes (capa decorativa, no interactiva)
export function Decorations() {
  const { cfg, motionOn } = useRt()
  const a = cfg.animations
  if (!motionOn || !a.enabled) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {a.hearts.enabled && a.hearts.emoji && <Floaters emoji={a.hearts.emoji} count={a.hearts.count} seedBase={1} size={22} />}
      {a.particles.enabled && a.particles.emoji && <Floaters emoji={a.particles.emoji} count={a.particles.count} seedBase={500} size={14} />}
    </div>
  )
}

// Confeti: ráfaga de emojis desde el centro. Cambiar `burst` dispara una nueva.
export function Confetti({ burst }: { burst: number }) {
  const { cfg, motionOn } = useRt()
  const a = cfg.animations
  const pieces = useMemo(() => {
    const em = Array.from(a.confettiEmojis || '🎉').filter((c) => c.trim())
    const n = Math.round(14 + a.intensity * 0.28)
    return Array.from({ length: n }, (_, i) => ({
      e: em[i % em.length] ?? '🎉',
      dx: (rnd(burst * 31 + i) - 0.5) * 520,
      dy: -120 - rnd(burst * 17 + i) * 380,
      rot: (rnd(burst * 7 + i) - 0.5) * 720,
      s: 18 + rnd(burst * 13 + i) * 18,
      d: 1.6 + rnd(burst * 3 + i) * 1,
    }))
  }, [burst, a.confettiEmojis, a.intensity])
  if (!burst || !motionOn || !a.enabled || !a.confetti) return null
  return (
    <div aria-hidden key={burst} className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ left: '50%', top: '55%', fontSize: p.s }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.dx, y: [0, p.dy, p.dy + 520], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: p.d / Math.max(0.4, a.speed), ease: 'easeOut' }}
        >
          {p.e}
        </motion.span>
      ))}
    </div>
  )
}
