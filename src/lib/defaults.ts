import type {
  InvitationConfig, Step, StepType, StepRole, Theme, ToneId, Texts, FinalScreen, Option, ImageRef,
} from './types'
import { uid } from './template'

// ---------------------------------------------------------------- Temas
const baseTheme: Theme = {
  id: 'rosa',
  background: { type: 'gradient', color: '#fdf2f4', from: '#ffe4ec', to: '#e9d5ff', angle: 160, overlay: 30 },
  card: { bg: '#ffffff', border: '#fbcfe8', borderWidth: 1, radius: 28, shadow: 'medium', maxWidth: 440 },
  text: { title: '#831843', body: '#6b4a57', label: '#be185d', accent: '#ec4899' },
  fonts: { title: 'Playfair Display', body: 'Poppins' },
  sizes: { title: 30, body: 16 },
  align: 'center',
  button: { bg: '#ec4899', bg2: '#f43f5e', text: '#ffffff', radius: 999, style: 'gradient' },
  image: { shape: 'rounded', ratio: '4/3', radius: 22 },
  options: { style: 'card', bg: '#fff7fa', border: '#fbcfe8', selectedBg: '#fce7f3', selectedBorder: '#ec4899', text: '#6b4a57' },
  visibility: { label: true, image: true, description: true, signature: true, progress: true, transitions: true },
}

const mk = (o: Partial<Theme> & { id: string }): Theme => ({
  ...baseTheme, ...o,
  background: { ...baseTheme.background, ...(o.background ?? {}) },
  card: { ...baseTheme.card, ...(o.card ?? {}) },
  text: { ...baseTheme.text, ...(o.text ?? {}) },
  fonts: { ...baseTheme.fonts, ...(o.fonts ?? {}) },
  sizes: { ...baseTheme.sizes, ...(o.sizes ?? {}) },
  button: { ...baseTheme.button, ...(o.button ?? {}) },
  image: { ...baseTheme.image, ...(o.image ?? {}) },
  options: { ...baseTheme.options, ...(o.options ?? {}) },
  visibility: { ...baseTheme.visibility, ...(o.visibility ?? {}) },
})

