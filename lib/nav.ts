/** Header navigation, mirroring the live formaloo.com menus. */

export type NavLink = { label: string; href: string; description?: string }
export type NavGroup = { heading: string; links: NavLink[] }
export type NavItem =
  | { label: string; href: string; groups?: never; featured?: never }
  | { label: string; href?: string; groups: NavGroup[]; featured?: NavLink }

const F = "https://www.formaloo.com"

export const NAV: NavItem[] = [
  {
    label: "Products",
    groups: [
      {
        heading: "Build",
        links: [
          { label: "Form builder", href: `${F}/form-builder` },
          { label: "Survey maker", href: `${F}/survey-maker` },
          { label: "Quiz maker", href: `${F}/quiz-maker` },
          { label: "Calculator builder", href: `${F}/calculator-form-builder` },
          { label: "Conditional logic", href: `${F}/logical-branching` },
          { label: "No-code app builder", href: `${F}/no-code-app-builder` },
        ],
      },
      {
        heading: "Automate",
        links: [
          { label: "Approval workflows", href: `${F}/automate-approval-workflows` },
          { label: "Signature forms", href: `${F}/signature-forms` },
          { label: "Custom PDF builder", href: `${F}/custom-pdf-builder` },
          { label: "Client portals", href: `${F}/portals` },
          { label: "Custom CRM", href: `${F}/custom-crm` },
          { label: "Dashboard builder", href: `${F}/dashboard-creator` },
        ],
      },
      {
        heading: "Intelligence",
        links: [
          { label: "Formaloo AI", href: `${F}/ai` },
          { label: "AI generator builder", href: `${F}/no-code-ai-generator-builder` },
          { label: "Chatbot builder", href: `${F}/chatbot-builder` },
          { label: "Survey data analysis", href: `${F}/survey-data-analysis` },
          { label: "Lead enrichment", href: `${F}/lead-enrichment` },
          { label: "Integrations", href: `${F}/category/integrations` },
        ],
      },
    ],
    featured: {
      label: "We're no longer a form builder: Introducing Formaloo OI",
      href: `${F}/blog/introducing-formaloo-oi`,
      description: "The intelligence layer that runs your entire operation.",
    },
  },
  {
    label: "Solutions",
    groups: [
      {
        heading: "By industry",
        links: [
          { label: "Healthcare", href: `${F}/healthcare-workflow-automation` },
          { label: "Agencies", href: `${F}/agencyos` },
          { label: "Food & hospitality", href: `${F}/form-builder-for-restaurants-and-hospitality` },
          { label: "Education", href: `${F}/formaloo-for-education` },
          { label: "Events & exhibitions", href: `${F}/formaloo-solutions-for-events-exhibitions` },
          { label: "Non-profits", href: `${F}/formaloo-for-non-profits` },
        ],
      },
      {
        heading: "By team",
        links: [
          { label: "HR & people", href: `${F}/formaloo-for-hr` },
          { label: "Operations", href: `${F}/formaloo-for-operations` },
          { label: "Marketing suite", href: `${F}/marketing-suite` },
          { label: "Sales suite", href: `${F}/sales-suite` },
          { label: "Remote teams", href: `${F}/formaloo-for-remote-working` },
          { label: "Startups", href: `${F}/startups` },
        ],
      },
      {
        heading: "Popular",
        links: [
          { label: "Lead generation", href: `${F}/lead-generation` },
          { label: "NPS surveys", href: `${F}/nps-survey-platform` },
          { label: "Customer experience", href: `${F}/customer-experience` },
          { label: "Sales pipeline", href: `${F}/sales-pipeline` },
          { label: "Payments & e-commerce", href: `${F}/payment-form` },
          { label: "Self-hosted", href: `${F}/self-hosted` },
        ],
      },
    ],
  },
  {
    label: "Templates",
    href: `${F}/templates`,
    groups: [
      {
        heading: "Business",
        links: [
          { label: "Lead generation", href: `${F}/templates/lead-generation` },
          { label: "Sales", href: `${F}/templates/sales` },
          { label: "Marketing", href: `${F}/templates/marketing` },
          { label: "Agencies", href: `${F}/templates/agency` },
          { label: "Startups", href: `${F}/templates/startup` },
          { label: "Operations", href: `${F}/templates/operations` },
        ],
      },
      {
        heading: "Sector",
        links: [
          { label: "Healthcare", href: `${F}/templates/health-wellness` },
          { label: "Education", href: `${F}/templates/education` },
          { label: "Real estate", href: `${F}/templates/real-estate` },
          { label: "Nonprofit", href: `${F}/templates/nonprofit` },
          { label: "Events", href: `${F}/templates/events` },
          { label: "HR & people", href: `${F}/templates/hr-people` },
        ],
      },
      {
        heading: "By type",
        links: [
          { label: "AI tools", href: `${F}/templates/ai-tools` },
          { label: "Survey & questionnaire", href: `${F}/templates/survey-questionnaire` },
          { label: "Quizzes", href: `${F}/templates/quizzes` },
          { label: "Registration", href: `${F}/templates/registration` },
          { label: "Order & payment", href: `${F}/templates/order-booking` },
          { label: "Signature & legal", href: `${F}/templates/legal` },
        ],
      },
    ],
    featured: {
      label: "Browse all templates",
      href: `${F}/templates`,
      description: "Ready-to-use free templates across 18 categories.",
    },
  },
  {
    label: "Resources",
    groups: [
      {
        heading: "Learn",
        links: [
          { label: "Blog", href: `${F}/blog` },
          { label: "Webinars", href: `${F}/webinars` },
          { label: "Case studies", href: `${F}/category/case-studies` },
          { label: "Tutorial videos", href: "https://www.youtube.com/@Formaloo" },
        ],
      },
      {
        heading: "Support",
        links: [
          { label: "Help center", href: "https://help.formaloo.com/en/" },
          { label: "Concierge service", href: `${F}/concierge` },
          { label: "Product updates", href: `${F}/changelog` },
          { label: "Status", href: "https://status.formaloo.com/" },
        ],
      },
      {
        heading: "Developers",
        links: [
          { label: "API docs", href: "https://help.formaloo.com/en/articles/9310643-formaloo-api-documentation" },
          { label: "For developers", href: "https://help.formaloo.com/en/collections/3330828-for-developers" },
          { label: "Integrations", href: `${F}/category/integrations` },
          { label: "Security", href: `${F}/security-privacy` },
        ],
      },
    ],
  },
  { label: "Enterprise", href: `${F}/enterprise` },
  { label: "Pricing", href: `${F}/pricing` },
]
