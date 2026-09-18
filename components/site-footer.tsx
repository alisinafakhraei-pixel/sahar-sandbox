import { Logo } from "@/components/brand/logo"
import { LINKS } from "@/lib/knowledge"

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Form builder", href: "https://www.formaloo.com/form-builder" },
      { label: "Client portals", href: "https://www.formaloo.com/portals" },
      { label: "Approval workflows", href: "https://www.formaloo.com/automate-approval-workflows" },
      { label: "Dashboards", href: "https://www.formaloo.com/dashboard-creator" },
      { label: "Formaloo AI", href: "https://www.formaloo.com/ai" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "Healthcare", href: "https://www.formaloo.com/healthcare-workflow-automation" },
      { label: "Agencies", href: "https://www.formaloo.com/agencyos" },
      { label: "Education", href: "https://www.formaloo.com/formaloo-for-education" },
      { label: "Remote teams", href: "https://www.formaloo.com/formaloo-for-remote-working" },
      { label: "Enterprise", href: LINKS.enterprise },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Templates", href: LINKS.templates },
      { label: "Help center", href: LINKS.help },
      { label: "Concierge service", href: LINKS.concierge },
      { label: "Pricing", href: LINKS.pricing },
      { label: "Book a demo", href: LINKS.demo },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo className="h-7" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The Operations Intelligence platform that helps organizations
              collect, understand, and act on the information that runs their
              operations.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="text-xs font-semibold tracking-wide text-foreground uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Formaloo Solutions Inc. Hosted in the EU by default.</p>
          <p>GDPR · HIPAA · PCI DSS</p>
        </div>
      </div>
    </footer>
  )
}
