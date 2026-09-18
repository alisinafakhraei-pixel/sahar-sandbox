"use client"

import * as React from "react"
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { LINKS } from "@/lib/knowledge"
import { NAV, type NavItem } from "@/lib/nav"
import { cn } from "@/lib/utils"

function MegaPanel({ item }: { item: Extract<NavItem, { groups: object }> }) {
  return (
    <div className="absolute top-16 left-1/2 z-50 w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 animate-rise-in-sm px-0 pt-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)]">
        <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-3">
          {item.groups.map((group) => (
            <div key={group.heading}>
              <h3 className="mb-3 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.heading}
              </h3>
              <ul className="space-y-0.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="-mx-2 block rounded-lg px-2 py-1.5 text-sm text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {item.featured && (
          <a
            href={item.featured.href}
            className="group flex items-center gap-3 border-t border-border bg-muted/50 px-6 py-4 transition-colors hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {item.featured.label}
              </div>
              {item.featured.description && (
                <div className="truncate text-xs text-muted-foreground">
                  {item.featured.description}
                </div>
              )}
            </div>
            <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export function SiteHeader() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mobileSection, setMobileSection] = React.useState<string | null>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenIndex(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    []
  )

  // A small grace period stops the panel snapping shut while the pointer
  // crosses the gap between the trigger and the panel.
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenIndex(null), 120)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div
        className="relative"
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <a
            href="https://www.formaloo.com"
            aria-label="Formaloo home"
            className="group shrink-0 rounded-md text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Logo
              state="idle"
              className="h-7 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </a>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item, index) => {
              const hasPanel = "groups" in item && item.groups
              const open = openIndex === index

              if (!hasPanel) {
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onMouseEnter={() => setOpenIndex(null)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                )
              }

              return (
                <li
                  key={item.label}
                  onMouseEnter={() => {
                    cancelClose()
                    setOpenIndex(index)
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenIndex(open ? null : index)}
                    onFocus={() => setOpenIndex(index)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      open
                        ? "text-foreground"
                        : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              nativeButton={false}
              render={<a href={LINKS.login}>Log in</a>}
            />
            <Button
              size="sm"
              className="rounded-full px-4"
              nativeButton={false}
              render={<a href={LINKS.signup}>Get started</a>}
            />
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 inline-flex size-9 items-center justify-center rounded-md text-foreground lg:hidden"
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </nav>

        {openIndex !== null &&
          (() => {
            const active = NAV[openIndex]
            return "groups" in active && active.groups ? (
              <MegaPanel item={active} />
            ) : null
          })()}
      </div>

      {mobileOpen && (
        <div className="mx-4 max-h-[75vh] animate-rise-in-sm overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl lg:hidden">
          <ul className="p-2">
            {NAV.map((item) => {
              const hasPanel = "groups" in item && item.groups
              if (!hasPanel) {
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  </li>
                )
              }

              const expanded = mobileSection === item.label
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setMobileSection(expanded ? null : item.label)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        expanded && "rotate-180"
                      )}
                    />
                  </button>
                  {expanded && (
                    <div className="animate-rise-in-sm space-y-3 px-3 pt-1 pb-3">
                      {item.groups.map((group) => (
                        <div key={group.heading}>
                          <h3 className="mb-1.5 text-[0.62rem] font-semibold tracking-wider text-muted-foreground uppercase">
                            {group.heading}
                          </h3>
                          <ul className="space-y-0.5">
                            {group.links.map((link) => (
                              <li key={link.label}>
                                <a
                                  href={link.href}
                                  className="block rounded-md py-1.5 text-sm text-foreground/70 hover:text-foreground"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
            <li className="mt-2 flex items-center justify-between gap-2 border-t border-border px-3 pt-3">
              <a
                href={LINKS.login}
                className="text-sm font-medium text-foreground/80"
              >
                Log in
              </a>
              <ThemeToggle />
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
