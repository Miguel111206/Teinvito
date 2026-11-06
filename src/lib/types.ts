// Configuración tipada y persistida de una invitación (se guarda como JSON en Supabase).

export type StepType =
  | 'intro' | 'question_buttons' | 'single_choice' | 'multi_choice' | 'cards'
  | 'datetime' | 'text' | 'gallery' | 'message' | 'summary'

export type ToneId = 'romantico' | 'tierno' | 'divertido' | 'coqueto' | 'elegante' | 'casual' | 'personalizado'
export type StepRole = 'cover' | 'ask' | 'food' | 'plan' | 'datetime' | 'surprise' | 'summary'

export interface ImageRef {
  url: string
  path?: string // ruta en Storage (para poder borrarla)
  fit: 'cover' | 'contain'
  posX: number // 0-100 encuadre
  posY: number
  zoom: number // 1-3
}

export interface Option {
  id: string
  label: string
  description: string
  emoji: string
  image?: ImageRef
}

export interface GalleryItem { id: string; image: ImageRef; caption: string }

export type AnimStyle = 'fade' | 'slide' | 'zoom' | 'flip' | 'bounce'

export interface StepAnim {
  enabled?: boolean // undefined = hereda de la invitación
  style?: AnimStyle
  speed?: number // 0.5 - 2
  intensity?: number // 0 - 100
}

export interface Step {
  id: string
  role?: StepRole
  type: StepType
  name: string // nombre interno (solo panel)
  hidden: boolean
  required: boolean
  label: string
  title: string
  description: string
  emoji: string
  image?: ImageRef
  signature: string
  buttonText: string
  transitionMessage: string // mensaje que aparece al avanzar desde este paso
  options: Option[]
  layout: 'list' | 'grid2' | 'grid3'
  minSelect: number
  maxSelect: number
  placeholder: string
  askDate: boolean
  askTime: boolean
  gallery: GalleryItem[]
  yesText: string
  yesEmoji: string
  acceptMessage: string // mensaje al pulsar "Sí"
  showNoButton: boolean
  anim: StepAnim
}

export interface Background {
  type: 'solid' | 'gradient' | 'image'
  color: string
  from: string
  to: string
  angle: number
  image?: ImageRef
  overlay: number // 0-80 oscurecimiento sobre foto
}

export interface Theme {
  id: string
  background: Background
  card: { bg: string; border: string; borderWidth: number; radius: number; shadow: 'none' | 'soft' | 'medium' | 'strong'; maxWidth: number }
  text: { title: string; body: string; label: string; accent: string }
  fonts: { title: string; body: string }
  sizes: { title: number; body: number }
  align: 'left' | 'center' | 'right'
  button: { bg: string; bg2: string; text: string; radius: number; style: 'solid' | 'gradient' | 'outline' }
  image: { shape: 'rounded' | 'circle' | 'square' | 'arch'; ratio: '16/9' | '4/3' | '1/1' | '3/4'; radius: number }
  options: { style: 'card' | 'pill' | 'outline' | 'minimal'; bg: string; border: string; selectedBg: string; selectedBorder: string; text: string }
  visibility: { label: boolean; image: boolean; description: boolean; signature: boolean; progress: boolean; transitions: boolean }
}

export interface Texts {
  envelopeTitle: string
  envelopeSubtitle: string
  envelopeButton: string
  nextButton: string
  backButton: string
  confirmButton: string
  progressLabel: string // {actual} {total}
  saving: string
  saveError: string
  retry: string
  privacyNote: string
  summaryTitle: string
  requiredHint: string
  datePlaceholder: string
  timePlaceholder: string
  noAnswer: string
  musicPlay: string
  musicPause: string
  musicMute: string
  musicUnmute: string
  disabledTitle: string
  disabledText: string
  notFoundTitle: string
  notFoundText: string
}

