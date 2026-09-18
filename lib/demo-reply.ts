import { LINKS } from "./knowledge"

/**
 * Scripted stand-in used only when GEMINI_API_KEY is missing or the Gemini call
 * fails. It exists so the hero-to-conversation-to-CTA flow stays reviewable
 * without a working key. The client always shows a banner when this is serving,
 * so nobody mistakes it for the real model.
 */

const COMPLEX_SIGNALS = [
  "migrate", "migration", "hipaa", "sso", "saml", "scim", "audit",
  "self-host", "self host", "on-premise", "on prem", "data residency",
  "enterprise", "sla", "salesforce", "netsuite", "sap", "legacy",
  "thousands", "multi-region", "custom agent", "ai agent",
]

const SIMPLE_SIGNALS = [
  "form", "survey", "quiz", "poll", "signature", "sign", "pdf", "document",
  "portal", "dashboard", "crm", "calculator", "booking", "registration",
  "payment", "feedback", "nps", "intake", "onboarding", "approval",
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

  if (COMPLEX_SIGNALS.some((s) => text.includes(s))) {
    return (
      "That one sits with our team rather than a self-serve build. It touches " +
      "systems and controls that need to be set up properly the first time.\n\n" +
      "Quick question so we point you at the right person: roughly how many " +
      "people would be using this day to day?" +
      cta("complex", "demo", "Book a call", LINKS.demo)
    )
  }

  if (SIMPLE_SIGNALS.some((s) => text.includes(s))) {
    return (
      "Yes, that's a standard Formaloo build, and you can have it running " +
      "today.\n\n" +
      "1. Start from a template or describe it to Formaloo AI to generate the fields.\n" +
      "2. Add conditional logic so people only see what applies to them.\n" +
      "3. Publish it, and watch responses land in a dashboard you can filter.\n\n" +
      `Closest starting point: ${LINKS.templates}` +
      cta("simple", "signup", "Start building free", LINKS.signup)
    )
  }

  return (
    "Tell me a bit more and I can give you a straight answer. What does the " +
    "process look like today: who fills something in, and what has to happen " +
    "after they do?"
  )
}
