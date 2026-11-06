import { createContext, useContext } from 'react'
import type { CSSProperties } from 'react'
import type { Transition } from 'motion/react'
import type { InvitationConfig, Background, Step, AnimStyle } from '../lib/types'
import { fill, type Vars } from '../lib/template'

export interface RuntimeCtx { cfg: InvitationConfig; vars: Vars; motionOn: boolean }
export const Ctx = createContext<RuntimeCtx | null>(null)

export function useRt(): RuntimeCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('RuntimeCtx ausente')
  return c
}

// Sustituye {variables}; el resultado se muestra siempre como texto plano.
export function useT() {
  const { vars } = useRt()
  return (s: string | undefined) => fill(s, vars as unknown as Record<string, string>)
}

export const SHADOWS = {
  none: 'none',
  soft: '0 6px 20px rgba(0,0,0,.08)',
  medium: '0 14px 40px rgba(0,0,0,.14)',
  strong: '0 24px 70px rgba(0,0,0,.35)',
} as const

export function backgroundStyle(bg: Background): CSSProperties {
  if (bg.type === 'solid') return { backgroundColor: bg.color }
  if (bg.type === 'gradient') return { backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`, backgroundColor: bg.color }
  if (bg.image?.url) {
    return {
      backgroundColor: bg.color,
      backgroundImage: `url("${bg.image.url.replace(/"/g, '%22')}")`,
      backgroundSize: 'cover',
      backgroundPosition: `${bg.image.posX}% ${bg.image.posY}%`,
    }
  }
  return { backgroundColor: bg.color }
}

export interface ResolvedAnim { enabled: boolean; style: AnimStyle; speed: number; intensity: number }

export function resolveAnim(cfg: InvitationConfig, step?: Step, motionOn = true): ResolvedAnim {
  const a = cfg.animations
  const o = step?.anim ?? {}
  return {
    enabled: motionOn && a.enabled && (o.enabled ?? true),
    style: o.style ?? a.stepTransition,
    speed: o.speed ?? a.speed,
    intensity: o.intensity ?? a.intensity,
  }
}

export function stepVariants(an: ResolvedAnim): {
  initial: Record<string, number>; animate: Record<string, number>; exit: Record<string, number>; transition: Transition
} {
  if (!an.enabled) return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
  const off = 14 + an.intensity * 0.4
  const dur = 0.45 / Math.max(0.3, an.speed)
  switch (an.style) {
    case 'slide': return { initial: { opacity: 0, x: off * 2 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -off * 2 }, transition: { duration: dur, ease: 'easeOut' } }
    case 'zoom': return { initial: { opacity: 0, scale: 0.88 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.06 }, transition: { duration: dur } }
    case 'flip': return { initial: { opacity: 0, rotateX: 40 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: -40 }, transition: { duration: dur } }
    case 'bounce': return { initial: { opacity: 0, y: off * 2 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -off }, transition: { type: 'spring', stiffness: 200 + an.speed * 80, damping: 14 } }
    default: return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: dur } }
  }
}

// Área visible del contenedor desplazable más cercano (o de la ventana)
export function visibleBounds(el: HTMLElement): { left: number; top: number; right: number; bottom: number } {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  let b = { left: 0, top: 0, right: vw, bottom: vh }
  let p: HTMLElement | null = el.parentElement
  while (p) {
    const oy = getComputedStyle(p).overflowY
    if (oy === 'auto' || oy === 'scroll') {
      const r = p.getBoundingClientRect()
      b = { left: Math.max(b.left, r.left), top: Math.max(b.top, r.top), right: Math.min(b.right, r.right), bottom: Math.min(b.bottom, r.bottom) }
      break
    }
    p = p.parentElement
  }
  return b
}
