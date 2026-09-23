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

## Chat log (Supabase)

Every finished turn is upserted into a `chat_logs` table, one row per
conversation (keyed by a client-generated `conversationId`, regenerated on
"Start over"). Without the two env vars below, this silently no-ops, the
chat itself is unaffected either way.

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

The migration is at `supabase/migrations/0001_chat_logs.sql`.

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

- [ ] **Rate limiting is in-memory** (`app/api/chat/route.ts`). Resets on deploy
      and does not span instances. Needs Redis/Upstash.
- [ ] No conversation logging yet. That is the next milestone, along with email
      capture on the complex path.
- [ ] Only the hero is built. The ~11 marketing sections below the fold are not.
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
