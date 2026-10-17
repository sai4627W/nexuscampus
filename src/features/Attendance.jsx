import { useMemo, useState } from 'react'
import { QrCode, Check, X, ShieldCheck, CalendarCheck, History, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { useStore, toast } from '../lib/store'
import { attendanceColor } from '../lib/utils'
import { attendanceStrategy, hasGroq } from '../lib/groq'
import { Card, CardTitle, Badge, Btn, Progress, Ring, Modal, Field, inputCls } from '../components/ui'

export function CheckInModal({ onClose, after }) {
  const subjects = useStore((s) => s.subjects)
  const markAttendance = useStore((s) => s.markAttendance)
  const [otp] = useState(() => String(Math.floor(1000 + Math.random() * 9000)))
  const [val, setVal] = useState('')
  return (
    <Modal title="Smart QR Check-In" icon={<QrCode size={19} />} onClose={onClose} footer={
      <>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => {
          if (val.trim() !== otp) return toast('Invalid OTP', 'Check the code and try again', 'error')
          const sub = subjects[Math.floor(Math.random() * subjects.length)]
          markAttendance(sub.id, true)
          onClose(); after?.()
          toast('Check-in successful', `Marked present for ${sub.code} at ${new Date().toLocaleTimeString()}`, 'success')
        }}><ShieldCheck size={16} /> Verify & Mark Present</Btn>
      </>
    }>
      <div className="text-center py-4">
        <div className="font-semibold">Smart Class Check-In</div>
        <div className="text-xs text-slate-500 mb-3">Scan or enter the 4-digit faculty OTP to auto-mark attendance</div>
        <div className="font-mono font-bold text-[34px] tracking-widest">{otp}</div>
        <div className="text-xs text-slate-500">Live OTP · Valid for 120 seconds</div>
      </div>
      <Field label="Enter OTP to confirm">
        <input value={val} onChange={(e) => setVal(e.target.value)} maxLength={4} placeholder="e.g. 1234" className={`${inputCls} font-mono tracking-widest`} />
      </Field>
    </Modal>
  )
}

export default function Attendance({ checkInSignal }) {
  const subjects = useStore((s) => s.subjects)
  const attendanceLog = useStore((s) => s.attendanceLog)
  const markAttendance = useStore((s) => s.markAttendance)
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState(null)
  const [planBusy, setPlanBusy] = useState(false)

  // open from palette
  useMemo(() => { if (checkInSignal) setOpen(true) }, [checkInSignal])

  const runStrategy = async () => {
    setPlanBusy(true)
    try { setPlan(await attendanceStrategy(subjects)) }
    catch (e) { toast('AI strategist failed', String(e.message || e).slice(0, 120), 'error') }
    finally { setPlanBusy(false) }
  }

  const advice = (pct) => {
    if (pct >= 80) return 'Safe to skip next 2 classes'
    if (pct >= 75) return 'Tight margin — attend next 2 classes'
    return `Must attend next ${Math.max(1, 3 - Math.floor(pct / 25))} classes to hit 75%`
  }

  return (
    <div className="anim-fadeUp">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[22px] font-bold tracking-tight">Smart Attendance & Margin Calculator</div>
          <div className="text-slate-400 text-[13px] mt-1">Live tracking with margin advice & smart QR check-in</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasGroq() && <Btn variant="ghost" disabled={planBusy} onClick={runStrategy}>{planBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI Attendance Strategist</Btn>}
          <Btn variant="primary" onClick={() => setOpen(true)}><QrCode size={16} /> Simulate Smart Class Check-In</Btn>
        </div>
      </div>
      {plan && (
        <Card className="mb-4">
          <CardTitle icon={<Sparkles size={17} />} right={<Badge tone={plan.risk === 'high' ? 'rose' : plan.risk === 'medium' ? 'amber' : 'emerald'}>Risk: {plan.risk}</Badge>}>AI Attendance Strategy</CardTitle>
          <div className="text-[13px] mb-3">{plan.overall}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {plan.perSubject?.map((p) => (
              <div key={p.code} className="p-2.5 rounded-[11px] bg-violet-400/5 border border-violet-400/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[13px]">{p.code}</span>
                  <span className="text-[11px] text-slate-400">skip {Math.max(0, p.canSkip)}</span>
                </div>
                <div className="text-[11.5px] text-slate-300 mt-0.5">{p.verdict}</div>
                <div className="text-[11px] text-emerald-300 mt-0.5">→ {p.action}</div>
              </div>
            ))}
          </div>
          {plan.tip && <div className="flex items-start gap-2 text-[12px] text-slate-400"><AlertTriangle size={14} className="text-amber-300 mt-0.5 shrink-0" />{plan.tip}</div>}
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjects.map((sub) => {
          const pct = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100)
          const c = attendanceColor(pct)
          return (
            <Card key={sub.id}>
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div>
                  <div className="text-[14.5px] font-semibold flex items-center gap-2"><CalendarCheck size={17} className="text-indigo-300" />{sub.code} · {sub.name}</div>
                  <div className="text-xs text-slate-500">Faculty: {sub.faculty}</div>
                </div>
                <div className="flex flex-col items-center gap-2"><Ring pct={pct} tone={c} /><Badge tone={c}>{pct}%</Badge></div>
              </div>
              <div className="flex items-center justify-between py-3 border-y border-white/10 text-xs text-slate-500">
                <span>{sub.attended} / {sub.total} classes attended</span>
                <span className="font-mono">{sub.total - sub.attended} missed</span>
              </div>
              <div className="my-2.5"><Progress value={pct} tone={c} /></div>
              <Badge tone={pct < 75 ? 'rose' : 'indigo'} className="mb-3">{advice(pct)}</Badge>
              <div className="flex gap-2 flex-wrap">
                <Btn variant="emerald" onClick={() => { markAttendance(sub.id, true); toast('Present marked', `${sub.code} attendance updated`, 'success') }}><Check size={16} /> + Present</Btn>
                <Btn variant="rose" onClick={() => { markAttendance(sub.id, false); toast('Absent marked', `${sub.code} updated`, 'warn') }}><X size={16} /> + Absent</Btn>
              </div>
            </Card>
          )
        })}
      </div>
      <Card className="mt-4">
        <CardTitle icon={<History size={17} />} right={<Badge tone="muted">{attendanceLog.length}</Badge>}>Recent check-ins & activity</CardTitle>
        {attendanceLog.length === 0 && <div className="text-center py-4 text-slate-500 text-[13px]">No activity yet — mark attendance or use Smart Check-In.</div>}
        <div className="flex flex-col max-h-[220px] overflow-y-auto">
          {attendanceLog.slice(0, 12).map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-0">
              <div className="flex-1">
                <div className="font-semibold text-[13px] font-mono">{l.code}</div>
                <div className="text-[11px] text-slate-500">{new Date(l.at).toLocaleString()}</div>
              </div>
              <Badge tone={l.present ? 'emerald' : 'rose'}>{l.present ? 'Present' : 'Absent'}</Badge>
            </div>
          ))}
        </div>
      </Card>
      {open && <CheckInModal onClose={() => setOpen(false)} />}
    </div>
  )
}