export const THEMES: { id: string; name: string; theme: Theme }[] = [
  { id: 'rosa', name: 'Rosa romántico', theme: mk({ id: 'rosa' }) },
  { id: 'atardecer', name: 'Atardecer', theme: mk({
    id: 'atardecer',
    background: { type: 'gradient', color: '#fff1e6', from: '#ffd6a5', to: '#fda4af', angle: 150, overlay: 30 },
    card: { bg: '#fffaf5', border: '#fed7aa', borderWidth: 1, radius: 30, shadow: 'medium', maxWidth: 440 },
    text: { title: '#7c2d12', body: '#78513a', label: '#c2410c', accent: '#f97316' },
    fonts: { title: 'Lora', body: 'Quicksand' },
    button: { bg: '#f97316', bg2: '#f43f5e', text: '#fff', radius: 999, style: 'gradient' },
    options: { style: 'card', bg: '#fff7ed', border: '#fed7aa', selectedBg: '#ffedd5', selectedBorder: '#f97316', text: '#78513a' },
  }) },
  { id: 'picnic', name: 'Picnic menta', theme: mk({
    id: 'picnic',
    background: { type: 'gradient', color: '#ecfdf5', from: '#d1fae5', to: '#fef9c3', angle: 160, overlay: 30 },
    card: { bg: '#ffffff', border: '#a7f3d0', borderWidth: 2, radius: 24, shadow: 'soft', maxWidth: 440 },
    text: { title: '#065f46', body: '#3f5f52', label: '#059669', accent: '#10b981' },
    fonts: { title: 'Fredoka', body: 'Quicksand' },
    button: { bg: '#10b981', bg2: '#84cc16', text: '#fff', radius: 18, style: 'gradient' },
    options: { style: 'pill', bg: '#f0fdf4', border: '#a7f3d0', selectedBg: '#d1fae5', selectedBorder: '#10b981', text: '#3f5f52' },
  }) },
  { id: 'noche', name: 'Noche elegante', theme: mk({
    id: 'noche',
    background: { type: 'gradient', color: '#0f172a', from: '#1e1b4b', to: '#0f172a', angle: 170, overlay: 30 },
    card: { bg: '#1e1b2e', border: '#a78bfa55', borderWidth: 1, radius: 20, shadow: 'strong', maxWidth: 440 },
    text: { title: '#f5f3ff', body: '#c4b5fd', label: '#fbbf24', accent: '#fbbf24' },
    fonts: { title: 'Cormorant Garamond', body: 'Poppins' },
    sizes: { title: 34, body: 15 },
    button: { bg: '#fbbf24', bg2: '#f59e0b', text: '#1e1b4b', radius: 10, style: 'solid' },
    options: { style: 'outline', bg: '#27233a', border: '#4c4670', selectedBg: '#3b3360', selectedBorder: '#fbbf24', text: '#e9e5ff' },
  }) },
  { id: 'lavanda', name: 'Lavanda tierna', theme: mk({
    id: 'lavanda',
    background: { type: 'gradient', color: '#f5f3ff', from: '#ede9fe', to: '#fce7f3', angle: 150, overlay: 30 },
    card: { bg: '#fffbff', border: '#ddd6fe', borderWidth: 1, radius: 32, shadow: 'soft', maxWidth: 440 },
    text: { title: '#5b21b6', body: '#6b5b8a', label: '#7c3aed', accent: '#a78bfa' },
    fonts: { title: 'Pacifico', body: 'Quicksand' },
    sizes: { title: 26, body: 16 },
    button: { bg: '#8b5cf6', bg2: '#ec4899', text: '#fff', radius: 999, style: 'gradient' },
    options: { style: 'card', bg: '#faf5ff', border: '#ddd6fe', selectedBg: '#ede9fe', selectedBorder: '#8b5cf6', text: '#6b5b8a' },
  }) },
  { id: 'sol', name: 'Sol casual', theme: mk({
    id: 'sol',
    background: { type: 'solid', color: '#fef9c3', from: '#fef08a', to: '#fde68a', angle: 160, overlay: 30 },
    card: { bg: '#ffffff', border: '#fde047', borderWidth: 2, radius: 14, shadow: 'none', maxWidth: 420 },
    text: { title: '#1f2937', body: '#4b5563', label: '#ca8a04', accent: '#eab308' },
    fonts: { title: 'Poppins', body: 'Poppins' },
    sizes: { title: 28, body: 15 },
    align: 'left',
    button: { bg: '#1f2937', bg2: '#374151', text: '#fff', radius: 12, style: 'solid' },
    options: { style: 'minimal', bg: '#ffffff', border: '#e5e7eb', selectedBg: '#fef9c3', selectedBorder: '#eab308', text: '#374151' },
  }) },
]

export const getTheme = (id: string): Theme =>
  structuredClone((THEMES.find((t) => t.id === id) ?? THEMES[0]).theme)

// ---------------------------------------------------------------- Textos de interfaz
export const baseTexts: Texts = {
  envelopeTitle: 'Tienes una invitación',
  envelopeSubtitle: 'Hay algo especial esperándote',
  envelopeButton: 'Abrir invitación 💌',
  nextButton: 'Continuar',
  backButton: 'Atrás',
  confirmButton: 'Confirmar ✨',
  progressLabel: 'Paso {actual} de {total}',
  saving: 'Guardando…',
  saveError: 'No se pudo guardar tu respuesta. Tus selecciones siguen aquí.',
  retry: 'Reintentar',
  privacyNote: 'Tus selecciones se comparten con {remitente}.',
  summaryTitle: 'Tu resumen',
  requiredHint: 'Elige una opción para continuar',
  datePlaceholder: 'Fecha',
  timePlaceholder: 'Hora',
  noAnswer: 'Sin respuesta',
  musicPlay: 'Reproducir música',
  musicPause: 'Pausar música',
  musicMute: 'Silenciar',
  musicUnmute: 'Activar sonido',
  disabledTitle: 'Este enlace ya no está disponible',
  disabledText: 'La persona que lo envió lo desactivó.',
  notFoundTitle: 'No encontramos esta invitación',
  notFoundText: 'Revisa que el enlace esté completo.',
}

