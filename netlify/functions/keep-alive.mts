import type { Config } from '@netlify/functions'

// Comprobación ligera de salud de Supabase (RPC health_check, sin datos privados).
// Frecuencia: se define en netlify.toml ([functions."keep-alive"] schedule, cron en UTC).
// Desactivar: KEEP_ALIVE_ENABLED=false en las variables de entorno de Netlify.
// Importante: esto NO garantiza evitar la pausa de un proyecto gratuito de Supabase;
// solo genera actividad de API periódica. Verifica la política vigente de Supabase.
export default async () => {
  const enabled = (Netlify.env.get('KEEP_ALIVE_ENABLED') ?? 'true').toLowerCase() !== 'false'
  if (!enabled) { console.log('[keep-alive] desactivado por KEEP_ALIVE_ENABLED'); return }

  const url = Netlify.env.get('SUPABASE_URL')
  const key = Netlify.env.get('SUPABASE_ANON_KEY')
  if (!url || !key) { console.error('[keep-alive] faltan SUPABASE_URL o SUPABASE_ANON_KEY'); return }

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/health_check`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    })
    // Solo se registra el código de estado: nunca claves ni cuerpos de respuesta
    if (res.ok) console.log(`[keep-alive] ok (${res.status})`)
    else console.error(`[keep-alive] fallo HTTP ${res.status}`)
  } catch (e) {
    console.error(`[keep-alive] error de red: ${e instanceof Error ? e.name : 'desconocido'}`)
  }
}

// La frecuencia efectiva la fija netlify.toml; esta es la de respaldo si se quita de allí.
export const config: Config = { schedule: '0 12 */3 * *' }
