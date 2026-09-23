"use client"

import * as React from "react"
import { Check, Copy, ExternalLink, Search } from "lucide-react"

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

/**
 * V1's system prompt constrains replies to short plain prose, so the original
 * block splitter (blank-line-separated paragraphs/lists) covered it fine.
 * V2's agent has no such constraint and writes full markdown documents
 * (### headings, --- rules), which used to render as literal text. Headings
 * and rules are pulled out as their own blocks here regardless of blank-line
 * spacing, since a heading is often followed immediately by a list with no
 * blank line between them.
 */
type ProseBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "hr" }
  | { type: "text"; lines: string[] }

function splitProseBlocks(text: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  let current: string[] = []

  function flush() {
    if (current.length > 0) {
      blocks.push({ type: "text", lines: current })
      current = []
    }
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flush()
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] })
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flush()
      blocks.push({ type: "hr" })
    } else if (trimmed === "") {
      flush()
    } else {
      current.push(line)
    }
  }
  flush()
  return blocks
}

function ProseBlocks({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  const blocks = splitProseBlocks(text)

  return (
    <>
      {blocks.map((block, bi) => {
        const key = `${keyPrefix}-${bi}`

        if (block.type === "hr") {
          return <hr key={key} className="my-3 border-border" />
        }

        if (block.type === "heading") {
          return (
            <p
              key={key}
              className={cn(
                "mt-3 mb-1 font-semibold first:mt-0",
                block.level <= 2 ? "text-[1.05rem]" : "text-[0.95rem]"
              )}
            >
              {formatInline(block.text, key)}
            </p>
          )
        }

        const lines = block.lines
        const isList = lines.every((l) => /^\s*(\d+\.|[-*•])\s+/.test(l))

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
            {formatInline(lines.join("\n"), key)}
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

/**
 * Real-time visibility into the live Intercom help-center search that runs
 * before v1 answers (see lib/parse-meta.ts + app/api/chat/route.ts). Absent
 * entirely on v2, whose route never emits these markers.
 */
export type SearchStatus =
  | { phase: "start"; query: string }
  | { phase: "done"; count: number; articles: { title: string; url: string }[] }

export type ChatMessage = {
  id: string
  role: "user" | "model"
  text: string
  cta: Cta | null
  failed?: boolean
  search?: SearchStatus | null
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function SearchStatusPill({ status }: { status: SearchStatus }) {
  const label =
    status.phase === "start"
      ? `Searching the help center for "${truncate(status.query, 60)}"`
      : status.count > 0
        ? `Found ${status.count} related help ${status.count === 1 ? "article" : "articles"}`
        : "No matching help articles found"

  return (
    <span
      className="inline-flex items-center gap-1.5 py-2.5 text-[0.85rem] text-muted-foreground"
      role="status"
    >
      <Search
        className={cn("size-3.5 shrink-0", status.phase === "start" && "animate-pulse")}
      />
      {label}
    </span>
  )
}

/**
 * Renders the actual articles the live Intercom search found, as open-able
 * links — not just "found 3 articles," the visitor can read them directly.
 * Unlike SearchStatusPill (which only shows while streaming, before any
 * reply text), this renders for the life of the message: `message.search`
 * keeps its "done" value after streaming ends (see chat-experience.tsx),
 * so this persists exactly like the CTA card does.
 */
function SourcesList({ articles }: { articles: { title: string; url: string }[] }) {
  if (articles.length === 0) return null

  return (
    <div className="animate-rise-in mt-3">
      <p className="mb-1.5 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
        Sources
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {articles.map((a) => (
          <li key={a.url}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-[280px] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[0.8rem] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              <span className="truncate">{a.title}</span>
              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
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
          {streaming && !message.text && message.search ? (
            <SearchStatusPill status={message.search} />
          ) : (
            streaming &&
            !message.text && (
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
            )
          )}
        </div>
        {message.search?.phase === "done" && (
          <SourcesList articles={message.search.articles} />
        )}
        {message.cta && <CtaCard cta={message.cta} />}
      </div>
    </div>
  )
}
