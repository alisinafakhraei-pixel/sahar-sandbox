import { NextRequest, after } from "next/server"

import { buildSystemPrompt } from "@/lib/system-prompt"
import { demoReply } from "@/lib/demo-reply"
import { logConversation } from "@/lib/chat-log"
import { parseCta } from "@/lib/parse-cta"
import { searchHelpCenter, formatHelpResults } from "@/lib/intercom-search"
import { metaMarker } from "@/lib/parse-meta"

export const runtime = "nodejs"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

function validate(
  body: unknown
): { turns: Turn[]; conversationId: string | null } | null {
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
  if (turns.at(-1)?.role !== "user") return null

  // Optional: only used for the Supabase log. A missing or malformed id just
  // means this turn won't be logged, it never fails the chat request itself.
  const rawId = (body as { conversationId?: unknown }).conversationId
  const conversationId =
    typeof rawId === "string" && UUID_RE.test(rawId) ? rawId : null

  return { turns, conversationId }
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

  let parsed: { turns: Turn[]; conversationId: string | null } | null
  try {
    parsed = validate(await req.json())
  } catch {
    parsed = null
  }
  if (!parsed) return new Response("Bad request.", { status: 400 })
  const { turns, conversationId } = parsed

  function logIfPossible(replyText: string, model: string) {
    if (!conversationId) return
    const { text, cta } = parseCta(replyText)
    after(() =>
      logConversation({
        conversationId,
        turns: [...turns, { role: "model", text }],
        cta,
        model,
        geminiApiKey: process.env.GEMINI_API_KEY,
      })
    )
  }

  const apiKey = process.env.GEMINI_API_KEY

  // No key configured: serve the scripted stand-in so the flow stays
  // reviewable. The client surfaces a banner whenever this header is set.
  if (!apiKey) {
    const isFollowUp = turns.filter((t) => t.role === "user").length > 1
    const reply = demoReply(turns.at(-1)!.text, isFollowUp)
    logIfPossible(reply, "demo")
    return new Response(textStream(chunk(reply)), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-formaloo-mode": "demo",
        "x-formaloo-reason": "no-api-key",
      },
    })
  }

  // Everything past this point (help-center search, the Gemini call, and the
  // demo fallback if that call fails) lives inside a single stream, so the
  // search can be reported to the client in real time as it happens rather
  // than silently finishing before the response even opens. The outer HTTP
  // headers can no longer promise "live" vs "demo" up front the way the
  // no-apiKey branch above still does (that one is decided synchronously,
  // before any of this), so a fallback here is signalled with a `<<<META
  // {"type":"mode","mode":"demo",...}>>>` marker in the body instead — the
  // client checks for that in addition to the header, never instead of it.
  const isFollowUp = turns.filter((t) => t.role === "user").length > 1
  const intercomToken = process.env.INTERCOM_ACCESS_TOKEN
  const latestUserText = turns.at(-1)!.text

  let fullText = ""
  let loggedModel = "demo"
  let resolveStreamDone: () => void
  const streamDone = new Promise<void>((resolve) => {
    resolveStreamDone = resolve
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const emit = (text: string) => controller.enqueue(encoder.encode(text))

      async function fallbackToDemo(reason: string) {
        loggedModel = "demo"
        emit(metaMarker({ type: "mode", mode: "demo", reason }))
        const reply = demoReply(latestUserText, isFollowUp)
        fullText = reply
        for (const piece of chunk(reply)) {
          emit(piece)
          await new Promise((r) => setTimeout(r, 14))
        }
      }

      try {
        // Live, real-time search against the actual Intercom help center —
        // never RAG, never re-indexed, so it can never go stale the way a
        // pre-embedded copy would. Gracefully empty if the token isn't
        // configured or the search itself fails; the model is told exactly
        // what to do with an empty result (fall back to normal routing).
        let helpArticles: Awaited<ReturnType<typeof searchHelpCenter>> = []
        if (intercomToken) {
          emit(metaMarker({ type: "search", phase: "start", query: latestUserText }))
          helpArticles = await searchHelpCenter(latestUserText, intercomToken)
          emit(
            metaMarker({
              type: "search",
              phase: "done",
              count: helpArticles.length,
              // Title + URL only — the description isn't needed client-side,
              // and keeping the marker small matters since it's sent before
              // any visible reply text.
              articles: helpArticles.map((a) => ({ title: a.title, url: a.url })),
            })
          )
        }

        const systemInstructionText = buildSystemPrompt(
          formatHelpResults(helpArticles)
        )

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
                systemInstruction: { parts: [{ text: systemInstructionText }] },
                contents: turns.map((t) => ({
                  role: t.role,
                  parts: [{ text: t.text }],
                })),
                generationConfig: {
                  temperature: 0.6,
                  maxOutputTokens: 900,
                  // The 3.x flash models "think" by default, spending part of
                  // maxOutputTokens on hidden reasoning before any visible
                  // text, which was silently truncating replies. This
                  // assistant only needs a short, direct answer, so thinking
                  // is switched off.
                  thinkingConfig: { thinkingBudget: 0 },
                },
              }),
            }
          )
        } catch {
          await fallbackToDemo("network")
          return
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "")
          console.error(`[chat] Gemini ${upstream.status}: ${detail.slice(0, 400)}`)
          await fallbackToDemo(`upstream-${upstream.status}`)
          return
        }

        loggedModel = MODEL
        emit(metaMarker({ type: "mode", mode: "live" }))

        // Unwrap Gemini's SSE into plain text, accumulating the full reply
        // so it can be logged once streaming finishes.
        const reader = upstream.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

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
                  fullText += part.text
                  emit(part.text)
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
        resolveStreamDone()
      }
    },
  })

  if (conversationId) {
    after(async () => {
      await streamDone
      if (!fullText) return // Aborted before anything came back — nothing to log.
      const { text, cta } = parseCta(fullText)
      await logConversation({
        conversationId,
        turns: [...turns, { role: "model", text }],
        cta,
        model: loggedModel,
        geminiApiKey: apiKey,
      })
    })
  }

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
