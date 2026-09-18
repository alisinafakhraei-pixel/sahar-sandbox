import { CTA_CLOSE, CTA_OPEN } from "./system-prompt"

export type CtaAction = "signup" | "demo" | "template" | "pricing" | "help"

export type Cta = {
  path: "simple" | "complex"
  action: CtaAction
  label: string
  href: string
}

const ALLOWED_ACTIONS: CtaAction[] = [
  "signup",
  "demo",
  "template",
  "pricing",
  "help",
]

function isCta(value: unknown): value is Cta {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (v.path === "simple" || v.path === "complex") &&
    typeof v.action === "string" &&
    ALLOWED_ACTIONS.includes(v.action as CtaAction) &&
    typeof v.label === "string" &&
    v.label.length > 0 &&
    typeof v.href === "string" &&
    // Only ever link back to Formaloo. Blocks a prompt-injected off-site URL.
    /^https:\/\/([a-z0-9-]+\.)*formaloo\.(com|me)\//.test(v.href)
  )
}

/**
 * Splits a (possibly still-streaming) model reply into display text and a CTA.
 *
 * While the sentinel is only half-written we must not let the raw `<<<CTA {…`
 * fragment flash on screen, so any trailing partial is trimmed too.
 */
export function parseCta(raw: string): { text: string; cta: Cta | null } {
  const open = raw.indexOf(CTA_OPEN)

  if (open === -1) {
    // Hide a partial sentinel that is mid-arrival, e.g. "<<" or "<<<C".
    const trailing = raw.match(/<{1,3}C?T?A?$/)
    const text = trailing ? raw.slice(0, raw.length - trailing[0].length) : raw
    return { text: text.trimEnd(), cta: null }
  }

  const text = raw.slice(0, open).trimEnd()
  const close = raw.indexOf(CTA_CLOSE, open)
  if (close === -1) return { text, cta: null }

  const payload = raw.slice(open + CTA_OPEN.length, close).trim()

  try {
    const parsed: unknown = JSON.parse(payload)
    return { text, cta: isCta(parsed) ? parsed : null }
  } catch {
    return { text, cta: null }
  }
}
