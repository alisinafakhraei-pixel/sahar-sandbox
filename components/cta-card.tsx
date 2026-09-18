import { ArrowRight, CalendarDays, Sparkles } from "lucide-react"

import type { Cta } from "@/lib/parse-cta"
import { cn } from "@/lib/utils"

export function CtaCard({ cta }: { cta: Cta }) {
  const complex = cta.path === "complex"
  const Icon = complex ? CalendarDays : Sparkles

  return (
    <a
      href={cta.href}
      className={cn(
        "group animate-rise-in mt-4 flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        complex
          ? "border-border bg-card hover:bg-muted"
          : "border-transparent bg-primary text-primary-foreground hover:opacity-90"
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
          complex ? "bg-accent text-accent-foreground" : "bg-white/15"
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex-1 text-sm font-semibold">{cta.label}</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}
