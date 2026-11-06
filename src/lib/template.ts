import type { InvitationConfig } from './types'

export interface Vars { destinatario: string; remitente: string }

export const varsOf = (c: InvitationConfig): Vars => ({
  destinatario: c.meta.recipient || 'tu persona favorita',
  remitente: c.meta.sender || 'alguien especial',
})

// Reemplaza {variables}. El resultado siempre se renderiza como texto (React escapa), nunca como HTML.
export function fill(text: string | undefined, vars: Vars & Record<string, string | number> | Record<string, string | number>): string {
  if (!text) return ''
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String((vars as Record<string, string | number>)[k]) : m))
}

export const VARIABLES_HELP = ['{destinatario}', '{remitente}']

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}