export interface MusicConfig {
  enabled: boolean
  url: string
  path?: string
  fileName?: string
  volume: number // 0-100
  loop: boolean
  startAt: 'envelope' | 'first_step' | 'accept' // momento en que se solicita reproducir
  playerVisibility: 'visible' | 'discreet' | 'hidden'
}

export interface AnimationsConfig {
  enabled: boolean
  intensity: number // 0-100
  speed: number // 0.5-2
  stepTransition: AnimStyle
  envelope: boolean
  textReveal: boolean
  buttonBounce: boolean
  cardReaction: boolean
  emojiReaction: boolean
  confetti: boolean
  confettiEmojis: string
  hearts: { enabled: boolean; emoji: string; count: number }
  particles: { enabled: boolean; emoji: string; count: number }
  photoAnimation: boolean
}

export interface NoButtonConfig {
  text: string
  emoji: string
  size: number // px de fuente
  bg: string
  color: string
  speed: number // 0.5-2
  distance: number // 40-300 px
  style: 'teleport' | 'smooth' | 'spin' | 'shrink'
  funnyMessages: string[] // se muestran tras varios intentos
  messagesAfter: number // intentos antes del primer mensaje
}

export interface FinalScreen {
  emoji: string
  title: string
  message: string
  signature: string
  image?: ImageRef
}

export interface InvitationConfig {
  schemaVersion: 1
  meta: { recipient: string; sender: string; tone: ToneId; themeId: string }
  theme: Theme
  texts: Texts
  music: MusicConfig
  animations: AnimationsConfig
  noButton: NoButtonConfig
  steps: Step[]
  final: FinalScreen
}

// --------- Base de datos ---------
export type PublicationStatus = 'draft' | 'published' | 'disabled' | 'archived'
export type TrackingStatus = 'sin_envio' | 'enviada' | 'abierta' | 'en_curso' | 'confirmada'
export type SendChannel = 'whatsapp' | 'instagram' | 'telegram' | 'sms' | 'email' | 'en_persona' | 'otro'

export interface InvitationRow {
  id: string
  owner_id: string
  internal_name: string
  recipient_name: string
  token: string
  publication_status: PublicationStatus
  draft_config: InvitationConfig
  published_version_id: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  first_opened_at: string | null
  last_opened_at: string | null
}

export interface InvitationOverview {
  id: string
  internal_name: string
  recipient_name: string
  token: string
  publication_status: PublicationStatus
  created_at: string
  published_at: string | null
  updated_at: string
  first_opened_at: string | null
  last_opened_at: string | null
  published_version_id: string | null
  last_sent_at: string | null
  last_channel: SendChannel | null
  sends_count: number
  sessions_count: number
  started_count: number
  confirmed_at: string | null
  answers_count: number
}

export interface SendRow { id: string; invitation_id: string; channel: SendChannel; note: string | null; sent_at: string; confirmed_by_admin: boolean }
export interface SessionRow { id: string; invitation_id: string; version_id: string; created_at: string; started_at: string | null; last_activity_at: string; confirmed_at: string | null }
export interface AnswerRow { id: string; session_id: string; step_id: string; step_type: string; question_text: string; answer: AnswerValue; answered_at: string; updated_at: string }

// Valor de respuesta persistido: guarda ids Y textos mostrados (copia) para que siga siendo legible.
export interface AnswerValue {
  kind: 'button' | 'single' | 'multi' | 'datetime' | 'text' | 'ack'
  ids?: string[]
  labels?: string[] // copia del texto mostrado de cada opción
  date?: string
  time?: string
  text?: string
}

export interface PublicPayload {
  state: 'ok' | 'not_found' | 'disabled' | 'rate_limited'
  session_id?: string
  version_id?: string
  config?: InvitationConfig
  started?: boolean
  confirmed?: boolean
  answers?: { step_id: string; answer: AnswerValue; answered_at: string }[]
}

export const FONT_OPTIONS = [
  'Playfair Display', 'Cormorant Garamond', 'Lora', 'Poppins', 'Quicksand', 'Fredoka', 'Pacifico', 'system-ui', 'Georgia',
]