// ---------------------------------------------------------------- Pasos
export const emptyImage = (url = ''): ImageRef => ({ url, fit: 'cover', posX: 50, posY: 50, zoom: 1 })

export const newOption = (label = 'Nueva opción', emoji = '✨', id?: string): Option =>
  ({ id: id ?? uid(), label, description: '', emoji })

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  intro: 'Presentación (texto, foto y botón)',
  question_buttons: 'Pregunta con botones (Sí / No)',
  single_choice: 'Selección única',
  multi_choice: 'Selección múltiple',
  cards: 'Tarjetas (comida o planes)',
  datetime: 'Fecha y hora',
  text: 'Respuesta escrita',
  gallery: 'Galería de fotos',
  message: 'Mensaje o sorpresa',
  summary: 'Resumen y confirmación',
}

export function newStep(type: StepType, over: Partial<Step> = {}): Step {
  const base: Step = {
    id: uid(), type, name: STEP_TYPE_LABELS[type].split(' (')[0], hidden: false, required: false,
    label: '', title: 'Nuevo paso', description: '', emoji: '', signature: '', buttonText: 'Continuar',
    transitionMessage: '', options: [], layout: 'list', minSelect: 1, maxSelect: 1, placeholder: 'Escribe aquí…',
    askDate: true, askTime: true, gallery: [], yesText: 'Sí', yesEmoji: '💖', acceptMessage: '', showNoButton: true, anim: {},
  }
  if (type === 'single_choice' || type === 'cards') { base.options = [newOption('Opción 1', '⭐'), newOption('Opción 2', '🌙')]; base.required = true }
  if (type === 'multi_choice') { base.options = [newOption('Opción 1', '⭐'), newOption('Opción 2', '🌙')]; base.maxSelect = 5; base.required = true }
  if (type === 'cards') base.layout = 'grid2'
  if (type === 'datetime') { base.title = '¿Cuándo nos vemos?'; base.required = true }
  if (type === 'text') base.title = 'Cuéntame algo…'
  if (type === 'summary') { base.title = 'Todo listo'; base.buttonText = 'Confirmar ✨' }
  if (type === 'question_buttons') base.required = true
  return { ...base, ...over }
}

// ---------------------------------------------------------------- Presets de tono
interface TonePreset {
  id: ToneId; name: string; emoji: string; description: string; themeId: string
  texts: Partial<Texts>
  steps: Partial<Record<StepRole, Partial<Step>>>
  final: Partial<FinalScreen>
  noMessages: string[]
  heart: string
}

