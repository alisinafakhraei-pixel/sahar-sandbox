"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Logo, type LogoState } from "@/components/brand/logo"
import { CtaCard } from "@/components/cta-card"
import type { Cta } from "@/lib/parse-cta"
import { cn } from "@/lib/utils"

/**
 * Generated Magic Create prompts arrive fenced in triple backticks so they
 * render as their own copyable block rather than inline prose. This mirrors
 * markdown fences without pulling in a markdown parser: `text` alternates
 * with fenced code, and a fence with no closing ``` yet (still streaming) is
 * treated as code through to the end of the string so it grows live.
 */
type Segment =
  | { type: "text"; content: string }
  | { type: "code"; content: string }

function splitSegments(raw: string): Segment[] {
  const segments: Segment[] = []
  let i = 0

  while (i < raw.length) {
    const openIdx = raw.indexOf("```", i)
    if (openIdx === -1) {
      segments.push({ type: "text", content: raw.slice(i) })
      break
    }
    if (openIdx > i) {
      segments.push({ type: "text", content: raw.slice(i, openIdx) })
    }

    let codeStart = openIdx + 3
    const newlineIdx = raw.indexOf("\n", codeStart)
    const langCandidate =
      newlineIdx === -1 ? "" : raw.slice(codeStart, newlineIdx)
    if (newlineIdx !== -1 && /^[a-zA-Z0-9_-]{0,20}$/.test(langCandidate)) {
      codeStart = newlineIdx + 1
    }

    const closeIdx = raw.indexOf("```", codeStart)
    if (closeIdx === -1) {
      // Fence hasn't closed yet, still streaming in, take the rest as code.
      segments.push({
        type: "code",
        content: raw.slice(codeStart).replace(/\n$/, ""),
      })
      i = raw.length
    } else {
      segments.push({
        type: "code",
        content: raw.slice(codeStart, closeIdx).replace(/\n$/, ""),
      })
      i = closeIdx + 3
    }
  }

  return segments
}

function CopyableBlock({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked (permissions, insecure context) — nothing useful
      // to fall back to here; the text is still fully selectable.
    }
  }

  return (
    <div className="animate-rise-in my-3 overflow-hidden rounded-2xl border border-border bg-secondary">
      <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2">
        <span className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
          Magic Create prompt
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[0.82rem] leading-relaxed whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  )
}

/**
 * Minimal inline formatter. The model is told to answer in short prose and
 * numbered steps, so a full markdown dependency would be overkill. This covers
 * **bold**, markdown links `[label](url)`, and bare URLs, leaving everything
 * else as text. The live model writes markdown links fairly often even though
 * the system prompt asks for plain prose, so that case has to be handled
 * rather than left to degrade into literal bracket text.
 */
function formatInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern =
    /(\*\*[^*]+\*\*)|(\[[^\]]+\]\(https?:\/\/[^\s()]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))

    if (match[1]) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold">
          {match[1].slice(2, -2)}
        </strong>
      )
    } else if (match[2]) {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s()]+)\)$/.exec(match[2])
      if (linkMatch) {
        nodes.push(
          <a
            key={`${keyPrefix}-a${i}`}
            href={linkMatch[2]}
            className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
          >
            {linkMatch[1]}
          </a>
        )
      }
    } else if (match[3]) {
      nodes.push(
        <a
          key={`${keyPrefix}-a${i}`}
          href={match[3]}
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
        >
          {match[3].replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      )
    }

    last = match.index + match[0].length
    i++
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function ProseBlocks({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0)

  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n")
        const isList = lines.every((l) => /^\s*(\d+\.|[-*•])\s+/.test(l))
        const key = `${keyPrefix}-${bi}`

        if (isList) {
          const ordered = /^\s*\d+\./.test(lines[0])
          const Tag = ordered ? "ol" : "ul"
          return (
            <Tag
              key={key}
              className={cn(
                "my-2 space-y-1.5 pl-5",
                ordered ? "list-decimal" : "list-disc"
              )}
            >
              {lines.map((line, li) => (
                <li key={li} className="pl-0.5">
                  {formatInline(
                    line.replace(/^\s*(\d+\.|[-*•])\s+/, ""),
                    `${key}-${li}`
                  )}
                </li>
              ))}
            </Tag>
          )
        }

        return (
          <p key={key} className="my-2 first:mt-0 last:mb-0">
            {formatInline(block, key)}
          </p>
        )
      })}
    </>
  )
}

function RichText({ text }: { text: string }) {
  const segments = splitSegments(text)

  return (
    <>
      {segments.map((segment, si) =>
        segment.type === "code" ? (
          <CopyableBlock key={`c${si}`} content={segment.content} />
        ) : (
          <ProseBlocks key={`t${si}`} text={segment.content} keyPrefix={`t${si}`} />
        )
      )}
    </>
  )
}

export type ChatMessage = {
  id: string
  role: "user" | "model"
  text: string
  cta: Cta | null
  failed?: boolean
}

export function Message({
  message,
  streaming,
  blinkOffset = 0,
}: {
  message: ChatMessage
  streaming?: boolean
  /** Staggers the idle blink so a stack of assistant avatars feels less robotic. */
  blinkOffset?: number
}) {
  if (message.role === "user") {
    return (
      <div className="animate-rise-in flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-chat-user px-4 py-2.5 text-[0.95rem] leading-relaxed text-chat-user-foreground shadow-sm">
          {message.text}
        </div>
      </div>
    )
  }

  // The mark scans while the reply streams, then plays a one-shot squash on
  // arrival before settling back to its idle blink.
  const [justFinished, setJustFinished] = React.useState(false)
  const wasStreaming = React.useRef(false)

  React.useEffect(() => {
    if (wasStreaming.current && !streaming) {
      setJustFinished(true)
      const timer = setTimeout(() => setJustFinished(false), 700)
      return () => clearTimeout(timer)
    }
    wasStreaming.current = Boolean(streaming)
  }, [streaming])

  const logoState: LogoState = streaming
    ? "thinking"
    : justFinished
      ? "done"
      : "idle"

  return (
    <div className="animate-rise-in flex gap-3">
      <Logo
        markOnly
        state={logoState}
        blinkOffset={blinkOffset * 0.85}
        className="mt-0.5 size-7 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[0.95rem] leading-relaxed",
            message.failed && "text-destructive"
          )}
        >
          <RichText text={message.text} />
          {streaming && !message.text && (
            <span
              className="inline-flex items-end gap-1 py-2.5"
              role="status"
              aria-label="Thinking"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  style={{
                    animation: "thinking-dot 1.1s ease-in-out infinite",
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </span>
          )}
        </div>
        {message.cta && <CtaCard cta={message.cta} />}
      </div>
    </div>
  )
}
