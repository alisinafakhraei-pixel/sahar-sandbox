"use client"

import * as React from "react"
import { ArrowUp, Paperclip, Square } from "lucide-react"

import { cn } from "@/lib/utils"

export function PromptBox({
  value,
  onValueChange,
  onSubmit,
  onStop,
  busy = false,
  autoFocus = false,
  placeholder = "Ask Formaloo to build a form for my…",
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  busy?: boolean
  autoFocus?: boolean
  placeholder?: string
  className?: string
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  // Auto-grow: reset to auto first so the box shrinks back when text is deleted.
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [value])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !busy) onSubmit()
    }
  }

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-black/5 bg-card p-2 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.22)] ring-1 ring-black/[0.03] transition-shadow duration-300 focus-within:shadow-[0_22px_64px_-12px_rgb(0_0_0/0.3)] dark:border-white/10 dark:shadow-[0_18px_50px_-12px_rgb(0_0_0/0.6)] dark:ring-white/[0.04]",
        className
      )}
    >
      <label htmlFor="formaloo-prompt" className="sr-only">
        Describe what you want to build
      </label>
      <textarea
        id="formaloo-prompt"
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={2000}
        className="block max-h-[220px] w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[0.975rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <button
          type="button"
          aria-label="Attach a file"
          title="Attachments are not wired up in this prototype"
          disabled
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Paperclip className="size-[18px]" />
        </button>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-85"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            aria-label="Send message"
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ArrowUp className="size-[18px]" />
          </button>
        )}
      </div>
    </div>
  )
}
