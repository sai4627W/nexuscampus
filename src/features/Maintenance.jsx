import { useState } from 'react'
import { AlertCircle, SquareKanban, Send, RefreshCw, ChevronsRight, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { triageIssue } from '../lib/seed'
import { triageWithAI, matchLostFound, hasGroq } from '../lib/groq'
import { uid, formatAgo } from '../lib/utils'
import { Card, CardTitle, Badge, Btn, Field, inputCls, areaCls } from '../components/ui'

const cols = [
  { id: 'Reported', title: 'Reported' },
  { id: 'Assigned', title: 'Assigned' },
  { id: 'Resolved', title: 'Resolved' },
]

const deptTone = (d) => (d === 'Electrical' ? 'amber' : d === 'IT Support' ? 'indigo' : d === 'Housekeeping' ? 'cyan' : 'muted')
const priTone = (p) => (p === 'Urgent' ? 'rose' : p === 'Medium' ? 'amber' : 'emerald')

export default function Maintenance() {
  const tickets = useStore((s) => s.tickets)
  const addTicket = useStore((s) => s.addTicket)
  const updateTicket = useStore((s) => s.updateTicket)
  const [loc, setLoc] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [matchBusy, setMatchBusy] = useState(false)
  const [matches, setMatches] = useState(null)

  const runMatcher = async () => {
    const q = desc.trim() || loc.trim()
    if (!q) return toast('Type an item first', 'Describe what you lost (e.g. "blue water bottle")', 'warn')
    setMatchBusy(true)
    try { setMatches(await matchLostFound(q, list)) }
    catch (e) { toast('AI matcher failed', String(e.message || e).slice(0, 120), 'error') }
    finally { setMatchBusy(false) }
  }

  const submit = async () => {
    if (!desc.trim()) return toast('Description required', 'Describe the issue to auto-triage', 'error')
    setBusy(true)
    let t = triageIssue(desc), aiNote = ''
    if (hasGroq()) {
      try {
        const ai = await triageWithAI(desc, loc.trim() || 'Campus')
        t = { dept: ai.dept, priority: ai.priority }
        aiNote = ai.reason ? ` · AI: ${ai.reason}` : ' · AI-triaged'
      } catch (e) { aiNote = ' · keyword fallback (AI hiccup)' }
    }
    addTicket({ id: uid('tic'), title: desc.length > 60 ? desc.slice(0, 57) + '…' : desc, desc, loc: loc.trim() || 'Campus', dept: t.dept, priority: t.priority, status: 'Reported', createdAt: new Date().toISOString() })
    setDesc(''); setLoc(''); setBusy(false)
    toast('Ticket submitted & auto-triaged', `${t.dept} · ${t.priority}${aiNote}`.slice(0, 140), 'success')
  }

  const list = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="anim-fadeUp">
      <div className="mb-5">
        <div className="text-[22px] font-bold tracking-tight">Campus Maintenance & Lost-and-Found Router</div>
        <div className="text-slate-400 text-[13px] mt-1">Auto-triage by keywords → auto-assign dept & priority → live Kanban</div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle icon={<AlertCircle size={17} />} right={<Badge tone={hasGroq() ? 'violet' : 'amber'}>{hasGroq() ? 'AI Triage Enabled' : 'Auto-Triage Enabled'}</Badge>}>Report New Issue</CardTitle>
          <Field label="Location"><input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. Academic Block A Room 204, Library Entrance" className={inputCls} /></Field>
          <Field label="Issue Title / Description"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. AC leaking in Block A Room 204, Lost Blue Water Bottle near Library" className={areaCls} /></Field>
          <div className="flex gap-2 flex-wrap">
            <Btn variant="primary" disabled={busy} onClick={submit}>{busy ? <Loader2 size={16} className="animate-spin" /> : hasGroq() ? <Sparkles size={16} /> : <Send size={16} />} {busy ? 'Triaging…' : 'Submit & Auto-Triage'}</Btn>
            {hasGroq() && <Btn variant="ghost" disabled={matchBusy} onClick={runMatcher}>{matchBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI Match Lost & Found</Btn>}
          </div>
          {matches && (
            <div className="mt-3 p-3 rounded-[11px] bg-violet-400/5 border border-violet-400/20">
              <div className="text-[12px] font-semibold text-violet-300 mb-2 flex items-center gap-1.5"><Sparkles size={13} /> AI match results</div>
              {matches.matches?.length > 0 ? matches.matches.map((m) => (
                <div key={m.item} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                  <div className="text-[12px]">{m.item}<div className="text-[11px] text-slate-500">{m.reason}</div></div>
                  <Badge tone={m.confidence > 70 ? 'emerald' : m.confidence > 40 ? 'amber' : 'muted'}>{m.confidence}%</Badge>
                </div>
              )) : <div className="text-[12px] text-slate-400">No matching reports yet.</div>}
              {matches.advice && <div className="text-[11.5px] text-slate-400 mt-2">💡 {matches.advice}</div>}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle icon={<SquareKanban size={17} />} right={<Btn size="sm" variant="ghost" onClick={() => toast('Kanban refreshed', 'Statuses synced', 'info')}><RefreshCw size={14} /> Refresh</Btn>}>Live Status Tracker (Kanban)</CardTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {cols.map((c) => {
              const inCol = list.filter((x) => x.status === c.id)
              return (
                <div key={c.id} className="bg-[#0c0e15] border border-white/10 rounded-2xl p-3.5 min-h-[200px]">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>{c.title}</span><Badge tone="muted">{inCol.length}</Badge>
                  </div>
                  {inCol.map((t) => (
                    <div key={t.id} className="bg-white/5 border border-white/10 rounded-[11px] p-3 mb-2.5 anim-fadeUp">
                      <div className="font-semibold text-[13px] mb-1">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mb-2">{t.location} · {formatAgo(t.createdAt)}</div>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        <Badge tone={deptTone(t.dept)}>{t.dept}</Badge>
                        <Badge tone={priTone(t.priority)}>{t.priority}</Badge>
                      </div>
                      {t.status === 'Reported' && <Btn size="sm" onClick={() => { updateTicket(t.id, { status: 'Assigned' }); toast('Ticket assigned', t.id, 'info') }}><ChevronsRight size={14} /> Move to Assigned</Btn>}
                      {t.status === 'Assigned' && <Btn size="sm" variant="emerald" onClick={() => { updateTicket(t.id, { status: 'Resolved', resolvedAt: new Date().toISOString() }); toast('Issue resolved', 'Marked as resolved', 'success') }}><CheckCircle2 size={14} /> Mark Resolved</Btn>}
                      {t.status === 'Resolved' && <Btn size="sm" variant="ghost" disabled>Resolved</Btn>}
                    </div>
                  ))}
                  {inCol.length === 0 && <div className="text-xs text-slate-600 text-center py-6">No tickets</div>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