export const TONES: TonePreset[] = [
  {
    id: 'romantico', name: 'Romántico', emoji: '💘', description: 'Cálido, sincero y con estilo.', themeId: 'rosa', heart: '💖',
    texts: { envelopeTitle: 'Una invitación para ti, {destinatario}', envelopeSubtitle: 'De parte de {remitente}', envelopeButton: 'Abrir invitación 💌' },
    steps: {
      cover: { label: 'INVITACIÓN OFICIAL', title: 'Para {destinatario}', description: 'Con cariño, {remitente} preparó algo pensando en ti.', buttonText: 'Descubrir', emoji: '💌', signature: 'Con cariño, {remitente}' },
      ask: { label: 'UNA PREGUNTA', title: '{destinatario}, ¿quieres tener una cita conmigo?', description: 'Prometo portarme lindo, escoger buena comida y mirarte como si fueras mi plan favorito.', yesText: 'Sí, quiero', acceptMessage: 'Me hiciste muy feliz 💖', transitionMessage: 'Perfecto, ahora los detalles…' },
      food: { label: 'LA COMIDA', title: '¿Qué se te antoja comer?', description: 'Elige lo que más te guste.', transitionMessage: 'Buena elección 😋' },
      plan: { label: 'EL PLAN', title: '¿Qué plan te gustaría?', description: 'Tú mandas, yo acompaño.', transitionMessage: 'Va a ser inolvidable ✨' },
      datetime: { label: 'EL MOMENTO', title: '¿Cuándo te quedaría bien?', description: 'Elige el día y la hora que prefieras.' },
      surprise: { label: 'UNA SORPRESA', title: 'Algo que quería decirte', description: 'Desde que te conocí, mis días tienen mejor sabor.', emoji: '💝', buttonText: 'Seguir' },
      summary: { label: 'RESUMEN', title: 'Así quedó nuestra cita', description: 'Revisa tus elecciones y confirma.', buttonText: 'Confirmar mi cita 💖' },
    },
    final: { emoji: '🥰', title: '¡Es una cita, {destinatario}!', message: 'Gracias por decir que sí. {remitente} ya está contando los minutos.', signature: 'Con cariño, {remitente}' },
    noMessages: ['¿Segura? 🥺', 'Piénsalo otra vez…', 'Ese botón está muy tímido 💗', 'Mejor di que sí 😌'],
  },
  {
    id: 'tierno', name: 'Tierno', emoji: '🧸', description: 'Dulce, suave y con mucho cariño.', themeId: 'lavanda', heart: '🌸',
    texts: { envelopeTitle: 'Tengo algo para ti', envelopeSubtitle: 'Es chiquito pero hecho con cariño', envelopeButton: 'Abrir con cuidado 🧸' },
    steps: {
      cover: { label: 'PARA TI', title: 'Hola, {destinatario}', description: '{remitente} te escribió algo chiquitito pero bonito.', buttonText: 'Ver qué es', emoji: '🧸', signature: 'Tu {remitente}' },
      ask: { label: 'UNA PREGUNTITA', title: '{destinatario}, ¿te gustaría salir conmigo?', description: 'Te prometo cuidarte, reírme contigo y llevarte a un lugar bonito.', yesText: 'Sí, me encantaría', acceptMessage: 'Mi corazón hizo piruetas 🌸', transitionMessage: 'Ahora lo más rico…' },
      food: { label: 'LA COMIDITA', title: '¿Qué se te antoja?', description: 'Dime tus antojos y yo me encargo.', transitionMessage: 'Anotado con mucho cariño 📝' },
      plan: { label: 'EL PLANCITO', title: '¿Qué te gustaría hacer?', description: 'Lo importante es estar juntitos.', transitionMessage: 'Qué lindo plan ☁️' },
      datetime: { label: 'EL DÍA', title: '¿Qué día y hora te quedan bien?', description: 'Sin prisa, tú eliges.' },
      surprise: { label: 'SORPRESITA', title: 'Un mensajito', description: 'Contigo hasta lo simple se siente especial.', emoji: '🌷', buttonText: 'Seguir' },
      summary: { label: 'RESUMEN', title: 'Nuestro planecito', description: 'Mira cómo quedó.', buttonText: 'Confirmar 🌸' },
    },
    final: { emoji: '🧸', title: '¡Qué felicidad, {destinatario}!', message: 'Gracias por aceptar. {remitente} está súper contento.', signature: 'Tu {remitente}' },
    noMessages: ['Ay no, no me hagas pucheros 🥹', 'Un ratito más, ¿sí?', 'Ese botón se escapa 🐾'],
  },
  {
    id: 'divertido', name: 'Divertido', emoji: '🎉', description: 'Bromas, energía y buen humor.', themeId: 'picnic', heart: '🎈',
    texts: { envelopeTitle: '¡Llegó correspondencia importante!', envelopeSubtitle: 'Y no, no es publicidad', envelopeButton: '¡Abrir ya! 🎉' },
    steps: {
      cover: { label: 'MISIÓN SECRETA', title: '{destinatario}, tienes una misión', description: '{remitente} necesita tu ayuda urgente (es broma, pero abre).', buttonText: 'Acepto la misión', emoji: '🕵️', signature: '— {remitente}, agente especial' },
      ask: { label: 'PREGUNTA CLAVE', title: '{destinatario}, ¿salimos a divertirnos?', description: 'Garantizo risas, buena comida y cero aburrimiento.', yesText: '¡Claro que sí!', acceptMessage: '¡Eso! Ya me estoy riendo solo 🎉', transitionMessage: 'Ahora lo importante: comer' },
      food: { label: 'EL MENÚ', title: '¿Con qué te llenamos la barriga?', description: 'Elige tu combustible.', transitionMessage: '¡Qué buen gusto! 😋' },
      plan: { label: 'LA AVENTURA', title: '¿Qué plan armamos?', description: 'Elige la aventura.', transitionMessage: '¡Esto se pone bueno! 🚀' },
      datetime: { label: 'EL DÍA D', title: '¿Cuándo es la fiesta?', description: 'Marca la fecha y la hora.' },
      surprise: { label: 'BONUS', title: 'Dato curioso', description: 'El 100% de mis planes mejoran si vienes.', emoji: '🎁', buttonText: 'Seguir' },
      summary: { label: 'RESUMEN', title: 'El plan maestro', description: 'Revisa que todo esté bien.', buttonText: '¡Confirmar plan! 🎉' },
    },
    final: { emoji: '🎊', title: '¡Plan confirmado!', message: '{destinatario}, prepárate: {remitente} ya está emocionado.', signature: '— {remitente}' },
    noMessages: ['¡Casi! Pero no 😜', 'Ese botón tiene patines', '¿En serio lo intentas? 😂', 'Rendirse es válido', 'Ok, ya, pulsa Sí'],
  },
  {
    id: 'coqueto', name: 'Coqueto', emoji: '😏', description: 'Atrevido pero con encanto.', themeId: 'atardecer', heart: '🔥',
    texts: { envelopeTitle: 'Esto es para ti, {destinatario}', envelopeSubtitle: 'Y creo que te va a gustar', envelopeButton: 'Abrir… si te atreves 😏' },
    steps: {
      cover: { label: 'SOLO PARA TI', title: 'Hola, {destinatario}', description: 'Hay alguien que no deja de pensar en ti.', buttonText: 'Ver quién', emoji: '😏', signature: '— {remitente}' },
      ask: { label: 'TENGO UNA PROPUESTA', title: '{destinatario}, ¿una cita conmigo?', description: 'Te aviso que soy encantador y puntual.', yesText: 'Me convenciste', acceptMessage: 'Sabía que dirías que sí 😉', transitionMessage: 'Vamos bien…' },
      food: { label: 'EL ANTOJO', title: '¿Qué te provoca?', description: 'Cuéntame tus debilidades.', transitionMessage: 'Buen gusto, como el mío 😌' },
      plan: { label: 'EL PLAN', title: '¿Cómo seguimos la noche?', description: 'Elige con confianza.', transitionMessage: 'Me gusta cómo piensas 🔥' },
      datetime: { label: 'LA CITA', title: '¿Cuándo te robo un rato?', description: 'Día y hora, tú decides.' },
      surprise: { label: 'UN SECRETO', title: 'Te confieso algo', description: 'Me encanta cómo me sonríes.', emoji: '🔥', buttonText: 'Seguir' },
      summary: { label: 'RESUMEN', title: 'Tu cita conmigo', description: 'Todo según tus gustos.', buttonText: 'Confirmar 😏' },
    },
    final: { emoji: '😘', title: 'Cita confirmada', message: 'Prepárate, {destinatario}. {remitente} no se va a quedar quieto.', signature: '— {remitente}' },
    noMessages: ['Uy, qué difícil eres 😏', 'Ese no era el botón', 'Me gusta que insistas', 'Rendirse también es sexy'],
  },
  {
    id: 'elegante', name: 'Elegante', emoji: '🥂', description: 'Sobrio, refinado y cuidado.', themeId: 'noche', heart: '✨',
    texts: { envelopeTitle: 'Invitación personal', envelopeSubtitle: 'Para {destinatario}', envelopeButton: 'Abrir invitación' },
    steps: {
      cover: { label: 'INVITACIÓN OFICIAL', title: 'Estimada {destinatario}', description: 'Es un placer dirigirme a ti con una propuesta especial.', buttonText: 'Continuar', emoji: '🥂', signature: 'Atentamente, {remitente}' },
      ask: { label: 'UNA PROPUESTA', title: '{destinatario}, ¿me concederías una cita?', description: 'Será una velada cuidada, con buena mesa y mejor conversación.', yesText: 'Con gusto', acceptMessage: 'Será un honor ✨', transitionMessage: 'Ahora, los detalles' },
      food: { label: 'GASTRONOMÍA', title: '¿Qué te gustaría degustar?', description: 'Selecciona tu preferencia.', transitionMessage: 'Excelente elección' },
      plan: { label: 'LA VELADA', title: '¿Cómo te gustaría que fuera?', description: 'Elige el ambiente.', transitionMessage: 'Un plan memorable' },
      datetime: { label: 'FECHA Y HORA', title: '¿Qué momento te resulta conveniente?', description: 'Indica tu disponibilidad.' },
      surprise: { label: 'UNAS PALABRAS', title: 'Antes de terminar', description: 'Contigo, el tiempo se disfruta distinto.', emoji: '🌹', buttonText: 'Continuar' },
      summary: { label: 'RESUMEN', title: 'Detalles de la velada', description: 'Revisa y confirma.', buttonText: 'Confirmar asistencia' },
    },
    final: { emoji: '🥂', title: 'Cita confirmada', message: 'Gracias, {destinatario}. {remitente} te espera con gusto.', signature: 'Atentamente, {remitente}' },
    noMessages: ['Le ruego reconsiderarlo', 'Ese botón es esquivo', 'Quizá otra opción…'],
  },
  {
    id: 'casual', name: 'Casual', emoji: '😎', description: 'Directo, relajado y sin rodeos.', themeId: 'sol', heart: '⭐',
    texts: { envelopeTitle: 'Ey, {destinatario}', envelopeSubtitle: 'Te dejé algo', envelopeButton: 'Abrir 👀' },
    steps: {
      cover: { label: 'INVITACIÓN', title: 'Hola, {destinatario}', description: '{remitente} tiene un plan para proponerte.', buttonText: 'Ver plan', emoji: '👋', signature: '— {remitente}' },
      ask: { label: 'PREGUNTA', title: '¿Salimos, {destinatario}?', description: 'Algo tranquilo, buena onda y buena comida.', yesText: 'Dale', acceptMessage: '¡Genial! 🙌', transitionMessage: 'Ahora lo que falta' },
      food: { label: 'COMIDA', title: '¿Qué se te antoja?', description: 'Elige lo que quieras.', transitionMessage: 'Listo' },
      plan: { label: 'PLAN', title: '¿Qué hacemos?', description: 'Tú eliges.', transitionMessage: 'Perfecto' },
      datetime: { label: 'CUÁNDO', title: '¿Qué día y hora te sirven?', description: 'El que te quede mejor.' },
      surprise: { label: 'EXTRA', title: 'Una cosita', description: 'Va a estar bueno.', emoji: '🎈', buttonText: 'Seguir' },
      summary: { label: 'RESUMEN', title: 'Así quedó', description: 'Si está bien, confirma.', buttonText: 'Confirmar' },
    },
    final: { emoji: '🙌', title: '¡Listo!', message: 'Quedamos, {destinatario}. {remitente} te escribe para ajustar detalles.', signature: '— {remitente}' },
    noMessages: ['Ese no 😅', 'Pulsa el otro', 'Casi lo logras'],
  },
  {
    id: 'personalizado', name: 'Personalizado', emoji: '🎨', description: 'Sin cambios: tú escribes todo.', themeId: 'rosa', heart: '💖',
    texts: {}, steps: {}, final: {}, noMessages: [],
  },
]

