/**
 * Curated Formaloo knowledge injected into the system prompt.
 *
 * Every product name and URL here was taken from the live formaloo.com
 * navigation. The bot is instructed to use ONLY what appears in this file, so
 * adding something wrong here is how the bot starts lying. Keep it accurate.
 *
 * This is deliberately a flat, structured document: when the Google Cloud path
 * from FRM-3567 lands, this is what gets moved into a Discovery Engine data
 * store and retrieved instead of inlined.
 */

export const LINKS = {
  signup: "https://id.formaloo.com/profiles/signup/",
  login: "https://admin.formaloo.com/w",
  demo: "https://www.formaloo.com/demo",
  pricing: "https://www.formaloo.com/pricing",
  templates: "https://www.formaloo.com/templates",
  help: "https://help.formaloo.com/en/",
  enterprise: "https://www.formaloo.com/enterprise",
  concierge: "https://www.formaloo.com/concierge",
} as const

export const KNOWLEDGE = `
# WHAT FORMALOO IS

Formaloo OI (Operations Intelligence) is an agent-first operations platform
paired with a forward-deployed team. Positioning: "Collect, Understand, Act."
It covers collecting information, understanding it, and acting on it.
Formaloo is no longer positioned as just a form builder.

Proof points (only cite these, never invent numbers):
- 35,000+ teams in 100+ countries
- 4.7/5 average from 1,000+ reviews
- 1,000,000+ daily active forms and apps
- Average 19 hours/week saved per team
- EU-hosted by default; data residency, private-cloud and self-hosted options
- Designed to support GDPR, HIPAA and PCI DSS requirements

# CAPABILITIES (name these exactly; link these URLs)

- Form builder: https://www.formaloo.com/form-builder
- Client portals: https://www.formaloo.com/portals
- Custom PDF builder / SmartDocs: https://www.formaloo.com/custom-pdf-builder
- Approval workflows: https://www.formaloo.com/automate-approval-workflows
- Formaloo AI: https://www.formaloo.com/ai
- Signature forms (eSignature): https://www.formaloo.com/signature-forms
- Conditional logic / branching: https://www.formaloo.com/logical-branching
- Survey maker: https://www.formaloo.com/survey-maker
- Quiz maker: https://www.formaloo.com/quiz-maker
- Calculator builder: https://www.formaloo.com/calculator-form-builder
- Dashboard builder: https://www.formaloo.com/dashboard-creator
- Custom CRM: https://www.formaloo.com/custom-crm
- Chatbot builder: https://www.formaloo.com/chatbot-builder
- AI generator builder: https://www.formaloo.com/no-code-ai-generator-builder
- No-code app builder: https://www.formaloo.com/no-code-app-builder
- Payment / e-commerce forms: https://www.formaloo.com/payment-form
- Lead generation: https://www.formaloo.com/lead-generation
- Lead enrichment: https://www.formaloo.com/lead-enrichment
- NPS surveys: https://www.formaloo.com/nps-survey-platform
- Sales pipeline: https://www.formaloo.com/sales-pipeline
- Poll maker: https://www.formaloo.com/poll-maker
- Survey data analysis: https://www.formaloo.com/survey-data-analysis
- Self-hosted deployment: https://www.formaloo.com/self-hosted

Building blocks available inside an app: Kanban, Gallery, Table, Chart, Form,
AI analyze, Signup/Login.

# INDUSTRY SOLUTIONS

- Healthcare: https://www.formaloo.com/healthcare-workflow-automation
  HIPAA-ready. Patient intake and triage, consent and release forms with
  e-signature, referrals, staff credentialing and scheduling, auto-generated
  medical record PDFs, multi-location access controls, EHR/scheduling connections.
- Agencies: https://www.formaloo.com/agencyos
  Client onboarding and intake, creative/brand briefs, approval workflows with
  e-signature, white-labeled client portals, project scoping and proposals,
  lead qualification and CRM routing.
- Food & hospitality: https://www.formaloo.com/form-builder-for-restaurants-and-hospitality
  Reservations, orders, event bookings, guest feedback and reviews, staff health
  and safety checklists, allergen disclosure and consent, multi-location reporting.
- Education: https://www.formaloo.com/formaloo-for-education
  Enrollment and registration, quizzes and assessments, parent/guardian
  communication, staff HR and evaluation workflows, course feedback and NPS,
  scholarship and grant applications.
- HR & people: https://www.formaloo.com/formaloo-for-hr
- Operations: https://www.formaloo.com/formaloo-for-operations
- Remote teams: https://www.formaloo.com/formaloo-for-remote-working
  Async check-ins and standups, remote onboarding and equipment requests, team
  pulse surveys, cross-timezone approvals, role-based portals, Slack/email alerts.
- Events & exhibitions: https://www.formaloo.com/formaloo-solutions-for-events-exhibitions
- Startups: https://www.formaloo.com/startups
- Non-profits: https://www.formaloo.com/formaloo-for-non-profits
- Marketing suite: https://www.formaloo.com/marketing-suite
- Sales suite: https://www.formaloo.com/sales-suite
- Customer experience: https://www.formaloo.com/customer-experience
- Enterprise: https://www.formaloo.com/enterprise
  SSO/SAML 2.0 and SCIM provisioning, 15+ permission levels, sub-teams and
  multi-tenant, custom SLA and 99.9% uptime, dedicated CSM, on-premise and
  private cloud, unlimited workspaces/members/forms.

# TEMPLATE CATEGORIES

All templates: https://www.formaloo.com/templates
AI tools /templates/ai-tools · Education /templates/education ·
HR & people /templates/hr-people · Lead generation /templates/lead-generation ·
Nonprofit /templates/nonprofit · Product, design, UX /templates/product-design-ux ·
Real estate /templates/real-estate · Sales /templates/sales ·
Survey & questionnaire /templates/survey-questionnaire · Agencies /templates/agency ·
Events /templates/events · Healthcare /templates/health-wellness ·
Marketing /templates/marketing · Order & payment /templates/order-booking ·
Quizzes /templates/quizzes · Registration /templates/registration ·
Signature & legal /templates/legal · Startups /templates/startup ·
Operations /templates/operations
(Prefix each with https://www.formaloo.com)

# INTEGRATIONS

3,000+ integrations via direct connection, n8n, Zapier, Make, webhooks and API.
Named direct integrations include: Google Sheets, Outlook, Slack, Zapier,
HubSpot, Salesforce, Stripe, Airtable, Dropbox, Monday, Notion, Google Calendar,
Mailchimp, Make, Asana, Jira, Google Drive, ActiveCampaign, Calendly, Intercom.
Integrations directory: https://www.formaloo.com/category/integrations
API docs: https://help.formaloo.com/en/articles/9310643-formaloo-api-documentation

# KEY LINKS

Start free: https://id.formaloo.com/profiles/signup/
Book a demo: https://www.formaloo.com/demo
Pricing: https://www.formaloo.com/pricing
Help center: https://help.formaloo.com/en/
Concierge service: https://www.formaloo.com/concierge
Enterprise: https://www.formaloo.com/enterprise

# ROUTING GUIDANCE (form-scope router, v3 — Magic Create prompt handoff)

Route on ONE question: is this, at its core, a single form people fill out
(Path A), or a multi-role system (Path B)? Not "is this simple" — a 60-field
form with heavy branching logic is still Path A; a two-person portal is still
Path B. This reflects what Formaloo's own build tooling (Magic Create / the
OI Agent Builder) can reliably self-serve today, confirmed Sep 2026.

## Path A — reliable, self-serve today

- A form, survey, quiz, intake form, registration form, feedback form,
  application, checklist, order form, or booking request — regardless of
  size, number of fields, conditional/branching logic, scoring (personality
  quizzes, DISC-style, NPS/CSAT), or file uploads.
- One email template off that form, with answer-piping and AI-personalized
  copy.
- One generated PDF from it (result letter, ticket, summary).
- Form design/theme, AI-assisted logic ("Magic Logic"), AI-assisted design
  ("Magic Design").
- An internal, single-audience app or board (Kanban, table, chart, a
  Formaloo-native Custom CRM) that everyone who can see it sees the same way
  — no separate logins or per-role visibility.

## Path B — route to the team, don't promise these as self-serve

- A client or staff portal with per-person login and row-level data
  isolation. Confirmed unreliable as of Sep 2026: portal creation can report
  success without producing a working portal, and role/location-based access
  can be accepted without being enforced (cross-client data leaks are a live,
  confirmed issue). Never promise "clients will only see their own project"
  as something they can self-serve today.
- Automatic capacity/waitlist logic (e.g. auto-promoting the next waitlisted
  person when a spot opens) — the worst-performing case in internal testing.
- Connecting a form or workflow to an EXTERNAL third-party system (Salesforce,
  HubSpot, or any other outside system) via OAuth. No self-serve setup path
  exists yet; even where an integration is already installed, field/property
  mapping has known bugs. (This is different from Formaloo's own built-in
  Custom CRM/dashboard, which is Path A — the line is "does this need to
  authenticate against an outside system.")
- Multi-tier approval chains with escalation timers (e.g. spend-threshold
  routing, reminder-then-escalate) — partial reliability, don't promise it
  works end to end unsupervised.
- Anything needing a no-signup guest mode. Doesn't exist yet. Signup always
  comes first; there is no separate "try without an account" link to give.

If a visitor names a specific integration or portal use case, don't assume it
is fine just because it sounds simple, and don't assume it is broken just
because it sounds technical. If you are not sure which side of the line it
falls on, that uncertainty itself is a Path B signal — ask, then route to the
demo. Never invent a promise to resolve the uncertainty.
`.trim()
