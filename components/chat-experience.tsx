"use client"

import * as React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Message, type ChatMessage, type SearchStatus } from "@/components/message"
import { PromptBox } from "@/components/prompt-box"
import { parseCta } from "@/lib/parse-cta"
import { extractLeadingMeta } from "@/lib/parse-meta"
import { cn } from "@/lib/utils"

let idCounter = 0
const nextId = () => `m${++idCounter}`

export function ChatExperience({
  apiPath = "/api/chat",
}: {
  /** Which backend this instance talks to — lets /v2 point at a different route. */
  apiPath?: string
} = {}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [demoReason, setDemoReason] = React.useState<string | null>(null)

  // Identifies this conversation for the Supabase log (server-side only,
  // never a per-visitor identity). One id per conversation, regenerated on
  // "Start over" so a fresh thread logs as its own row. useRef's initial
  // value would otherwise be re-evaluated (and discarded) on every render,
  // so it's generated lazily the first time it's actually read instead.
  const conversationIdRef = React.useRef<string | null>(null)
  function conversationId(): string {
    if (!conversationIdRef.current) {
      conversationIdRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    return conversationIdRef.current
  }

  const abortRef = React.useRef<AbortController | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const started = messages.length > 0

  React.useEffect(() => {
    if (started) bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, started])

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const send = React.useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || busy) return

      const history = [...messages]
      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        text,
        cta: null,
      }
      const replyId = nextId()

      setMessages([
        ...history,
        userMessage,
        { id: replyId, role: "model", text: "", cta: null },
      ])
      setInput("")
      setBusy(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(apiPath, {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [...history, userMessage].map((m) => ({
              role: m.role,
              text: m.text,
            })),
            conversationId: conversationId(),
          }),
        })

        setDemoReason(
          response.headers.get("x-formaloo-mode") === "demo"
            ? response.headers.get("x-formaloo-reason")
            : null
        )

        if (!response.ok || !response.body) {
          const detail =
            response.status === 429
              ? "That's a lot of messages at once. Give it a minute and try again."
              : "Something went wrong reaching the assistant. Try again in a moment."
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, text: detail, failed: true } : m
            )
          )
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })

          // Server-emitted status events (v1 only — v2 never sends these,
          // so events is always empty there and rest === accumulated,
          // completely transparent). Re-derived fresh each chunk, same
          // pattern as the CTA parse below.
          const { events, rest } = extractLeadingMeta(accumulated)

          let search: SearchStatus | null = null
          for (const evt of events) {
            if (evt.type === "search") {
              search =
                evt.phase === "start"
                  ? { phase: "start", query: evt.query }
                  : { phase: "done", count: evt.count }
            } else if (evt.type === "mode" && evt.mode === "demo") {
              setDemoReason(evt.reason ?? "unknown")
            }
          }

          const { text: visible, cta } = parseCta(rest)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, text: visible, cta, search } : m
            )
          )
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? {
                  ...m,
                  text: "Lost the connection. Try that again.",
                  failed: true,
                }
              : m
          )
        )
      } finally {
        abortRef.current = null
        setBusy(false)
      }
    },
    [busy, messages]
  )

  function reset() {
    abortRef.current?.abort()
    setMessages([])
    setInput("")
    setBusy(false)
    conversationIdRef.current = null // Next send() lazily mints a fresh one.
  }

  return (
    <section
      className={cn(
        "relative flex min-h-svh flex-col overflow-hidden",
        // Hero keeps the brand wash. Once a conversation starts the page drops
        // to a plain canvas so long replies stay readable, and anchors the
        // composer to the bottom instead of floating mid-screen.
        started
          ? "justify-end bg-chat-surface"
          : "hero-wash justify-center py-24"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-4 sm:px-6",
          started
            ? "max-w-3xl justify-end"
            : "max-w-2xl items-center justify-center"
        )}
      >
        {!started && (
          <div className="animate-hero-settle text-center">
            <h1 className="text-balance text-[2.15rem] leading-[1.06] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Describe the process.
              <br />
              <span className="text-brand-gradient">We&apos;ll build it.</span>
            </h1>
            <p
              className="animate-rise-in mx-auto mt-5 max-w-xl text-balance text-base text-foreground/70 sm:text-lg"
              style={{ animationDelay: "90ms" }}
            >
              Tell Formaloo OI what slows your team down. Get a straight answer on
              how to build it yourself, or hand it to the team that will.
            </p>
          </div>
        )}

        {started && (
          <div className="w-full space-y-7 pt-28 pb-6">
            {messages.map((message, i) => (
              <Message
                key={message.id}
                message={message}
                streaming={busy && i === messages.length - 1}
                blinkOffset={i}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div
          className={cn(
            "w-full",
            started
              ? "sticky bottom-0 bg-gradient-to-t from-chat-surface via-chat-surface to-transparent pt-4 pb-5"
              : "animate-rise-in mt-9"
          )}
          style={started ? undefined : { animationDelay: "160ms" }}
        >
          <PromptBox
            value={input}
            onValueChange={setInput}
            onSubmit={() => send(input)}
            onStop={() => abortRef.current?.abort()}
            busy={busy}
            autoFocus={started}
            placeholder={
              started
                ? "Ask a follow-up…"
                : "Ask Formaloo to build a form for my…"
            }
          />

          {!started && (
            <dl
              className="animate-fade-in mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center"
              style={{ animationDelay: "260ms" }}
            >
              {[
                ["35K+", "teams worldwide"],
                ["4.7/5", "from 1,000+ reviews"],
                ["19 hrs", "saved per team weekly"],
              ].map(([value, label]) => (
                <div key={label} className="flex items-baseline gap-1.5">
                  <dt className="text-sm font-bold text-foreground">{value}</dt>
                  <dd className="text-sm text-foreground/60">{label}</dd>
                </div>
              ))}
            </dl>
          )}

          {started && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Start over
              </button>
              {demoReason && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[0.7rem] font-medium text-accent-foreground">
                  <AlertTriangle className="size-3" />
                  Demo mode: scripted replies ({demoReason})
                </span>
              )}
            </div>
          )}
        </div>
    </div>
    </section>
  )
}
