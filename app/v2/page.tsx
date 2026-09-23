import { ChatExperience } from "@/components/chat-experience"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { VersionBanner } from "@/components/version-banner"

export default function V2Page() {
  return (
    <>
      <VersionBanner
        version={2}
        description="Vertex AI Agent Builder — Gemini 3.5 Flash + Search + URL tools (not wired yet)"
        otherHref="/"
        otherLabel="Back to Version 1"
      />
      <div className="pt-9">
        <SiteHeader topOffset />
        <main>
          {/* apiPath will point at the Vertex-backed route once that's built. */}
          <ChatExperience apiPath="/api/chat" />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
