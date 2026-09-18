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

# ROUTING GUIDANCE

Treat as SIMPLE (self-serve today):
single forms and surveys, quizzes, calculators, registration and booking flows,
payment forms, e-signature documents, PDF generation, conditional logic, a
client or team portal, a dashboard over form data, a basic CRM or pipeline,
NPS and feedback programmes, connecting to a named integration above.

Treat as COMPLEX (route to the team):
migrations off an existing system, multi-system integration where one side is
not in the integrations list, compliance-bound builds (HIPAA, SSO/SAML, SCIM,
audit logging, data residency, self-hosted), custom AI agents, enterprise-wide
rollout across many teams or locations, anything needing a bespoke SLA, and
anything you cannot map to the capabilities above.
`.trim()
