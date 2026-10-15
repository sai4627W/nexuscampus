import { initializeApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
}

export const hasFirebase = !!cfg.apiKey

let auth = null, db = null
if (hasFirebase) {
  const app = initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { auth, db }

const googleProvider = new GoogleAuthProvider()

export async function saveUserDoc(u) {
  if (!db || !u) return
  await setDoc(doc(db, 'users', u.uid), {
    name: u.displayName || u.email?.split('@')[0] || 'Campus User',
    email: u.email, photo: u.photoURL || null, lastLogin: serverTimestamp(),
  }, { merge: true })
}

export async function signInGoogle() {
  const r = await signInWithPopup(auth, googleProvider)
  await saveUserDoc(r.user)
  return r.user
}

export async function signInEmail(email, password) {
  const r = await signInWithEmailAndPassword(auth, email, password)
  await saveUserDoc(r.user)
  return r.user
}

export async function signUpEmail(email, password) {
  const r = await createUserWithEmailAndPassword(auth, email, password)
  await saveUserDoc(r.user)
  return r.user
}

export const logOut = () => signOut(auth)
export const watchAuth = (cb) => (auth ? onAuthStateChanged(auth, cb) : () => {})
