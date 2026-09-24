import { GEMINI_API_KEY, GEMINI_MODEL } from "./config.js"
import { CTA_OPEN, CTA_CLOSE, buildSystemPrompt } from "./prompt.js"

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`
const MAX_TURNS = 12
const MAX_CHARS = 2000

const messagesEl = document.getElementById("messages")
const formEl = document.getElementById("composer")
const inputEl = document.getElementById("input")
const sendBtn = document.getElementById("send")

/** @type {{role: "user" | "model", text: string}[]} */
const turns = []

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight
}

function renderUserBubble(text) {
  const bubble = el("div", "bubble user", text)
  messagesEl.appendChild(bubble)
  scrollToBottom()
}

/** Returns handles to update the bubble as tokens stream in. */
function renderModelBubble() {
  const bubble = el("div", "bubble model")
  const textNode = el("span", "bubble-text")
  bubble.appendChild(textNode)
  messagesEl.appendChild(bubble)
  scrollToBottom()
  return {
    setText(text) {
      textNode.textContent = text
      scrollToBottom()
    },
    addCta(cta) {
      const link = el("a", "cta", cta.label)
      link.href = cta.href
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      bubble.appendChild(link)
      scrollToBottom()
    },
  }
}

// Same rules as lib/parse-cta.ts: only ever link back to Formaloo, and
// hide a still-arriving "<<<CTA {…" fragment mid-stream.
const ALLOWED_ACTIONS = ["signup", "demo", "template", "pricing", "help"]

function isCta(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    (value.path === "simple" || value.path === "complex") &&
    typeof value.action === "string" &&
    ALLOWED_ACTIONS.includes(value.action) &&
    typeof value.label === "string" &&
    value.label.length > 0 &&
    typeof value.href === "string" &&
    /^https:\/\/([a-z0-9-]+\.)*formaloo\.(com|me)\//.test(value.href)
  )
}

function parseCta(raw) {
  const open = raw.indexOf(CTA_OPEN)

  if (open === -1) {
    const trailing = raw.match(/<{1,3}C?T?A?$/)
    const text = trailing ? raw.slice(0, raw.length - trailing[0].length) : raw
    return { text: text.trimEnd(), cta: null }
  }

  const text = raw.slice(0, open).trimEnd()
  const close = raw.indexOf(CTA_CLOSE, open)
  if (close === -1) return { text, cta: null }

  const payload = raw.slice(open + CTA_OPEN.length, close).trim()
  try {
    const parsed = JSON.parse(payload)
    return { text, cta: isCta(parsed) ? parsed : null }
  } catch {
    return { text, cta: null }
  }
}

function setBusy(busy) {
  inputEl.disabled = busy
  sendBtn.disabled = busy
}

async function sendMessage(userText) {
  turns.push({ role: "user", text: userText.slice(0, MAX_CHARS) })
  if (turns.length > MAX_TURNS) turns.splice(0, turns.length - MAX_TURNS)

  const bubble = renderModelBubble()
  let fullText = ""

  try {
    const upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 900,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "")
      throw new Error(`Gemini ${upstream.status}: ${detail.slice(0, 300)}`)
    }

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
          const parts = json?.candidates?.[0]?.content?.parts ?? []
          for (const part of parts) {
            if (typeof part?.text === "string" && part.text) {
              fullText += part.text
              const { text } = parseCta(fullText)
              bubble.setText(text)
            }
          }
        } catch {
          // Partial JSON across chunk boundaries; the next read completes it.
        }
      }
    }

    const { text, cta } = parseCta(fullText)
    bubble.setText(text)
    if (cta) bubble.addCta(cta)
    turns.push({ role: "model", text })
  } catch (err) {
    console.error("[chat] failed", err)
    bubble.setText(
      "Something went wrong reaching the model. Check the console for details."
    )
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault()
  const text = inputEl.value.trim()
  if (!text) return
  inputEl.value = ""
  renderUserBubble(text)
  setBusy(true)
  try {
    await sendMessage(text)
  } finally {
    setBusy(false)
    inputEl.focus()
  }
})
