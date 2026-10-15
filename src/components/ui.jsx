import { X } from 'lucide-react'

const badgeStyles = {
  emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  amber: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  rose: 'bg-rose-400/10 text-rose-300 border-rose-400/25',
  indigo: 'bg-indigo-400/10 text-indigo-300 border-indigo-400/25',
  cyan: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25',
  violet: 'bg-violet-400/10 text-violet-300 border-violet-400/25',
  muted: 'bg-white/5 text-slate-400 border-white/10',
}

export function Badge({ tone = 'muted', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${badgeStyles[tone] || badgeStyles.muted} ${className}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`glass rounded-2xl p-[18px] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ icon, children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3.5">
      <div className="text-[14.5px] font-semibold flex items-center gap-2.5 tracking-tight">
        <span className="text-indigo-300">{icon}</span>
        {children}
      </div>
      {right}
    </div>
  )
}

const btnStyles = {
  base: 'inline-flex items-center justify-center gap-2 h-[38px] px-[15px] rounded-[11px] text-[13px] font-semibold transition-all border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:-translate-y-px active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
  primary: 'border-0 text-[#05070c] bg-gradient-to-br from-indigo-400 to-cyan-400 shadow-[0_8px_24px_-8px_rgba(129,140,248,0.7)] hover:brightness-110',
  emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30 hover:bg-emerald-400/20',
  rose: 'bg-rose-400/10 text-rose-300 border-rose-400/30 hover:bg-rose-400/20',
  amber: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  ghost: 'bg-transparent hover:bg-white/5',
  sm: 'h-8 px-3 text-xs',
}

export function Btn({ variant, size, className = '', ...props }) {
  const cls = `${btnStyles.base} ${variant === 'primary' ? btnStyles.primary : ''} ${variant === 'emerald' ? btnStyles.emerald : ''} ${variant === 'rose' ? btnStyles.rose : ''} ${variant === 'amber' ? btnStyles.amber : ''} ${variant === 'ghost' ? btnStyles.ghost : ''} ${size === 'sm' ? btnStyles.sm : ''} ${className}`
  return <button className={cls} {...props} />
}

export function Progress({ value, tone = 'indigo' }) {
  const colors = { emerald: '#34d399', amber: '#fbbf24', rose: '#fb7185', indigo: '#818cf8', cyan: '#22d3ee' }
  return (
    <div className="h-[9px] rounded-full bg-white/5 overflow-hidden">
      <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: colors[tone] || colors.indigo }} />
    </div>
  )
}

export function Ring({ pct, tone = 'indigo' }) {
  const colors = { emerald: '#34d399', amber: '#fbbf24', rose: '#fb7185', indigo: '#818cf8' }
  const r = 38, c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div className="w-[92px] h-[92px] relative">
      <svg width="92" height="92" className="-rotate-90">
        <circle cx="46" cy="46" r={r} fill="none" stroke="#1d222f" strokeWidth="8" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={colors[tone]} strokeWidth="8" strokeLinecap="round" strokeDasharray={c.toFixed(1)} strokeDashoffset={off.toFixed(1)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-bold text-[19px] font-mono">{Math.round(pct)}%</div>
    </div>
  )
}

export function Modal({ title, icon, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center px-5 pt-[9vh] pb-5" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="w-full max-w-[560px] glass rounded-3xl shadow-2xl p-[22px] max-h-[80vh] overflow-y-auto anim-popIn">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[17px] font-bold flex items-center gap-2 tracking-tight">
            <span className="text-indigo-300">{icon}</span>{title}
          </div>
          <button onClick={onClose} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"><X size={18} /></button>
        </div>
        {children}
        {footer && <div className="flex gap-2.5 justify-end mt-[18px]">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon, children }) {
  return <div className="text-center py-8 px-4 text-slate-500 text-[13px]"><div className="flex justify-center mb-2.5 opacity-50">{icon}</div>{children}</div>
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 mb-[13px] text-xs text-slate-400 font-medium">
      {label}
      {children}
    </label>
  )
}

export const inputCls = 'w-full h-10 px-3 bg-[#0c0e15] border border-white/10 rounded-[10px] text-slate-100 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition'
export const areaCls = 'w-full px-3 py-2.5 bg-[#0c0e15] border border-white/10 rounded-[10px] text-slate-100 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition resize-y min-h-[84px]'
