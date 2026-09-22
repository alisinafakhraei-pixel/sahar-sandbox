import { NextRequest } from "next/server"

import { SYSTEM_PROMPT } from "@/lib/system-prompt"
import { demoReply } from "@/lib/demo-reply"

export const runtime = "nodejs"

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest"
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

const MAX_TURNS = 12
const MAX_CHARS = 2000

// Per-IP sliding window. In-memory, so it resets on redeploy and does not span
// instances. Fine for a prototype, but this must become Redis/Upstash before
// exposed on the real formaloo.com.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 12
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

function textStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
        await new Promise((r) => setTimeout(r, 14))
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
    return new Response("Too many messages. Give it a minute.", {
      status: 429,
    })
  }

  let turns: Turn[] | null
  try {
    turns = validate(await req.json())
  } catch {
    turns = null
  }
  if (!turns) return new Response("Bad request.", { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY

  // No key configured: serve the scripted stand-in so the flow stays
  // reviewable. The client surfaces a banner whenever this header is set.
  if (!apiKey) {
    const isFollowUp = turns.filter((t) => t.role === "user").length > 1
    const reply = demoReply(turns.at(-1)!.text, isFollowUp)
    return new Response(textStream(chunk(reply)), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-formaloo-mode": "demo",
        "x-formaloo-reason": "no-api-key",
      },
    })
  }

  let upstream: Response
  try {
    upstream = await fetch(
      `${ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: turns.map((t) => ({
            role: t.role,
            parts: [{ text: t.text }],
          })),
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 900,
            // The 3.x flash models "think" by default, spending part of
            // maxOutputTokens on hidden reasoning before any visible text,
            // which was silently truncating replies. This assistant only
            // needs a short, direct answer, so thinking is switched off.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )
  } catch {
    return new Response("Could not reach the model.", { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "")
    console.error(
      `[chat] Gemini ${upstream.status}: ${detail.slice(0, 400)}`
    )
    // Fall back rather than showing a dead box to a homepage visitor.
    const isFollowUp = turns.filter((t) => t.role === "user").length > 1
    const reply = demoReply(turns.at(-1)!.text, isFollowUp)
    return new Response(textStream(chunk(reply)), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-formaloo-mode": "demo",
        "x-formaloo-reason": `upstream-${upstream.status}`,
      },
    })
  }

  // Unwrap Gemini's SSE into a plain text stream for the client.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      let buffer = ""

      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data:")) continue
            const payload = line.slice(5).trim()
            if (!payload || payload === "[DONE]") continue
            try {
              const json = JSON.parse(payload)
              const parts =
                json?.candidates?.[0]?.content?.parts ?? ([] as unknown[])
              for (const part of parts) {
                if (typeof part?.text === "string" && part.text) {
                  controller.enqueue(encoder.encode(part.text))
                }
              }
            } catch {
              // Partial JSON across chunk boundaries; the next read completes it.
            }
          }
        }
      } catch (error) {
        console.error("[chat] stream aborted", error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-formaloo-mode": "live",
      "cache-control": "no-store",
    },
  })
}
