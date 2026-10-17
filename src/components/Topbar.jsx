import { useEffect, useState } from 'react'
import { Search, Sparkles, Wallet, GraduationCap, Menu } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { fmtClock, timeToMinutes } from '../lib/utils'

export default function Topbar({ onPalette, onAssistant, onMenu }) {
  const profile = useStore((s) => s.profile)
  const timetable = useStore((s) => s.timetable)
  const topUp = useStore((s) => s.topUp)
  const [clock, setClock] = useState('--:--:--')
  const [next, setNext] = useState(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(fmtClock(now))
      const wd = now.getDay()
      const list = timetable[wd] || []
      const mins = now.getHours() * 60 + now.getMinutes()
      let nx = null
      list.forEach((x) => {
        if (timeToMinutes(x.time) > mins && (!nx || timeToMinutes(x.time) < timeToMinutes(nx.time))) nx = x
      })
      setNext(nx || list[0] || null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timetable])

  return (
    <header className="h-[68px] shrink-0 flex items-center gap-2.5 px-5 border-b border-white/10 bg-[#090a0f]/60 backdrop-blur-md z-30">
      <button type="button" aria-label="Toggle menu" className="md:hidden w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-400 cursor-pointer active:bg-white/10" onClick={onMenu}>
        <Menu size={18} />
      </button>

      <div className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-full border border-white/10 bg-white/5 text-emerald-300 text-xs font-medium font-mono whitespace-nowrap">
        <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" /> {clock}
      </div>

      <div className="max-md:hidden inline-flex items-center gap-2 h-[38px] px-3.5 rounded-full border border-white/10 bg-white/5 text-cyan-300 text-xs font-medium whitespace-nowrap">
        <GraduationCap size={15} />
        <span>{next ? `${next.time} · ${next.subject} (${next.room})` : 'No upcoming classes today'}</span>
      </div>

      <div className="flex-1" />

      <button onClick={() => { topUp(500); toast('Wallet topped up', 'Added Rs.500 to Campus Wallet', 'success') }} className="inline-flex items-center gap-2 h-[38px] px-3.5 rounded-full border border-white/10 bg-white/5 text-emerald-300 text-[13px] font-semibold cursor-pointer hover:bg-white/10">
        <Wallet size={15} /> ₹<span>{profile.wallet.toFixed(2)}</span>
      </button>

      <button onClick={onPalette} className="flex items-center gap-2.5 h-[38px] w-[320px] max-w-[30vw] max-lg:max-w-none max-lg:w-auto px-3 rounded-[11px] bg-white/5 border border-white/10 text-slate-500 text-[13px] cursor-pointer hover:border-white/20 hover:text-slate-300">
        <Search size={16} />
        <span className="flex-1 text-left overflow-hidden text-ellipsis whitespace-nowrap max-lg:hidden">Search or ask the campus assistant…</span>
        <kbd className="font-mono text-[10.5px] px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10">Ctrl K</kbd>
      </button>

      <button onClick={onAssistant} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer">
        <Sparkles size={18} />
      </button>
    </header>
  )
}
