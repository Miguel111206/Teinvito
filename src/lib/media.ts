import { supabase } from './supabase'
import { uid } from './template'

const BUCKET = 'invitation-media'
export const MAX_IMAGE_MB = 12
export const MAX_AUDIO_MB = 15
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a']

export interface Uploaded { url: string; path: string }
type Progress = (pct: number) => void

// Reduce a 1600px y recomprime a WebP/JPEG. GIF se sube tal cual.
async function optimizeImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: file.type }
  const bmp = await createImageBitmap(file)
  const max = 1600
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  const toBlob = (t: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, t, q))
  const webp = await toBlob('image/webp', 0.82)
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', type: 'image/webp' }
  const jpg = await toBlob('image/jpeg', 0.85)
  if (!jpg) throw new Error('No se pudo optimizar la imagen.')
  return { blob: jpg, ext: 'jpg', type: 'image/jpeg' }
}

// Subida con progreso real (XHR) usando la sesión del administrador
async function putWithProgress(path: string, blob: Blob, type: string, onProgress?: Progress): Promise<void> {
  const { data: s } = await supabase.auth.getSession()
  const token = s.session?.access_token
  if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
  const base = import.meta.env.VITE_SUPABASE_URL as string
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${base}/storage/v1/object/${BUCKET}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY as string)
    xhr.setRequestHeader('Content-Type', type)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Error al subir (${xhr.status}).`)))
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'))
    xhr.send(blob)
  })
}

async function ownerId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('No hay sesión activa.')
  return data.user.id
}

export async function uploadImage(file: File, invitationId: string, onProgress?: Progress): Promise<Uploaded> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Formato no permitido. Usa JPG, PNG, WebP o GIF.')
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`La imagen supera ${MAX_IMAGE_MB} MB.`)
  const { blob, ext, type } = await optimizeImage(file)
  const path = `${await ownerId()}/${invitationId}/img-${uid()}.${ext}`
  await putWithProgress(path, blob, type, onProgress)
  return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function uploadAudio(file: File, invitationId: string, onProgress?: Progress): Promise<Uploaded> {
  const okType = AUDIO_TYPES.includes(file.type) || /\.(mp3|m4a|aac|ogg|wav)$/i.test(file.name)
  if (!okType) throw new Error('Formato de audio no permitido. Usa MP3, M4A, AAC, OGG o WAV.')
  if (file.size > MAX_AUDIO_MB * 1024 * 1024) throw new Error(`El audio supera ${MAX_AUDIO_MB} MB.`)
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${await ownerId()}/${invitationId}/audio-${uid()}.${ext}`
  await putWithProgress(path, file, file.type || 'audio/mpeg', onProgress)
  return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function removeFile(path?: string): Promise<void> {
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined)
}
