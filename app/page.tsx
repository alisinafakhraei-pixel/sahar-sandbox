import { ChatExperience } from "@/components/chat-experience"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { VersionBanner } from "@/components/version-banner"

export default function Page() {
  return (
    <>
      <VersionBanner
        version={1}
        description="Sahar Sandbox — Direct Gemini API call + Intercom API"
        otherHref="/v2"
        otherLabel="Try Version 2"
      />
      <div className="pt-9">
        <SiteHeader topOffset />
        <main>
          <ChatExperience />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
