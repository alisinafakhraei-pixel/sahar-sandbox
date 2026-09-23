import { getSupabaseAdmin } from "./supabase-admin"
import type { Cta } from "./parse-cta"

export type LogTurn = { role: "user" | "model"; text: string }

export type Outcome = "signup_prompt" | "demo_cta" | "qualifying" | "unresolved"

const CLASSIFY_MODEL = "gemini-flash-lite-latest"
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"
const MAX_TRANSCRIPT_CHARS = 6000

/**
 * Deterministic outcome, derived from the CTA the conversation actually
 * reached rather than re-asked of the model — we already know this
 * structurally from the sentinel the assistant just emitted (or didn't).
 */
function determineOutcome(cta: Cta | null, userTurnCount: number): Outcome {
  if (cta?.action === "signup") return "signup_prompt"
  if (cta?.action === "demo") return "demo_cta"
  if (userTurnCount >= 2) return "qualifying"
  return "unresolved"
}

function buildTranscriptText(turns: LogTurn[]): string {
  return turns
    .map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.text}`)
    .join("\n")
}

/**
 * One cheap, non-streaming Gemini call that reads the transcript and returns
 * a short internal-analytics label. Best-effort: any failure here (bad JSON,
 * network error, no key) falls back to nulls rather than breaking the log
 * write, this is a "nice to have" column, not the record of what was said.
 */
async function classify(
  transcript: string,
  apiKey: string
): Promise<{ topic: string | null; description: string | null }> {
  const prompt = `
You are labeling a homepage chat log for internal analytics. This is never
shown to the visitor. Read the conversation below and respond with ONLY a
JSON object, no markdown fences, no prose, matching exactly this shape:
{"topic": string, "description": string}

"topic": 3-6 words naming what the visitor wants, for a sortable internal
list (e.g. "Client portal with per-project access", "Event registration
with waitlist").
"description": one plain sentence expanding on it, written for the internal
team reviewing logs, not the visitor.

CONVERSATION:
${transcript}
`.trim()

  try {
    const res = await fetch(`${ENDPOINT}/${CLASSIFY_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // Unlike the main flash model, gemini-flash-lite-latest 400s if
        // thinkingConfig is present at all (not just budget: 0), so it's
        // omitted here rather than reused from the main chat route.
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
    })

    if (!res.ok) {
      console.error(`[chat-log] classify ${res.status}: ${await res.text()}`)
      return { topic: null, description: null }
    }

    const data = await res.json()
    const raw: string | undefined =
      data?.candidates?.[0]?.content?.parts?.find(
        (p: { text?: string }) => typeof p.text === "string"
      )?.text

    if (!raw) return { topic: null, description: null }

    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim()

    const parsed = JSON.parse(cleaned)
    const topic = typeof parsed.topic === "string" ? parsed.topic.slice(0, 200) : null
    const description =
      typeof parsed.description === "string" ? parsed.description.slice(0, 500) : null

    return { topic, description }
  } catch (error) {
    console.error("[chat-log] classify failed", error)
    return { topic: null, description: null }
  }
}

/**
 * Upserts the conversation's log row. Fire-and-forget from the API route via
 * `after()` — this must never throw in a way that affects the user-visible
 * reply, so every failure mode here is caught and logged, not rethrown.
 */
export async function logConversation({
  conversationId,
  turns,
  cta,
  model,
  geminiApiKey,
  version = "v1",
}: {
  conversationId: string
  turns: LogTurn[]
  cta: Cta | null
  model: string
  geminiApiKey: string | undefined
  version?: "v1" | "v2"
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return // Not configured locally — silent no-op, same as demo mode.

  try {
    const userTurnCount = turns.filter((t) => t.role === "user").length
    const outcome = determineOutcome(cta, userTurnCount)
    const transcriptText = buildTranscriptText(turns).slice(0, MAX_TRANSCRIPT_CHARS)

    const { topic, description } = geminiApiKey
      ? await classify(transcriptText, geminiApiKey)
      : { topic: null, description: null }

    const { error } = await supabase.from("chat_logs").upsert(
      {
        conversation_id: conversationId,
        chat_log: turns,
        message_count: turns.length,
        transcript_text: transcriptText,
        topic,
        description,
        outcome,
        cta_href: cta?.href ?? null,
        model,
        version,
      },
      { onConflict: "conversation_id" }
    )

    if (error) console.error("[chat-log] upsert failed", error)
  } catch (error) {
    console.error("[chat-log] logConversation failed", error)
  }
}
