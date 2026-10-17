import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, Mic, MicOff } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { resolveNode, shortestPath, walkTime } from '../lib/graph'
import { timeToMinutes } from '../lib/utils'
import { conciergeReply, dailyBriefing, hasGroq } from '../lib/groq'
import { Btn } from './ui'
import { Badge } from './ui'

const aiOnline = hasGroq()

export default function Assistant({ open, onClose, setTab, setRouteSignal }) {
  const [log, setLog] = useState([
    { kind: 'bot', text: aiOnline ? 'Hey! I am your AI Campus Concierge (Groq-powered). Ask me anything — routes, food, next class, gate passes.' : 'Hey! I am your Campus Concierge (keyword mode — add VITE_GROQ_API_KEY for full AI). Try "route hostel to ai lab".' },
  ])
  const [val, setVal] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const bodyRef = useRef(null)

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast('Voice not supported', 'Try Chrome or Edge on desktop/Android', 'warn')
    if (listening) { recRef.current?.stop(); return }
    const rec = new SR()
    rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = false
    rec.onresult = (e) => {
      const txt = Array.from(e.results).map((r) => r[0].transcript).join('')
      setVal(txt)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast('Voice error', 'Check microphone permission', 'error') }
    recRef.current = rec
    setListening(true)
    rec.start()
  }
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const timetable = useStore((s) => s.timetable)
  const menu = useStore((s) => s.menu)
  const crowd = useStore((s) => s.crowd)
  const profile = useStore((s) => s.profile)
  const tickets = useStore((s) => s.tickets)

  useEffect(() => { bodyRef.current?.scrollTo({ top: 99999 }) }, [log, open, thinking])

  const push = (m) => setLog((p) => [...p, m])

  const doRoute = (a, b) => {
    const na = resolveNode(nodes, a), nb = resolveNode(nodes, b)
    if (!na || !nb) return null
    setTab('map')
    setRouteSignal({ from: na.id, to: nb.id, nonce: Date.now() })
    return { na, nb, r: shortestPath(nodes, edges, na.id, nb.id) }
  }

  const getNext = () => {
    const wd = new Date().getDay()
    const list = timetable[wd] || []
    const mins = new Date().getHours() * 60 + new Date().getMinutes()
    let nx = null
    list.forEach((x) => { if (timeToMinutes(x.time) > mins && (!nx || timeToMinutes(x.time) < timeToMinutes(nx.time))) nx = x })
    return nx || list[0] || null
  }

  // Keyword fallback (offline mode) — same behavior as before
  const keywordReply = (raw) => {
    const low = raw.toLowerCase()
    const m = low.match(/route.*?from\s+(.+?)\s+to\s+(.+)/) || low.match(/from\s+(.+?)\s+to\s+(.+)/)
    if (low.includes('route') || m) {
      const a = m ? m[1] : 'hostel', b = m ? m[2] : 'ai lab'
      const res = doRoute(a, b)
      if (res?.r) { push({ kind: 'bot', text: `Routing ${res.na.name} → ${res.nb.name}: ${res.r.distance} m, ~${walkTime(res.r.distance)} min. Highlighted on the Live Wayfinding map.` }); onClose(); return }
      push({ kind: 'bot', text: 'I could not resolve those places. Try "route hostel to ai lab".' }); return
    }
    if (low.includes('cold coffee') || (low.includes('order') && low.includes('coffee'))) {
      push({ kind: 'bot', text: 'Opening Cafeteria — add Cold Coffee with + then hit Place Instant Order.' }); setTab('cafeteria'); onClose(); return
    }
    if (low.includes('order')) { push({ kind: 'bot', text: 'Tell me what to order — e.g. "order cold coffee".' }); return }
    if (low.includes('next class') || low.includes('where is my')) {
      const nx = getNext()
      if (!nx) { push({ kind: 'bot', text: 'No upcoming classes today.' }); return }
      push({ kind: 'bot', text: `Next class: ${nx.subject} at ${nx.time} in ${nx.room} (${nx.code}).`, action: { label: 'Navigate Now', run: () => { doRoute('boys hostel', nx.room.startsWith('AI') ? 'ai lab' : nx.room.startsWith('L') ? 'library' : 'academic block a'); onClose() } } })
      return
    }
    if (low.includes('navigate')) {
      const nx = getNext()
      if (nx) { doRoute('boys hostel', nx.room.startsWith('AI') ? 'ai lab' : 'academic block a'); push({ kind: 'bot', text: `Navigating to ${nx.room} for ${nx.subject}.` }); onClose() }
      else push({ kind: 'bot', text: 'No classes to navigate to today.' })
      return
    }
    if (low.includes('gate pass')) { push({ kind: 'bot', text: 'Opening Facilities → Digital Gate Pass. Daytime outings auto-approve.' }); setTab('facilities'); onClose(); return }
    if (low.includes('lost') || low.includes('maintenance') || low.includes('report')) { push({ kind: 'bot', text: 'Open Maintenance and describe the issue — auto-triage dept + priority.' }); setTab('maintenance'); onClose(); return }
    push({ kind: 'bot', text: 'On it. Try: "route hostel to ai lab", "order cold coffee", "where is my next class", "generate gate pass".' })
  }

  const runAction = (action) => {
    if (!action || action.type === 'none') return null
    try {
      if (action.type === 'route' && action.from && action.to) {
        const res = doRoute(action.from, action.to)
        if (res?.r) { onClose(); return null }
        return null
      }
      if (action.type === 'goto' && action.tab) { setTab(action.tab); onClose(); return null }
      if (action.type === 'order' && action.item) {
        setTab('cafeteria'); onClose()
        toast('AI added context', `Look for "${action.item}" in the Cafeteria menu`, 'success')
        return null
      }
      if (action.type === 'checkin') { setTab('attendance'); onClose(); return null }
      if (action.type === 'topup') { setTab('cafeteria'); onClose(); return null }
    } catch {}
    return null
  }

  const reply = async (raw) => {
    const v = raw.trim()
    if (!v || thinking) return
    push({ kind: 'user', text: v })
    setVal('')
    if (!aiOnline) { keywordReply(v); return }
    setThinking(true)
    try {
      const wd = new Date().getDay()
      const ctx = { nodes, timetable: timetable[wd] || [], menu, crowd, wallet: profile.wallet }
      const { reply: text, action } = await conciergeReply(v, ctx)
      // attach a contextual action button for routes
      let actionBtn = null
      if (action?.type === 'route') {
        actionBtn = { label: 'Show route on map', run: () => runAction(action) }
        runAction(action)
      } else if (action?.type === 'goto') {
        actionBtn = { label: `Open ${action.tab}`, run: () => runAction(action) }
        runAction(action)
      } else if (action && action.type !== 'none') {
        runAction(action)
      }
      push({ kind: 'bot', text, ...(actionBtn ? { action: actionBtn } : {}) })
    } catch (e) {
      console.warn('Groq concierge failed, keyword fallback:', e)
      keywordReply(v)
      push({ kind: 'bot', text: '(AI hiccup — answered with offline routing.)' })
    } finally {
      setThinking(false)
    }
  }

  const runBriefing = async () => {
    push({ kind: 'user', text: "Today's briefing" })
    if (!aiOnline) { push({ kind: 'bot', text: 'Add VITE_GROQ_API_KEY for AI briefings.' }); return }
    setThinking(true)
    try {
      const wd = new Date().getDay()
      const text = await dailyBriefing({ timetable: timetable[wd] || [], crowd, wallet: profile.wallet, tickets: tickets.filter((t) => t.status !== 'Resolved').length })
      push({ kind: 'bot', text: text || 'Have a great day on campus!' })
    } catch (e) {
      push({ kind: 'bot', text: 'Could not fetch briefing right now.' })
    } finally { setThinking(false) }
  }

  const quicks = [
    { label: '☀️ Brief me', run: runBriefing },
    { label: 'Route Hostel→AI Lab', run: () => { doRoute('boys hostel', 'ai lab'); onClose() } },
    { label: 'Order Cold Coffee', run: () => { setTab('cafeteria'); onClose() } },
    { label: 'Where is my next class?', run: () => reply('where is my next class?') },
    { label: 'Generate gate pass', run: () => { setTab('facilities'); onClose() } },
  ]

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-[90] transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`fixed top-0 right-0 h-full w-[400px] max-w-[92vw] z-[95] bg-[#12151e]/95 border-l border-white/15 backdrop-blur-xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-[18px] border-b border-white/10">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <Sparkles size={18} className="text-violet-300" /> Campus Concierge
            <Badge tone={aiOnline ? 'emerald' : 'muted'}>{aiOnline ? 'Groq AI online' : 'keyword mode'}</Badge>
          </div>
          <button onClick={onClose} className="w-[38px] h-[38px] grid place-items-center rounded-[11px] border border-white/10 bg-white/5 text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {log.map((m, i) => (
            <div key={i} className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed anim-fadeUp ${m.kind === 'bot' ? 'bg-white/5 border border-white/10 rounded-bl-sm self-start' : 'bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 border border-white/15 rounded-br-sm self-end'}`}>
              {m.text}
              {m.action && <div className="mt-2"><Btn size="sm" variant="primary" onClick={m.action.run}>{m.action.label}</Btn></div>}
            </div>
          ))}
          {thinking && (
            <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] bg-white/5 border border-white/10 rounded-bl-sm self-start flex items-center gap-2 text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap px-4 pb-3">
          {quicks.map((q) => <Btn key={q.label} size="sm" variant="ghost" onClick={q.run}>{q.label}</Btn>)}
        </div>
        <div className="flex gap-2 p-3.5 border-t border-white/10">
          <button onClick={toggleVoice} title="Voice input" className={`w-[42px] h-[42px] shrink-0 grid place-items-center rounded-[11px] border cursor-pointer ${listening ? 'bg-rose-400/20 border-rose-400/40 text-rose-300 animate-pulse' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') reply(val) }} placeholder={aiOnline ? 'Ask anything about campus…' : 'Ask: where is my next class?'} className="flex-1 h-[42px] px-3.5 bg-[#0c0e15] border border-white/10 rounded-[11px] text-[13px] outline-none focus:border-indigo-400" />
          <button onClick={() => reply(val)} disabled={thinking} className="w-[42px] h-[42px] grid place-items-center rounded-[11px] bg-gradient-to-br from-indigo-400 to-cyan-400 text-[#05070c] cursor-pointer disabled:opacity-50">
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </aside>
    </>
  )
}