export const getTone = (id: ToneId) => TONES.find((t) => t.id === id) ?? TONES[0]

// ---------------------------------------------------------------- Construcción
const foodOptions = (): Option[] => [
  { id: 'pizza', label: 'Pizza', description: 'Siempre acierta', emoji: '🍕' },
  { id: 'sushi', label: 'Sushi', description: 'Fresco y delicioso', emoji: '🍣' },
  { id: 'hamburguesa', label: 'Hamburguesa', description: 'Con papas, claro', emoji: '🍔' },
  { id: 'pasta', label: 'Pasta', description: 'Comfort food', emoji: '🍝' },
  { id: 'helado', label: 'Helado', description: 'Para el postre', emoji: '🍦' },
]
const planOptions = (): Option[] => [
  { id: 'cine', label: 'Cine', description: 'Película y palomitas', emoji: '🎬' },
  { id: 'paseo', label: 'Paseo', description: 'Caminar y conversar', emoji: '🌆' },
  { id: 'picnic', label: 'Picnic', description: 'Aire libre y snacks', emoji: '🧺' },
  { id: 'videojuegos', label: 'Videojuegos', description: 'Retos y risas', emoji: '🎮' },
]

function baseSteps(): Step[] {
  const s = (role: StepRole, type: StepType, id: string, over: Partial<Step>): Step =>
    newStep(type, { id, role, ...over })
  return [
    s('cover', 'intro', 'cover', { name: 'Portada', buttonText: 'Descubrir' }),
    s('ask', 'question_buttons', 'ask', { name: 'Pregunta para salir', required: true }),
    s('food', 'cards', 'food', { name: 'Comida', options: foodOptions(), layout: 'grid2', required: true, maxSelect: 1 }),
    s('plan', 'cards', 'plan', { name: 'Plan', options: planOptions(), layout: 'grid2', required: true, maxSelect: 1 }),
    s('datetime', 'datetime', 'datetime', { name: 'Fecha y hora', required: true }),
    s('surprise', 'message', 'surprise', { name: 'Mensaje o sorpresa' }),
    s('summary', 'summary', 'summary', { name: 'Resumen y confirmación' }),
  ]
}

