import type { Step, AnswerValue } from '../lib/types'

export const isInputStep = (s: Step) =>
  ['single_choice', 'multi_choice', 'cards', 'datetime', 'text', 'question_buttons'].includes(s.type)

export const isMulti = (s: Step) => s.type === 'multi_choice' || (s.type === 'cards' && s.maxSelect > 1)

export function isComplete(s: Step, a?: AnswerValue): boolean {
  if (!a) return false
  switch (s.type) {
    case 'single_choice':
    case 'cards':
    case 'multi_choice':
      return (a.ids?.length ?? 0) >= Math.max(1, s.type === 'single_choice' ? 1 : s.minSelect)
    case 'datetime':
      return (!s.askDate || Boolean(a.date)) && (!s.askTime || Boolean(a.time))
    case 'text':
      return Boolean(a.text?.trim())
    case 'question_buttons':
      return (a.ids?.length ?? 0) > 0
    default:
      return true
  }
}

// ¿Hay algo que guardar para este paso?
export function hasContent(s: Step, a?: AnswerValue): boolean {
  if (!a) return false
  if (s.type === 'text') return Boolean(a.text?.trim())
  if (s.type === 'datetime') return Boolean(a.date || a.time)
  return (a.ids?.length ?? 0) > 0
}

// Copia legible del texto mostrado de las opciones elegidas (para que las respuestas sigan siendo comprensibles)
export function labelsFor(s: Step, ids: string[]): string[] {
  return ids.map((id) => {
    const o = s.options.find((x) => x.id === id)
    return o ? `${o.emoji ? o.emoji + ' ' : ''}${o.label}`.trim() : id
  })
}

export function describeAnswer(a: AnswerValue | undefined, noAnswer: string): string {
  if (!a) return noAnswer
  if (a.kind === 'datetime') return [a.date, a.time].filter(Boolean).join(' · ') || noAnswer
  if (a.kind === 'text') return a.text?.trim() || noAnswer
  if (a.labels?.length) return a.labels.join(', ')
  return noAnswer
}
