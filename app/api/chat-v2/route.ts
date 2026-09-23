import { NextRequest } from "next/server"

import { VERTEX_AGENT_INSTRUCTION } from "@/lib/vertex-agent-prompt"

/**
 * V2 comparison backend: reproduces Alisina's Google Agent Builder (ADK)
 * agent using plain Vertex AI generateContent, since we have his system
 * instruction and a Vertex API key but not a deployed Agent Engine resource
 * ID (that needs OAuth + a resource name, a bare API key can't reach it).
 * The ADK agent's two sub-agent tools (Google Search, URL Context) are
 * reproduced here as Gemini's native `google_search` and `url_context`
 * tools on a single gemini-3.5-flash call — not a literal invocation of the
 * deployed multi-agent graph, an equivalent one.
 *
 * Deliberately NOT connected to Supabase and NOT sharing lib/system-prompt.ts
 * — this route exists to show his agent's own instruction's behavior
 * unmodified, side by side with the V1 build.
 */

export const runtime = "nodejs"
// Grounded (search) replies measured ~50s in testing. 60 is the Hobby-plan
// ceiling — this is close enough to it that occasional 504s on a slow
// search are a real possibility, not just theoretical.
export const maxDuration = 60

const MODEL = "gemini-3.5-flash"
const PROJECT = "663193170040"
const LOCATION = "global"
const ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`

const MAX_TURNS = 12
const MAX_CHARS = 2000

// Separate limiter from /api/chat's — this route is far slower per request,
// so it needs a tighter cap regardless of what v1 allows.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 6
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_REQUESTS
}

type Turn = { role: "user" | "model"; text: string }

function validate(body: unknown): Turn[] | null {
  if (typeof body !== "object" || body === null) return null
  const messages = (body as { messages?: unknown }).messages
  if (!Array.isArray(messages) || messages.length === 0) return null
  if (messages.length > MAX_TURNS) return null

  const turns: Turn[] = []
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return null
    const { role, text } = m as { role?: unknown; text?: unknown }
    if (role !== "user" && role !== "model") return null
    if (typeof text !== "string" || text.length === 0) return null
    turns.push({ role, text: text.slice(0, MAX_CHARS) })
  }
  return turns.at(-1)?.role === "user" ? turns : null
}

function chunk(text: string, size = 3) {
  const out: string[] = []
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
  return out
}

// Vertex's response here arrives all at once (grounding has to finish before
// any text exists), so it's delivered to the client as a fake stream rather
// than left as one big blocking response — reuses the same reader loop the
// UI already has for v1 and demo mode.
function textStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      for (const piece of chunks) {
        controller.enqueue(encoder.encode(piece))
        await new Promise((r) => setTimeout(r, 10))
      }
      controller.close()
    },
  })
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"

  if (rateLimited(ip)) {
    return new Response(
      "This test backend is slow and rate-limited. Give it a minute.",
      { status: 429 }
    )
  }

  let turns: Turn[] | null
  try {
    turns = validate(await req.json())
  } catch {
    turns = null
  }
  if (!turns) return new Response("Bad request.", { status: 400 })

  const apiKey = process.env.VERTEX_API_KEY
  if (!apiKey) {
    return new Response(
      "V2 isn't wired up yet — VERTEX_API_KEY is missing.",
      {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-formaloo-mode": "unconfigured",
        },
      }
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: VERTEX_AGENT_INSTRUCTION }] },
        contents: turns.map((t) => ({
          role: t.role,
          parts: [{ text: t.text }],
        })),
        tools: [{ google_search: {} }, { url_context: {} }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048,
          // Confirmed by direct testing: gemini-3.5-flash spends part of its
          // output budget on hidden "thinking" even with search tools
          // attached, which was hitting MAX_TOKENS mid-answer (verified: a
          // real reply got cut off mid-sentence at a stray citation marker).
          // Disabling it is supported here (unlike gemini-flash-lite-latest,
          // which 400s if thinkingConfig is present at all).
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch (error) {
    console.error("[chat-v2] fetch failed", error)
    return new Response("Could not reach the Vertex agent.", { status: 502 })
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "")
    console.error(`[chat-v2] Vertex ${upstream.status}: ${detail.slice(0, 500)}`)
    return new Response(
      "The Vertex agent errored on this one. Try rephrasing, or check the logs.",
      {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-formaloo-mode": "error",
          "x-formaloo-reason": `vertex-${upstream.status}`,
        },
      }
    )
  }

  let text = ""
  try {
    const data = await upstream.json()
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    text = parts
      .filter((p: { text?: string }) => typeof p.text === "string")
      .map((p: { text: string }) => p.text)
      .join("")
  } catch (error) {
    console.error("[chat-v2] parse failed", error)
  }

  if (!text) {
    text =
      "The Vertex agent came back with no text for this one. Try rephrasing."
  }

  return new Response(textStream(chunk(text)), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-formaloo-mode": "vertex-agent",
      "cache-control": "no-store",
    },
  })
}