export function mergeTone(cfg: InvitationConfig, tone: ToneId): InvitationConfig {
  const p = getTone(tone)
  const next: InvitationConfig = structuredClone(cfg)
  next.meta.tone = tone
  if (tone === 'personalizado') return next
  next.meta.themeId = p.themeId
  const keepBgImage = next.theme.background.image
  next.theme = getTheme(p.themeId)
  if (keepBgImage) { next.theme.background.type = 'image'; next.theme.background.image = keepBgImage }
  next.texts = { ...next.texts, ...p.texts }
  next.steps = next.steps.map((st) => (st.role && p.steps[st.role] ? { ...st, ...p.steps[st.role] } : st))
  next.final = { ...next.final, ...p.final }
  next.noButton = { ...next.noButton, funnyMessages: [...p.noMessages] }
  next.animations = { ...next.animations, hearts: { ...next.animations.hearts, emoji: p.heart } }
  return next
}

export function makeDefaultConfig(tone: ToneId = 'romantico', recipient = 'Hellen', sender = 'Miguel'): InvitationConfig {
  const cfg: InvitationConfig = {
    schemaVersion: 1,
    meta: { recipient, sender, tone: 'personalizado', themeId: 'rosa' },
    theme: getTheme('rosa'),
    texts: { ...baseTexts },
    music: { enabled: false, url: '', volume: 60, loop: true, startAt: 'envelope', playerVisibility: 'discreet' },
    animations: {
      enabled: true, intensity: 60, speed: 1, stepTransition: 'slide', envelope: true, textReveal: true,
      buttonBounce: true, cardReaction: true, emojiReaction: true, confetti: true, confettiEmojis: '💖🎉✨',
      hearts: { enabled: true, emoji: '💖', count: 14 },
      particles: { enabled: true, emoji: '✨', count: 10 },
      photoAnimation: true,
    },
    noButton: {
      text: 'No', emoji: '😅', size: 16, bg: '#f3f4f6', color: '#6b7280', speed: 1, distance: 140, style: 'smooth',
      funnyMessages: [], messagesAfter: 3,
    },
    steps: baseSteps(),
    final: { emoji: '🥰', title: '¡Listo!', message: 'Gracias por responder.', signature: '' },
  }
  return mergeTone(cfg, tone)
}

// ¿La configuración difiere de lo que generaría su preset? (para advertir antes de sobrescribir)
export function hasEditsFromBaseline(cfg: InvitationConfig): boolean {
  const base = makeDefaultConfig(cfg.meta.tone === 'personalizado' ? 'romantico' : cfg.meta.tone, cfg.meta.recipient, cfg.meta.sender)
  const strip = (c: InvitationConfig) => JSON.stringify({ ...c, meta: undefined, music: undefined })
  return strip(base) !== strip({ ...cfg, meta: base.meta })
}
