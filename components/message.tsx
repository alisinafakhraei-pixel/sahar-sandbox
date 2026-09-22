"use client"

import * as React from "react"

import { Logo, type LogoState } from "@/components/brand/logo"
import { CtaCard } from "@/components/cta-card"
import type { Cta } from "@/lib/parse-cta"
import { cn } from "@/lib/utils"

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

function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)

  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n")
        const isList = lines.every((l) => /^\s*(\d+\.|[-*•])\s+/.test(l))

        if (isList) {
          const ordered = /^\s*\d+\./.test(lines[0])
          const Tag = ordered ? "ol" : "ul"
          return (
            <Tag
              key={bi}
              className={cn(
                "my-2 space-y-1.5 pl-5",
                ordered ? "list-decimal" : "list-disc"
              )}
            >
              {lines.map((line, li) => (
                <li key={li} className="pl-0.5">
                  {formatInline(
                    line.replace(/^\s*(\d+\.|[-*•])\s+/, ""),
                    `${bi}-${li}`
                  )}
                </li>
              ))}
            </Tag>
          )
        }

        return (
          <p key={bi} className="my-2 first:mt-0 last:mb-0">
            {formatInline(block, `${bi}`)}
          </p>
        )
      })}
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
