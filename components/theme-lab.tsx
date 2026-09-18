"use client"

import * as React from "react"
import { Check, Copy, Paintbrush, RotateCcw, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Live colour editor for the brand tokens.
 *
 * Writes straight onto <html> as inline custom properties, which override the
 * stylesheet for both themes, and persists to localStorage. Never rendered for
 * ordinary visitors. See `useLabEnabled` below.
 */

type Token = { name: string; label: string; fallback: string; hint?: string }

const GROUPS: { heading: string; tokens: Token[] }[] = [
  {
    heading: "Neutrals",
    tokens: [
      { name: "--ink", label: "Ink", fallback: "#1f2023", hint: "CTAs, wordmark, user bubble" },
      { name: "--ink-deep", label: "Ink deep", fallback: "#19191c", hint: "Dark-mode canvas" },
      { name: "--canvas", label: "Canvas", fallback: "#faf9f5", hint: "Light-mode page" },
    ],
  },
  {
    heading: "Brand ramp",
    tokens: [
      { name: "--brand-red", label: "Red", fallback: "#f5423c" },
      { name: "--brand-mid", label: "Mid", fallback: "#fa5733" },
      { name: "--brand-orange", label: "Orange", fallback: "#ff7a2e" },
    ],
  },
  {
    heading: "Chat",
    tokens: [
      { name: "--chat-user", label: "User bubble", fallback: "#1f2023" },
      { name: "--chat-surface", label: "Assistant surface", fallback: "#f6f4f0" },
    ],
  },
]

const ALL = GROUPS.flatMap((g) => g.tokens)
const STORAGE_KEY = "formaloo-theme-lab"

/** Dev builds always; production only behind ?lab (so visitors never see it). */
function useLabEnabled() {
  const [enabled, setEnabled] = React.useState(false)
  React.useEffect(() => {
    const viaQuery = new URLSearchParams(window.location.search).has("lab")
    setEnabled(process.env.NODE_ENV === "development" || viaQuery)
  }, [])
  return enabled
}

function readComputed(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

export function ThemeLab() {
  const enabled = useLabEnabled()
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [copied, setCopied] = React.useState(false)

  // Restore overrides, then fill the rest from whatever the stylesheet resolves.
  React.useEffect(() => {
    if (!enabled) return
    let stored: Record<string, string> = {}
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    } catch {
      stored = {}
    }
    for (const [name, value] of Object.entries(stored)) {
      document.documentElement.style.setProperty(name, value)
    }
    setValues(
      Object.fromEntries(
        ALL.map((t) => [t.name, stored[t.name] ?? readComputed(t.name, t.fallback)])
      )
    )
  }, [enabled])

  function apply(name: string, value: string) {
    document.documentElement.style.setProperty(name, value)
    const next = { ...values, [name]: value }
    setValues(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private mode: the live preview still works, it just will not persist.
    }
  }

  function reset() {
    for (const token of ALL) {
      document.documentElement.style.removeProperty(token.name)
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setValues(
      Object.fromEntries(ALL.map((t) => [t.name, readComputed(t.name, t.fallback)]))
    )
  }

  async function copyCss() {
    const css = ALL.map((t) => `  ${t.name}: ${values[t.name] ?? t.fallback};`).join("\n")
    try {
      await navigator.clipboard.writeText(`:root {\n${css}\n}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked; nothing useful to do here.
    }
  }

  if (!enabled) return null

  return (
    <div className="fixed right-4 bottom-4 z-[60] print:hidden">
      {open && (
        <div className="animate-rise-in mb-2 max-h-[70vh] w-[19rem] overflow-y-auto rounded-2xl border border-border bg-popover p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Theme lab</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close theme lab"
              className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {GROUPS.map((group) => (
            <div key={group.heading} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.heading}
              </h3>
              <div className="space-y-2">
                {group.tokens.map((token) => (
                  <div key={token.name} className="flex items-center gap-2.5">
                    <input
                      type="color"
                      aria-label={token.label}
                      value={values[token.name] ?? token.fallback}
                      onChange={(e) => apply(token.name, e.target.value)}
                      className="size-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium">{token.label}</div>
                      {token.hint && (
                        <div className="truncate text-[0.65rem] text-muted-foreground">
                          {token.hint}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      aria-label={`${token.label} hex`}
                      value={values[token.name] ?? token.fallback}
                      onChange={(e) => {
                        const v = e.target.value
                        setValues((prev) => ({ ...prev, [token.name]: v }))
                        if (/^#[0-9a-f]{6}$/i.test(v)) apply(token.name, v)
                      }}
                      className="w-[5.5rem] rounded-md border border-input bg-background px-2 py-1 font-mono text-[0.7rem] focus:ring-2 focus:ring-ring focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={copyCss}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy CSS"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle theme lab"
        className={cn(
          "ml-auto flex size-10 items-center justify-center rounded-full border border-border bg-popover shadow-lg transition-transform hover:scale-105",
          open && "scale-95"
        )}
      >
        <Paintbrush className="size-4" />
      </button>
    </div>
  )
}
