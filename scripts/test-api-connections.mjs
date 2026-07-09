/**
 * test-api-connections.mjs
 *
 * Smoke-tests every external service this app talks to:
 *   - Firebase Admin (Firestore + Auth)
 *   - Google Gemini (opportunity content moderation)
 *   - Resend (transactional email)
 *   - Google Maps (Geocoding API, used by NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 *   - Nominatim / OpenStreetMap (address validation, no key required)
 *
 * Does not print any secret values. Run:
 *   node scripts/test-api-connections.mjs
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// ─── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "../.env.local")
try {
  const envFile = readFileSync(envPath, "utf8")
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
    if (!(key in process.env)) process.env[key] = val
  }
} catch {
  console.error("Could not read .env.local — make sure it exists.")
  process.exit(1)
}

const results = []

async function check(name, fn) {
  const start = Date.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail, ms: Date.now() - start })
  } catch (err) {
    results.push({ name, ok: false, detail: err?.message ?? String(err), ms: Date.now() - start })
  }
}

// ─── Firebase Admin (Firestore + Auth) ────────────────────────────────────────
await check("Firebase Admin — Firestore", async () => {
  const { initializeApp, cert, getApps } = await import("firebase-admin/app")
  const { getFirestore } = await import("firebase-admin/firestore")

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set")

  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(key)) })
  }
  const db = getFirestore()
  const snap = await db.collection("opportunities").limit(1).get()
  return `connected, ${snap.size} doc(s) read from "opportunities"`
})

await check("Firebase Admin — Auth", async () => {
  const { getApps } = await import("firebase-admin/app")
  const { getAuth } = await import("firebase-admin/auth")
  if (getApps().length === 0) throw new Error("Admin app not initialized (Firestore check must run first)")
  const list = await getAuth().listUsers(1)
  return `connected, listUsers returned ${list.users.length} user(s)`
})

// ─── Gemini (content moderation) ──────────────────────────────────────────────
await check("Gemini API (validate-opportunity)", async () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY not set")
  const { GoogleGenAI } = await import("@google/genai")
  const genai = new GoogleGenAI({ apiKey })
  const response = await Promise.race([
    genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: 'Reply with exactly the word "pong".',
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
  ])
  const text = response.text?.trim()
  if (!text) throw new Error("empty response from Gemini")
  return `connected, model replied: "${text}"`
})

// ─── Resend (email) ────────────────────────────────────────────────────────────
await check("Resend API", async () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY not set")
  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)
  // Lightweight read-only call — does not send an email.
  const { data, error } = await resend.domains.list()
  if (error) {
    // Send-only scoped keys can't list domains but are still valid for the
    // contact route's actual use (resend.emails.send). Treat as authenticated.
    if (/restricted/i.test(error.message ?? "")) {
      return `authenticated (key is send-only scoped, as expected): ${error.message}`
    }
    throw new Error(error.message ?? "unknown Resend error")
  }
  return `connected, ${data?.data?.length ?? 0} domain(s) on account`
})

// ─── Google Maps Geocoding (validates NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) ────────
await check("Google Maps API key (Geocoding)", async () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set")
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Toronto,ON&key=${apiKey}`
  const res = await fetch(url)
  const json = await res.json()
  if (json.status !== "OK") throw new Error(`status=${json.status} ${json.error_message ?? ""}`.trim())
  return `connected, status=OK (${json.results.length} result(s))`
})

// ─── Nominatim / OpenStreetMap (validate-location route) ──────────────────────
await check("Nominatim (validate-location)", async () => {
  const url = "https://nominatim.openstreetmap.org/search?q=Toronto&format=json&limit=1&countrycodes=ca"
  const res = await Promise.race([
    fetch(url, { headers: { "User-Agent": "Voluntrack/1.0 (contact@voluntrack.ca)" } }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
  ])
  const json = await res.json()
  if (!Array.isArray(json) || json.length === 0) throw new Error("no results returned")
  return `connected, ${json.length} result(s)`
})

// ─── Report ─────────────────────────────────────────────────────────────────────
console.log("\n=== API Connection Test Results ===\n")
let allOk = true
for (const r of results) {
  const icon = r.ok ? "✓" : "✗"
  console.log(`${icon} ${r.name} (${r.ms}ms)`)
  console.log(`   ${r.detail}`)
  if (!r.ok) allOk = false
}
console.log("\n" + (allOk ? "All connections OK." : "Some connections FAILED — see above."))
process.exit(allOk ? 0 : 1)
