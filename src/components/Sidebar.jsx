import { Map, CalendarCheck, Utensils, WashingMachine, Wrench, Hexagon, RotateCcw } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { Btn } from './ui'
import AuthButton from './AuthButton'

const items = [
  { id: 'map', label: 'Live Wayfinding', icon: Map },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'cafeteria', label: 'Cafeteria', icon: Utensils },
  { id: 'facilities', label: 'Facilities', icon: WashingMachine },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
]

export default function Sidebar({ tab, setTab, onReset, user, open, onClose }) {
  const profile = useStore((s) => s.profile)
  return (
    <aside className={`w-[248px] shrink-0 border-r border-white/10 bg-gradient-to-b from-[#12151e] to-[#090a0f] backdrop-blur-md flex flex-col p-[18px_14px] max-md:fixed max-md:top-0 max-md:left-0 max-md:h-full max-md:z-40 max-md:transition-transform max-md:duration-300 ${open ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`} id="sidebar">
      <div className="flex items-center gap-3 px-1.5 pb-5">
        <div className="w-[38px] h-[38px] rounded-[11px] grid place-items-center bg-gradient-to-br from-indigo-400 to-cyan-400 text-[#05070c] shadow-[0_0_24px_rgba(129,140,248,0.45)]">
          <Hexagon size={21} />
        </div>
        <div>
          <div className="font-bold text-[15px] tracking-tight">NexusCampus</div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">Smart Campus OS</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map((it) => {
          const Icon = it.icon
          const active = tab === it.id
          return (
            <button
              key={it.id}
              onClick={() => { setTab(it.id); onClose?.() }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-[13.5px] font-medium cursor-pointer transition-all border border-transparent ${active ? 'bg-gradient-to-r from-indigo-400/15 to-transparent border-white/15 text-white shadow-[inset_2px_0_0_#818cf8]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={17} className={active ? 'text-indigo-300' : ''} />
              {it.label}
            </button>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
        <AuthButton user={user} />
        <div className="flex items-center gap-2.5 p-1.5">
          <div className="w-[38px] h-[38px] rounded-full grid place-items-center font-bold text-[13px] bg-gradient-to-br from-emerald-400 to-cyan-400 text-emerald-950">{profile.initials}</div>
          <div>
            <div className="font-semibold text-[13px]">{profile.name}</div>
            <div className="text-[11px] text-slate-500">{profile.id}</div>
          </div>
        </div>
        <Btn variant="ghost" className="w-full" onClick={onReset}><RotateCcw size={16} /> Reset Demo Data</Btn>
      </div>
    </aside>
  )
}
