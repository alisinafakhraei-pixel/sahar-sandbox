import { ChatExperience } from "@/components/chat-experience"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <ChatExperience />
      </main>
      <SiteFooter />
    </>
  )
}
