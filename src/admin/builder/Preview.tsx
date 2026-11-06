import { useMemo, useState } from 'react'
import { Runtime, type Adapter } from '../../runtime/Runtime'
import type { InvitationConfig } from '../../lib/types'
import { btnGhost } from './Fields'

// Vista previa: recorre todo el flujo sin registrar aperturas, respuestas ni confirmaciones reales.
const delay = () => new Promise<void>((r) => setTimeout(r, 120))
const previewAdapter: Adapter = { markStarted: delay, save: delay, confirm: delay }

export function Preview({ cfg }: { cfg: InvitationConfig }) {
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone')
  const [run, setRun] = useState(0)
  const style = useMemo(
    () => (device === 'phone' ? { width: 390, height: 760 } : { width: '100%', height: 640 }),
    [device],
  )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btnGhost} onClick={() => setDevice('phone')} aria-pressed={device === 'phone'}>📱 Celular</button>
        <button type="button" className={btnGhost} onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'}>🖥️ Escritorio</button>
        <button type="button" className={btnGhost} onClick={() => setRun((r) => r + 1)}>↺ Reiniciar</button>
        <span className="text-xs text-gray-500">Modo prueba: no se guarda nada.</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto overflow-hidden rounded-[28px] border-8 border-gray-800 bg-white shadow-xl" style={{ ...style, maxWidth: '100%' }}>
          {/* transform crea un contexto para los elementos fixed (confeti, avisos) dentro del marco */}
          <div className="h-full overflow-y-auto" style={{ transform: 'translateZ(0)' }}>
            <Runtime key={run} mode="preview" config={cfg} adapter={previewAdapter} />
          </div>
        </div>
      </div>
    </div>
  )
}
