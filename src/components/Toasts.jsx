import { useEffect, useState } from 'react'
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react'
import { registerToast } from '../lib/store'

const icons = { success: CheckCircle2, info: Info, warn: AlertTriangle, error: XCircle }
const tones = {
  success: 'bg-emerald-400/15 text-emerald-300',
  info: 'bg-cyan-400/15 text-cyan-300',
  warn: 'bg-amber-400/15 text-amber-300',
  error: 'bg-rose-400/15 text-rose-300',
}

export default function Toasts() {
  const [items, setItems] = useState([])

  useEffect(() => {
    registerToast((t) => {
      setItems((prev) => [...prev, t])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3200)
    })
  }, [])

  return (
    <div className="fixed bottom-[22px] right-[22px] z-[200] flex flex-col gap-2.5 items-end">
      {items.map((t) => {
        const Icon = icons[t.kind] || Info
        return (
          <div key={t.id} className="flex items-center gap-3 min-w-[260px] max-w-[380px] p-3.5 bg-[#171b26] border border-white/15 rounded-[13px] shadow-2xl anim-fadeUp">
            <div className={`w-8 h-8 rounded-[9px] grid place-items-center shrink-0 ${tones[t.kind] || tones.info}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="font-semibold text-[13px]">{t.title}</div>
              {t.sub && <div className="text-[11.5px] text-slate-500">{t.sub}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
