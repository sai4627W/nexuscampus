// Real-world AI layer powered by Groq (OpenAI-compatible endpoint).
// Key comes from .env (VITE_GROQ_API_KEY) — never hardcoded, never committed.

const KEY = import.meta.env.VITE_GROQ_API_KEY
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b'

export const hasGroq = () => !!KEY

async function callGroq({ system, user, json = false, maxTokens = 800, temperature = 0.6 }) {
  if (!KEY) throw new Error('Missing VITE_GROQ_API_KEY')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Groq ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

function extractJson(text) {
  try { return JSON.parse(text) } catch {}
  const m = text.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch {} }
  return null
}

// ---------- 1. AI Concierge: reply + structured action ----------
export async function conciergeReply(userText, ctx) {
  const placeList = ctx.nodes.map((n) => n.name).join(', ')
  const today = ctx.timetable.map((t) => `${t.time} ${t.subject} @${t.room}`).join('; ') || 'no classes'
  const menu = ctx.menu.map((m) => `${m.name} (Rs.${m.price}, ${m.category})`).join(', ')
  const system = `You are NexusCampus Concierge, a helpful campus assistant. Campus places: ${placeList}.
Today's timetable: ${today}. Wallet: Rs.${ctx.wallet}. Cafeteria menu: ${menu}.
Crowd: ${Object.entries(ctx.crowd).map(([k, v]) => `${k}=${v}`).join(', ')}.
Reply concisely (1-2 sentences). Also decide ONE action as JSON: {"reply":"...","action":{"type":"route","from":"...","to":"..."} | {"type":"goto","tab":"map|attendance|cafeteria|facilities|maintenance"} | {"type":"order","item":"..."} | {"type":"checkin"} | {"type":"topup"} | {"type":"none"}}.
Route "from" and "to" must be place names from the list above. For next-class questions use action route with best-guess from/to. Output ONLY the JSON object.`
  const raw = await callGroq({ system, user: userText, json: true, maxTokens: 500, temperature: 0.4 })
  const parsed = extractJson(raw)
  if (!parsed?.reply) throw new Error('Bad AI response')
  return parsed
}

// ---------- 2. AI Route Narrator ----------
export async function narrateRoute(fromName, toName, distance, mins, steps) {
  const stepText = steps.map((s, i) => `${i + 1}. ${s.text} (${s.meta})`).join('\n')
  const system = 'You are a friendly campus walking guide. Narrate the walk in 3-5 short sentences, mention landmarks from step names, add one practical tip (shade, crowd, shortcut). Plain text, no JSON, no markdown headers.'
  return callGroq({
    system,
    user: `Walk from ${fromName} to ${toName}. Distance ${distance}m, ~${mins} min.\nSteps:\n${stepText}`,
    maxTokens: 400,
  })
}

// ---------- 3. AI Food Recommender ----------
export async function recommendFood(menu, wallet, hour) {
  const daypart = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 19 ? 'snacks' : 'dinner/snacks'
  const system = `You are a cafeteria recommender. Pick exactly 2 items as JSON: {"picks":[{"name":"...","reason":"..."}],"note":"..."}. Consider time of day and wallet. Output ONLY JSON.`
  const raw = await callGroq({
    system,
    user: `Time: ${hour}:00 (${daypart}). Wallet Rs.${wallet}. Menu: ${menu.map((m) => `${m.name} Rs.${m.price} [${m.category}, prep ${m.prep}m]`).join('; ')}`,
    json: true, maxTokens: 400, temperature: 0.7,
  })
  const parsed = extractJson(raw)
  if (!parsed?.picks) throw new Error('Bad AI response')
  return parsed
}

// ---------- 4. AI Maintenance Triage ----------
const DEPTS = ['Electrical', 'IT Support', 'Housekeeping', 'Lost & Found']
const PRIS = ['Urgent', 'Medium', 'Low']
export async function triageWithAI(title, location) {
  const system = `Classify campus maintenance issues as JSON {"dept":"...","priority":"...","reason":"..."}. dept must be one of: ${DEPTS.join(', ')}. priority one of: ${PRIS.join(', ')}. Electrical=power/lights/AC/plumbing-electrical; IT Support=wifi/projector/computers; Housekeeping=cleaning/washroom/general repair; Lost & Found=lost/found items. Safety issues (AC leak, power fault) are Urgent. Output ONLY JSON.`
  const raw = await callGroq({ system, user: `Issue: ${title}\nLocation: ${location}`, json: true, maxTokens: 250, temperature: 0.2 })
  const parsed = extractJson(raw)
  if (!parsed || !DEPTS.includes(parsed.dept) || !PRIS.includes(parsed.priority)) throw new Error('Bad AI response')
  return parsed
}
