import { useEffect, useMemo, useRef, useState } from 'react'
import { Terminal, Route, Coffee, Utensils, Ticket, GraduationCap, Navigation, QrCode, Wallet, RotateCcw, Flame, Building2, Wrench, WashingMachine, BookOpen, Search } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { resolveNode, shortestPath, edgeWeight, walkTime } from '../lib/graph'
import { timeToMinutes } from '../lib/utils'

export default function CommandPalette({ open, onClose, setTab, routeSignal, setRouteSignal, setAssistantOpen, openCheckIn }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const timetable = useStore((s) => s.timetable)
  const topUp = useStore((s) => s.topUp)
  const resetDemo = useStore((s) => s.resetDemo)

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open ])

  const doRoute = (a, b) => {
    const na = resolveNode(nodes, a), nb = resolveNode(nodes, b)
    if (!na || !nb) { toast('Could not resolve locations', `${a} to ${b}`, 'error'); return }
    setTab('map')
    setRouteSignal({ from: na.id, to: nb.id, nonce: Date.now() })
    const r = shortestPath(nodes, edges, na.id, nb.id)
    if (r) toast('Route computed', `${na.name} to ${nb.name} · ${r.distance}m · ~${walkTime(r.distance)} min`, 'success')
  }

  const nextClass = () => {
    const wd = new Date().getDay()
    const list = timetable[wd] || []
    const mins = new Date().getHours() * 60 + new Date().getMinutes()
    let nx = null
    list.forEach((x) => { if (timeToMinutes(x.time) > mins && (!nx || timeToMinutes(x.time) < timeToMinutes(nx.time))) nx = x })
    return nx || list[0] || null
  }

  const commands = useMemo(() => [
    { id: 'r1', title: 'Route me from Hostel to AI Lab', sub: 'Shortest path with directions', icon: Route, run: () => doRoute('boys hostel', 'ai lab') },
    { id: 'r2', title: 'Route me from Girls Hostel to Library', sub: 'Live shortest path', icon: Route, run: () => doRoute('girls hostel', 'library') },
    { id: 'r3', title: 'Route me from Main Gate to Academic Block A', sub: 'Distance + walk time', icon: Route, run: () => doRoute('main gate', 'academic block a') },
    { id: 'r4', title: 'Route me from Cafeteria to Central Library', sub: 'Quick navigation', icon: Route, run: () => doRoute('cafeteria', 'library') },
    { id: 'c1', title: 'Order cold coffee', sub: 'Go to Cafeteria checkout', icon: Coffee, run: () => { setTab('cafeteria'); toast('Cold Coffee', 'Use + on Cold Coffee, then Place Instant Order', 'success') } },
    { id: 'c2', title: 'Order Veg Thali', sub: 'Go to Cafeteria checkout', icon: Utensils, run: () => { setTab('cafeteria'); toast('Veg Thali', 'Add from Lunch filter, then checkout', 'success') } },
    { id: 'g1', title: 'Generate gate pass', sub: 'Open Facilities gate pass form', icon: Ticket, run: () => { setTab('facilities'); toast('Gate Pass form ready', 'Fill reason + times', 'info') } },
    { id: 'n1', title: 'Where is my next class?', sub: 'Read live timetable', icon: GraduationCap, run: () => { const nx = nextClass(); if (nx) toast(`Next: ${nx.subject}`, `${nx.time} · ${nx.room}`, 'info'); else toast('No upcoming classes today', 'Timetable is clear', 'info') } },
    { id: 'n2', title: 'Navigate Now to next class', sub: 'Route to class venue', icon: Navigation, run: () => { const nx = nextClass(); if (!nx) return toast('No classes today', '', 'info'); doRoute('boys hostel', nx.room.startsWith('AI') ? 'ai lab' : nx.room.startsWith('L') ? 'library' : 'academic block a') } },
    { id: 'q1', title: 'Simulate smart class check-in', sub: 'Launch QR / OTP check-in', icon: QrCode, run: () => { setTab('attendance'); setTimeout(() => openCheckIn?.(), 150) } },
    { id: 'w1', title: 'Top up Campus Wallet Rs.500', sub: 'Instant top-up', icon: Wallet, run: () => { topUp(500); toast('Wallet topped up', 'Rs.500 added', 'success') } },
    { id: 'x1', title: 'Reset Demo Data', sub: 'Restore seed dataset', icon: RotateCcw, run: () => { resetDemo(); toast('Demo data reset', 'Seed restored', 'success') } },
    { id: 'm1', title: 'Report a maintenance issue', sub: 'Open auto-triage form', icon: Wrench, run: () => { setTab('maintenance') } },
    { id: 'l1', title: 'Book a washing machine', sub: 'Find free laundry slot', icon: WashingMachine, run: () => { setTab('facilities') } },
    { id: 'p1', title: 'Book a study pod', sub: 'Reserve quiet space', icon: BookOpen, run: () => { setTab('facilities') } },
  ], [nodes, edges, timetable])

  const results = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return commands
    return commands.filter((c) => c.title.toLowerCase().includes(s) || c.sub.toLowerCase().includes(s))
  }, [q, commands])

  useEffect(() => setSel(0), [q])

  if (!open) return null
  const run = (c) => { try { c.run() } catch (e) { toast('Command failed', c.title, 'error') } onClose() }

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm flex items-start justify-center px-5 pt-[9vh]" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[620px] glass rounded-3xl shadow-2xl overflow-hidden anim-popIn">
        <div className="flex items-center gap-3 px-[18px] py-4 border-b border-white/10">
          <Terminal size={19} className="text-indigo-300" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % Math.max(1, results.length)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + Math.max(1, results.length)) % Math.max(1, results.length)) }
              if (e.key === 'Enter' && results[sel]) run(results[sel])
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Type a command… try 'route hostel to ai lab'"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-slate-600"
          />
          <kbd className="font-mono text-[10.5px] px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-slate-400">Esc</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length === 0 && <div className="p-7 text-center text-slate-500 text-[13px]">No results found</div>}
          {results.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={c.id} onClick={() => run(c)} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] cursor-pointer ${i === sel ? 'bg-indigo-400/15' : ''}`}>
                <div className={`w-8 h-8 rounded-[9px] grid place-items-center shrink-0 ${i === sel ? 'bg-indigo-400 text-[#05070c]' : 'bg-white/10'}`}>
                  <Icon size={16} className={i === sel ? '' : 'text-indigo-300'} />
                </div>
                <div><div className="font-semibold text-[13.5px]">{c.title}</div><div className="text-[11.5px] text-slate-500">{c.sub}</div></div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 px-[18px] py-2.5 border-t border-white/10 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded bg-white/10 border border-white/10">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded bg-white/10 border border-white/10">⏎</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded bg-white/10 border border-white/10">Ctrl K</kbd> toggle</span>
        </div>
      </div>
    </div>
  )
}
