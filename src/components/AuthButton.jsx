import { useState } from 'react'
import { LogIn, LogOut, Mail, Globe, UserPlus } from 'lucide-react'
import { hasFirebase, signInGoogle, signInEmail, signUpEmail, logOut } from '../lib/firebase'
import { toast } from '../lib/store'
import { Btn, Modal, Field, inputCls } from './ui'

export default function AuthButton({ user }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('in') // in | up
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!hasFirebase) {
    return (
      <div className="p-3 rounded-[11px] bg-amber-400/10 border border-amber-400/25 text-[11.5px] text-amber-300">
        Firebase not configured — add VITE_FB_* keys to .env to enable login.
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2.5 p-1.5">
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="w-[38px] h-[38px] rounded-full object-cover" />
          : <div className="w-[38px] h-[38px] rounded-full grid place-items-center font-bold text-[13px] bg-gradient-to-br from-violet-400 to-indigo-400 text-white">{(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}</div>}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] truncate">{user.displayName || user.email?.split('@')[0]}</div>
          <div className="text-[11px] text-emerald-300 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Signed in</div>
        </div>
        <button onClick={async () => { await logOut(); toast('Signed out', 'See you on campus', 'info') }} className="w-[32px] h-[32px] grid place-items-center rounded-[9px] border border-white/10 bg-white/5 text-slate-400 hover:text-white cursor-pointer" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    )
  }

  const go = async (fn) => {
    setBusy(true); setErr('')
    try { await fn(); setOpen(false); toast('Welcome to NexusCampus', 'Signed in successfully', 'success') }
    catch (e) {
      const msg = e.code === 'auth/invalid-credential' ? 'Wrong email or password.' :
        e.code === 'auth/email-already-in-use' ? 'Email already registered — sign in instead.' :
        e.code === 'auth/weak-password' ? 'Password must be 6+ characters.' :
        e.code === 'auth/unauthorized-domain' ? 'Domain not authorized — add it in Firebase Auth → Settings → Authorized domains.' :
        (e.message || 'Sign-in failed.')
      setErr(msg)
    }
    finally { setBusy(false) }
  }

  return (
    <>
      <Btn variant="primary" className="w-full" onClick={() => { setOpen(true); setErr('') }}><LogIn size={16} /> Sign in / Join</Btn>
      {open && (
        <Modal title={mode === 'in' ? 'Welcome back' : 'Join NexusCampus'} icon={<LogIn size={19} />} onClose={() => setOpen(false)}>
          <Btn className="w-full mb-3" disabled={busy} onClick={() => go(signInGoogle)}><Globe size={16} /> Continue with Google</Btn>
          <div className="flex items-center gap-3 my-3 text-[11px] text-slate-500"><span className="flex-1 h-px bg-white/10" /> or with email <span className="flex-1 h-px bg-white/10" /></div>
          <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" type="email" className={inputCls} /></Field>
          <Field label="Password (6+ chars)"><input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" type="password" className={inputCls} /></Field>
          {err && <div className="p-2.5 rounded-[10px] bg-rose-400/10 border border-rose-400/25 text-rose-300 text-xs mb-3">{err}</div>}
          {mode === 'in' ? (
            <>
              <Btn variant="primary" className="w-full" disabled={busy || !email || !pw} onClick={() => go(() => signInEmail(email, pw))}><Mail size={16} /> Sign in with Email</Btn>
              <button onClick={() => setMode('up')} className="w-full text-center text-xs text-slate-400 hover:text-white mt-3 cursor-pointer">New here? Create an account</button>
            </>
          ) : (
            <>
              <Btn variant="primary" className="w-full" disabled={busy || !email || !pw} onClick={() => go(() => signUpEmail(email, pw))}><UserPlus size={16} /> Create account</Btn>
              <button onClick={() => setMode('in')} className="w-full text-center text-xs text-slate-400 hover:text-white mt-3 cursor-pointer">Have an account? Sign in</button>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
