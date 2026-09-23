# Formaloo OI: AI homepage prototype

Lovable-style homepage where a visitor describes a process in plain language and
the assistant either tells them how to build it in Formaloo, or routes them to
the team. Linear: [FRM-3567](https://linear.app/formaloo/issue/FRM-3567) ·
project [AI on homepage](https://linear.app/formaloo/project/ai-on-homepage-7d43ab352387).

## Run it

```bash
npm install
npm run dev
```

Without a key the app serves **scripted demo replies** and shows a "Demo mode"
badge in the conversation. The full UX is reviewable in that state.

## Wiring up Gemini

Put a key in `.env.local`:

```
GEMINI_API_KEY=AIzaSy...
```

It must be a standard Google AI Studio key, prefix `AIzaSy`, 39 characters.
Get one at https://aistudio.google.com/apikey. The key is read server-side in
`app/api/chat/route.ts` only; never expose it with a `NEXT_PUBLIC_` prefix.

Optional: `GEMINI_MODEL` (defaults to `gemini-flash-latest`).

## Live help-center search (v1 only)

Before answering, v1 searches the real, live Intercom help center
(help.formaloo.com) for the visitor's latest message and hands the top
matches to the model as part of that turn's system prompt. Deliberately not
RAG: nothing is pre-embedded or re-indexed, so an article edited five
minutes ago is already reflected, there's no staleness window to manage.

```
INTERCOM_ACCESS_TOKEN=tok:...
```

Generate one at app.intercom.com -> Settings -> Developer Hub -> your app ->
Authentication, with **Articles: Read** permission. Server-side only.
Without it, this step is skipped entirely and v1 falls straight through to
normal Path A/B routing, nothing breaks, it just can't answer "how does X
already work" questions from real docs. See `lib/intercom-search.ts` and the
"HELP CENTER GROUNDING" section of `lib/system-prompt.ts`.

Grounding applies on every turn, not only "how does X work" questions.
Build-intent messages (Path A/B) read the search results too: if a real
article is genuinely relevant (a Magic Create how-to, a matching template),
Path A's final step becomes an actual cited walkthrough instead of the
generic "sign up, paste, click Create" line. If nothing above is relevant,
it falls back to the generic line rather than inventing steps.

The search runs live, inside the response stream itself, not before it
opens, so the visitor sees it happening: `lib/parse-meta.ts` defines a
server-emitted `<<<META {...}>>>` sentinel family (separate from the
model-emitted `<<<CTA ...>>>` in `parse-cta.ts`, so the two prefixes can
never collide) for search-start / search-done / live-vs-demo-mode events.
`components/message.tsx` renders a transient status pill while it's
in flight ("Searching the help center for '...'" -> "Found N related
articles"), then a **persistent "Sources" list** of clickable link chips
once results come back, real Intercom URLs, opens in a new tab, stays for
the life of the message the same way the CTA card does (it doesn't disappear
once the reply text starts streaming in, unlike the transient pill).

## Chat log (Supabase)

Every finished turn is upserted into a `chat_logs` table, one row per
conversation (keyed by a client-generated `conversationId`, regenerated on
"Start over"). Both `/api/chat` (v1) and `/api/chat-v2` write into this same
table, tagged by a `version` column (`'v1'` or `'v2'`), so every conversation
from either backend is visible together, filterable by which one handled it.
Without the two env vars below, this silently no-ops, the chat itself is
unaffected either way.

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Get both from the Supabase dashboard: Project Settings -> API. The
service_role key bypasses RLS; `chat_logs` has RLS enabled with no policies
at all, so that key is the only way in or out of the table, the anon/
publishable key the browser could ever see has zero access to it.

Columns: `chat_log` (jsonb, the full ordered transcript), `transcript_text`
(flattened + a GIN full-text index, for search), `topic`/`description` (a
cheap `gemini-flash-lite-latest` call summarizes the use case, best-effort,
`lib/chat-log.ts`), and `outcome` — derived deterministically from the CTA
the conversation actually reached, not re-asked of the model:

| outcome | meaning |
| --- | --- |
| `signup_prompt` | Path A: got a Magic Create prompt + signup CTA |
| `demo_cta` | Path B: qualifying finished, "Book a demo" CTA shown |
| `qualifying` | Path B: mid-flow, a question was asked, no CTA yet |
| `unresolved` | still vague, or the visitor never got routed |

The migrations are at `supabase/migrations/0001_chat_logs.sql` (the base
table) and `supabase/migrations/0002_chat_logs_version.sql` (the `version`
column).

## V2: Vertex AI Agent Builder (A/B test)

`/v2` is a side-by-side comparison, same chat UI, a different backend
(`app/api/chat-v2/route.ts`), reachable from a banner on both `/` and `/v2`
linking to the other one. It reproduces a Google Agent Builder (ADK) agent
Alisina built separately: his system instruction
(`lib/vertex-agent-prompt.ts`, not sharing v1's Path A/B copy in
`lib/system-prompt.ts`), answered by `gemini-3.5-flash` on Vertex AI with the
native `google_search` and `url_context` tools standing in for his ADK
agent's two sub-agent tools.

The original instruction referenced "Path A"/"Path B" build routing without
ever defining either, so it fell back to long generic DIY walkthroughs for
every build request. `lib/vertex-agent-prompt.ts` adds an explicit "THE TWO
BUILD PATHS" section fixing that (Path A: a short Magic Create prompt, no
manual UI walkthrough; Path B: qualify one question at a time, then a demo
CTA, no DIY architecture guide) — everything else is still his original
text. It emits the same `<<<CTA ...>>>` sentinel v1 does (imported from
`lib/system-prompt.ts` so the two never drift), so it gets the same
`<CtaCard>` UI and logs into `chat_logs` the same way, tagged
`version: "v2"`.

```
VERTEX_API_KEY=AQ...
```

A **Vertex AI key**, not a Gemini Developer API key, they authenticate to
different APIs and are not interchangeable (`aiplatform.googleapis.com` vs
`generativelanguage.googleapis.com`). Without it, `/v2` responds with a plain
"not wired up" message; nothing else breaks.

Two things worth knowing if you touch this route:

- **`thinkingConfig: { thinkingBudget: 0 }` is required.** Without it,
  `gemini-3.5-flash` spends part of its output budget on hidden reasoning
  even with search tools attached, which was silently truncating replies
  mid-sentence (`finishReason: MAX_TOKENS`). Confirmed directly against the
  API before and after the fix, don't remove this thinking it's dead code.
- **Grounded replies are slow: 15-50s observed.** `maxDuration = 60` is set
  explicitly (the Vercel Hobby-plan ceiling); a slow search could still
  occasionally hit it. This is a real product tradeoff of search-grounded
  generation, not a bug to chase.

This agent's instruction has no length constraint, so it writes full
markdown (`### headings`, `---` rules) unlike v1's short-prose replies.
`components/message.tsx`'s block splitter handles headings and rules
regardless of blank-line spacing (a heading is often immediately followed
by a list). Single-asterisk italics (`*like this*`) aren't converted, a
known small rough edge, cosmetic only.

## Shape of it

| Path | What it does |
| --- | --- |
| `app/page.tsx` | Header, hero section, footer |
| `components/chat-experience.tsx` | State, streaming, hero → conversation transition |
| `components/prompt-box.tsx` | The hero input |
| `app/api/chat/route.ts` | Gemini proxy: validation, rate limit, SSE → text |
| `lib/knowledge.ts` | Curated Formaloo facts + real URLs, injected into the prompt |
| `lib/system-prompt.ts` | Voice, SIMPLE/COMPLEX routing, hard rules |
| `lib/parse-cta.ts` | Pulls the CTA sentinel out of the stream |
| `lib/demo-reply.ts` | Scripted stand-in used when no key is configured |
| `lib/nav.ts` | Header mega-menu structure and links |
| `lib/chat-log.ts` | Outcome + Gemini topic/description, Supabase upsert |
| `lib/supabase-admin.ts` | Server-only Supabase client (service_role) |
| `lib/intercom-search.ts` | Live Intercom Articles search, formatted for the prompt |
| `lib/parse-meta.ts` | Server-emitted `<<<META>>>` events: search status, live/demo mode |
| `app/v2/page.tsx` | V2 comparison page, same UI pointed at `/api/chat-v2` |
| `app/api/chat-v2/route.ts` | Vertex AI proxy for the Agent Builder comparison |
| `lib/vertex-agent-prompt.ts` | Alisina's Agent Builder instruction, verbatim |
| `components/version-banner.tsx` | The V1/V2 banner, links each page to the other |
| `components/theme-lab.tsx` | Live colour editor (see below) |
| `components/theme-toggle.tsx` | Light / dark (light is the default, no system tracking) |

### How routing works

The model classifies each request as SIMPLE (self-serve), COMPLEX (route to the
team) or VAGUE (ask one question). When it closes with a call to action it emits
a sentinel as its final line:

```
<<<CTA {"path":"simple","action":"signup","label":"Start building free","href":"..."} >>>
```

`parseCta` strips this from the visible text and renders a `CtaCard`. The parser
also hides half-arrived sentinels mid-stream, and rejects any `href` that is not
on a `formaloo.com`/`formaloo.me` host, so a prompt injection cannot turn the
CTA into an off-site link.

### Grounding

There is no RAG. `lib/knowledge.ts` is a hand-curated document built from the
live formaloo.com navigation, inlined into the system prompt (~3k tokens). The
model is instructed to use only what appears there. **If you add something
inaccurate to that file, the bot will state it confidently.** It is the single
highest-leverage file in the repo.

When the Google Cloud path in FRM-3567 lands, this file is what moves into a
Discovery Engine data store.

## Before this goes anywhere public

- [ ] **Rate limiting is in-memory** (`app/api/chat/route.ts`,
      `app/api/chat-v2/route.ts`). Resets on deploy and does not span
      instances. Needs Redis/Upstash.
- [ ] Only the hero is built. The ~11 marketing sections below the fold are not.
- [ ] `/v2` is a comparison prototype, not a decision. Nobody has chosen
      between v1's direct API calls, v2's Agent Builder reproduction, and
      FRM-3567's original heavier Google Cloud stack (Dialogflow CX,
      Discovery Engine, Cloud Run, BigQuery).
- [ ] Rotate any API key that has been pasted into Linear or a chat transcript.

## Theme lab

A live colour editor for the brand tokens, bottom-right. Edit ink, the brand
ramp and the chat surfaces with a picker or a hex field, see it apply instantly
in both themes, then **Copy CSS** to paste the result back into `globals.css`.
Changes persist in localStorage; **Reset** clears them.

It renders in `npm run dev` always, and in production **only** when the URL has
`?lab`, so visitors never see it, but you can tune colours on a deployed build
via `https://…/?lab`.

## Motion

The mark is a disc with a rounded bar in it, read as an eye. `<Logo state>`
drives it: `idle` blinks every ~6.5s, `thinking` makes the pupil scan while a
reply streams, `done` plays a one-shot squash-and-stretch when the reply lands.
Keyframes are in `app/globals.css` under Motion.

Page motion is staggered: headline, subhead, composer, chips, then the trust
row. Everything collapses to instant under `prefers-reduced-motion: reduce`.

## Design

Tokens live in `app/globals.css`. Brand ramp `#F5423C → #FA5733 → #FF7A2E`
comes from the logo lockups; the orange is used for the mark and the hero wash
only, never for buttons (CTAs are near-black, matching Formaloo's public-facing
register).

The neutrals are Linear-derived: `--ink` `#1F2023` is the working black (CTAs,
wordmark, user bubble) and `--ink-deep` `#19191C` is the dark-mode canvas. Both
themes are built from those two plus `--canvas`, so retinting the whole site
means changing three values, which is what the theme lab edits.

Type is **Plus Jakarta Sans** for display and **Inter** for body. formaloo.com
uses Gilroy + Inter, but Gilroy is commercially licensed and not on Google Fonts.
Swap `fontDisplay` in `app/layout.tsx` once the licensed webfont files exist.
