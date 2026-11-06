import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicConfig, Texts } from '../lib/types'

export type StartMoment = 'envelope' | 'first_step' | 'accept'

// El audio solo se inicia desde un gesto del usuario (política de reproducción automática).
export function useMusic(music: MusicConfig) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    setFailed(false)
    setPlaying(false)
    started.current = false
    if (!music.enabled || !music.url) { audio.current = null; return }
    const a = new Audio()
    a.preload = 'auto'
    a.src = music.url
    a.loop = music.loop
    a.volume = Math.min(1, Math.max(0, music.volume / 100))
    a.onerror = () => { setFailed(true); setPlaying(false) }
    a.onplay = () => setPlaying(true)
    a.onpause = () => setPlaying(false)
    audio.current = a
    return () => { a.pause(); a.src = ''; audio.current = null }
  }, [music.enabled, music.url, music.loop])

  useEffect(() => { if (audio.current) audio.current.volume = Math.min(1, Math.max(0, music.volume / 100)) }, [music.volume])
  useEffect(() => { if (audio.current) audio.current.muted = muted }, [muted])

  const play = useCallback(async () => {
    const a = audio.current
    if (!a) return
    try { await a.play() } catch { /* bloqueado o formato no compatible: no rompe la invitación */ }
  }, [])

  // Llamar SIEMPRE dentro del manejador de un clic/toque
  const maybeStart = useCallback((moment: StartMoment) => {
    if (started.current || !music.enabled || music.startAt !== moment) return
    started.current = true
    void play()
  }, [music.enabled, music.startAt, play])

  const toggle = useCallback(() => {
    const a = audio.current
    if (!a) return
    if (a.paused) void play(); else a.pause()
  }, [play])

  return { available: music.enabled && Boolean(music.url) && !failed, failed, playing, muted, toggle, toggleMute: () => setMuted((m) => !m), maybeStart }
}

export function MusicBar({ api, music, texts }: { api: ReturnType<typeof useMusic>; music: MusicConfig; texts: Texts }) {
  if (!api.available || music.playerVisibility === 'hidden') return null
  const discreet = music.playerVisibility === 'discreet'
  const btn = 'flex items-center justify-center rounded-full bg-white/90 text-base shadow-md backdrop-blur active:scale-95'
  return (
    <div className="sticky top-0 z-40 h-0">
      <div data-protected className="absolute right-3 top-3 flex gap-2" style={{ opacity: discreet ? 0.75 : 1 }}>
        <button type="button" onClick={api.toggle} aria-label={api.playing ? texts.musicPause : texts.musicPlay}
          className={btn} style={{ width: 40, height: 40 }}>
          {api.playing ? '⏸' : '🎵'}
        </button>
        <button type="button" onClick={api.toggleMute} aria-label={api.muted ? texts.musicUnmute : texts.musicMute}
          className={btn} style={{ width: 40, height: 40 }}>
          {api.muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  )
}
