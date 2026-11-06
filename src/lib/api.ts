import { supabase } from './supabase'
import { makeDefaultConfig } from './defaults'
import type {
  InvitationConfig, InvitationRow, InvitationOverview, SendRow, SessionRow, AnswerRow, SendChannel,
  PublicPayload, AnswerValue, ToneId, TrackingStatus,
} from './types'

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

// ---------------- Admin ----------------
// Registro abierto: basta con tener una sesión válida. El aislamiento real lo aplican las políticas RLS (owner_id).
export async function isAdminUser(): Promise<boolean> {
  const { data } = await supabase.auth.getUser()
  return Boolean(data.user)
}

export async function listOverview(): Promise<InvitationOverview[]> {
  const { data, error } = await supabase.from('invitation_overview').select('*').order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as InvitationOverview[]
}

export async function getInvitation(id: string): Promise<InvitationRow> {
  const { data, error } = await supabase.from('invitations').select('*').eq('id', id).single()
  fail(error)
  return data as InvitationRow
}

export async function createInvitation(opts: { internal_name: string; recipient: string; sender: string; tone: ToneId }): Promise<InvitationRow> {
  const cfg = makeDefaultConfig(opts.tone, opts.recipient, opts.sender)
  const { data, error } = await supabase.from('invitations')
    .insert({ internal_name: opts.internal_name, recipient_name: opts.recipient, draft_config: cfg })
    .select('*').single()
  fail(error)
  return data as InvitationRow
}

export async function saveDraft(id: string, cfg: InvitationConfig, internalName: string): Promise<void> {
  const { error } = await supabase.from('invitations').update({
    draft_config: cfg, recipient_name: cfg.meta.recipient, internal_name: internalName, updated_at: new Date().toISOString(),
  }).eq('id', id)
  fail(error)
}

// Publica: crea una versión inmutable y la enlaza (el token no cambia)
export async function publish(id: string, cfg: InvitationConfig): Promise<void> {
  const { data: last, error: e1 } = await supabase.from('invitation_versions')
    .select('version_number').eq('invitation_id', id).order('version_number', { ascending: false }).limit(1)
  fail(e1)
  const n = (last?.[0]?.version_number ?? 0) + 1
  const { data: ver, error: e2 } = await supabase.from('invitation_versions')
    .insert({ invitation_id: id, version_number: n, config: cfg }).select('id').single()
  fail(e2)
  const { error: e3 } = await supabase.from('invitations').update({
    draft_config: cfg, recipient_name: cfg.meta.recipient, published_version_id: ver!.id,
    publication_status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', id)
  fail(e3)
}

export async function setStatus(id: string, status: 'published' | 'disabled' | 'archived' | 'draft'): Promise<void> {
  const { error } = await supabase.from('invitations').update({ publication_status: status, updated_at: new Date().toISOString() }).eq('id', id)
  fail(error)
}

// Duplicar = nueva invitación, nuevo token, borrador, sin respuestas
export async function duplicateInvitation(src: InvitationRow, recipient?: string): Promise<InvitationRow> {
  const cfg = structuredClone(src.draft_config)
  if (recipient) cfg.meta.recipient = recipient
  const { data, error } = await supabase.from('invitations').insert({
    internal_name: `${src.internal_name} (copia)`, recipient_name: cfg.meta.recipient, draft_config: cfg,
  }).select('*').single()
  fail(error)
  return data as InvitationRow
}

export async function deleteInvitation(id: string): Promise<void> {
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  fail(error)
}

export async function listSends(invitationId: string): Promise<SendRow[]> {
  const { data, error } = await supabase.from('invitation_sends').select('*').eq('invitation_id', invitationId).order('sent_at', { ascending: false })
  fail(error)
  return (data ?? []) as SendRow[]
}

export async function markSent(invitationId: string, channel: SendChannel, note: string): Promise<void> {
  const { error } = await supabase.from('invitation_sends').insert({ invitation_id: invitationId, channel, note: note || null })
  fail(error)
}

export async function listSessions(invitationId: string): Promise<SessionRow[]> {
  const { data, error } = await supabase.from('invite_sessions').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as SessionRow[]
}

export async function listAnswers(sessionIds: string[]): Promise<AnswerRow[]> {
  if (!sessionIds.length) return []
  const { data, error } = await supabase.from('invite_answers').select('*').in('session_id', sessionIds).order('answered_at')
  fail(error)
  return (data ?? []) as AnswerRow[]
}

export async function listVersions(invitationId: string) {
  const { data, error } = await supabase.from('invitation_versions').select('id,version_number,config,created_at').eq('invitation_id', invitationId)
  fail(error)
  return (data ?? []) as { id: string; version_number: number; config: InvitationConfig; created_at: string }[]
}

export async function getVersionConfig(versionId: string): Promise<InvitationConfig | null> {
  const { data, error } = await supabase.from('invitation_versions').select('config').eq('id', versionId).maybeSingle()
  fail(error)
  return (data?.config as InvitationConfig) ?? null
}

// Seguimiento derivado (distinto del estado de publicación)
export function trackingOf(o: Pick<InvitationOverview, 'last_sent_at' | 'first_opened_at' | 'started_count' | 'confirmed_at' | 'answers_count'>): TrackingStatus {
  if (o.confirmed_at) return 'confirmada'
  if (o.started_count > 0 || o.answers_count > 0) return 'en_curso'
  if (o.first_opened_at) return 'abierta'
  if (o.last_sent_at) return 'enviada'
  return 'sin_envio'
}

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  sin_envio: 'Sin envío registrado', enviada: 'Marcada como enviada', abierta: 'Abierta', en_curso: 'En curso', confirmada: 'Confirmada',
}
export const PUBLICATION_LABELS = { draft: 'Borrador', published: 'Publicada', disabled: 'Desactivada', archived: 'Archivada' } as const
export const CHANNEL_LABELS: Record<SendChannel, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', telegram: 'Telegram', sms: 'SMS', email: 'Correo', en_persona: 'En persona', otro: 'Otro',
}

export const publicUrl = (token: string) => `${window.location.origin}/invite/${token}`

// ---------------- Público (solo RPC) ----------------
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const pubGet = (token: string) => rpc<PublicPayload>('get_public_invitation', { p_token: token })
export const pubStart = (token: string) => rpc<PublicPayload>('start_invite_session', { p_token: token })
export const pubResume = (session: string) => rpc<PublicPayload>('resume_invite_session', { p_session: session })
export const pubMarkStarted = (session: string) => rpc<{ ok: boolean }>('mark_session_started', { p_session: session })
export const pubSave = (session: string, stepId: string, stepType: string, question: string, answer: AnswerValue) =>
  rpc<{ ok: boolean; error?: string }>('save_answer', { p_session: session, p_step_id: stepId, p_step_type: stepType, p_question: question, p_answer: answer })
export const pubConfirm = (session: string) => rpc<{ ok: boolean; error?: string; step_id?: string }>('confirm_session', { p_session: session })
