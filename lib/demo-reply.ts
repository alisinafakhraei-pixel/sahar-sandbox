import { LINKS } from "./knowledge"

/**
 * Scripted stand-in used only when GEMINI_API_KEY is missing or the Gemini call
 * fails. It exists so the hero-to-conversation-to-CTA flow stays reviewable
 * without a working key. The client always shows a banner when this is serving,
 * so nobody mistakes it for the real model.
 */

// Path B: multi-role systems Formaloo's build tooling doesn't reliably
// self-serve yet (portals, external OAuth integrations, waitlist/capacity
// logic, escalation chains) — see the ROUTING GUIDANCE in lib/knowledge.ts.
const PATH_B_SIGNALS = [
  "portal", "migrate", "migration", "hipaa", "sso", "saml", "scim", "audit",
  "self-host", "self host", "on-premise", "on prem", "data residency",
  "enterprise", "sla", "salesforce", "hubspot", "netsuite", "sap", "legacy",
  "thousands", "multi-region", "custom agent", "ai agent", "waitlist",
  "capacity", "escalat", "approver", "approvers",
]

// Path A: one form, in the broadest sense, regardless of size or logic.
const PATH_A_SIGNALS = [
  "form", "survey", "quiz", "poll", "signature", "sign", "pdf", "document",
  "dashboard", "crm", "calculator", "booking", "registration",
  "payment", "feedback", "nps", "intake", "onboarding", "application",
  "checklist", "order",
]

function cta(
  path: "simple" | "complex",
  action: string,
  label: string,
  href: string
) {
  return `\n\n<<<CTA {"path":"${path}","action":"${action}","label":"${label}","href":"${href}"} >>>`
}

export function demoReply(message: string): string {
  const text = message.toLowerCase()

  if (PATH_B_SIGNALS.some((s) => text.includes(s))) {
    return (
      "That's a system with more than one role in it, so it goes to our team " +
      "rather than self-serve.\n\n" +
      "Quick question so we point you at the right person: roughly how many " +
      "people would be using this day to day?" +
      cta("complex", "demo", "Book a demo", LINKS.demo)
    )
  }

  if (PATH_A_SIGNALS.some((s) => text.includes(s))) {
    return (
      "Yes, that's a form at its core, and you can build it yourself right " +
      "now.\n\nSign up and Magic Create opens automatically; describe it and " +
      "it builds the fields and logic for you." +
      cta("simple", "signup", "Sign up & build", LINKS.signup)
    )
  }

  return (
    "Tell me a bit more and I can give you a straight answer. What does the " +
    "process look like today: who fills something in, and what has to happen " +
    "after they do?"
  )
}
