import { ArrowRight } from "lucide-react"

/**
 * Fixed strip pinned above the header on the two A/B comparison pages
 * (`/` and `/v2`). SiteHeader's own `topOffset` prop shifts down to match
 * this bar's height (h-9) so nothing overlaps.
 */
export function VersionBanner({
  version,
  description,
  otherHref,
  otherLabel,
}: {
  version: 1 | 2
  description: string
  otherHref: string
  otherLabel: string
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex h-9 items-center justify-center gap-2 overflow-hidden bg-[#5B21B6] px-3 text-center text-[0.8rem] text-white">
      <span className="shrink-0 font-semibold">V{version}</span>
      <span className="hidden shrink-0 text-white/60 sm:inline">·</span>
      <span className="hidden min-w-0 truncate text-white/80 sm:inline">
        {description}
      </span>
      <a
        href={otherHref}
        className="inline-flex shrink-0 items-center gap-1 font-medium whitespace-nowrap underline decoration-white/40 underline-offset-2 hover:decoration-white"
      >
        {otherLabel}
        <ArrowRight className="size-3" />
      </a>
    </div>
  )
}
