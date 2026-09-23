/**
 * Server-emitted, real-time status events prepended to the reply stream:
 * the help-center search starting/finishing, and which mode served this
 * turn. Deliberately a separate sentinel family from the model-emitted
 * `<<<CTA ...>>>` in parse-cta.ts — these come from our own route handler,
 * not from Gemini's generated text, so mixing the two prefixes would risk
 * the model's own output colliding with ours.
 *
 * Events only ever appear as a leading run at the very start of the raw
 * stream, before any visible reply text, so parsing only needs to look at
 * the front of the string.
 */

export type MetaEvent =
  | { type: "search"; phase: "start"; query: string }
  | { type: "search"; phase: "done"; count: number }
  | { type: "mode"; mode: "live" | "demo"; reason?: string }

export const META_OPEN = "<<<META"
export const META_CLOSE = ">>>"

export function metaMarker(event: MetaEvent): string {
  return `${META_OPEN} ${JSON.stringify(event)} ${META_CLOSE}\n`
}

function isMetaEvent(value: unknown): value is MetaEvent {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>

  if (v.type === "search") {
    if (v.phase === "start") return typeof v.query === "string"
    if (v.phase === "done") return typeof v.count === "number"
    return false
  }
  if (v.type === "mode") {
    return v.mode === "live" || v.mode === "demo"
  }
  return false
}

/**
 * Strips every complete leading `<<<META {...}>>>` marker off `raw`,
 * returning the parsed events (in order) and whatever text remains.
 *
 * Called fresh on the full accumulated stream on every chunk, same pattern
 * as parseCta, so it must never let a marker that hasn't closed yet leak
 * into `rest` as visible text — if the run ends mid-marker, everything
 * from that partial marker onward is held back until it completes.
 */
export function extractLeadingMeta(raw: string): {
  events: MetaEvent[]
  rest: string
} {
  const events: MetaEvent[] = []
  let i = 0

  for (;;) {
    while (i < raw.length && /\s/.test(raw[i])) i++

    if (!raw.startsWith(META_OPEN, i)) break

    const closeIdx = raw.indexOf(META_CLOSE, i + META_OPEN.length)
    if (closeIdx === -1) {
      // Marker opened but hasn't closed yet — hold everything from here on.
      return { events, rest: "" }
    }

    const payload = raw.slice(i + META_OPEN.length, closeIdx).trim()
    try {
      const parsed: unknown = JSON.parse(payload)
      if (isMetaEvent(parsed)) events.push(parsed)
    } catch {
      // A malformed marker from our own server is a bug worth ignoring
      // gracefully in the client rather than breaking the whole reply.
    }
    i = closeIdx + META_CLOSE.length
  }

  return { events, rest: raw.slice(i) }
}
