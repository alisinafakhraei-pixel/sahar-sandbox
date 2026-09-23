-- Chat log for the homepage assistant.
--
-- One row per conversation, upserted after every assistant turn (so the row
-- always reflects the fullest known state; there is no separate "finished"
-- event to wait for). Written only by the server's service-role key —
-- RLS is enabled with no policies, so the anon/publishable key that the
-- browser could ever see has zero access to this table by design.

create table if not exists public.chat_logs (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Full ordered transcript: [{ "role": "user" | "model", "text": "..." }]
  chat_log        jsonb not null default '[]'::jsonb,
  message_count   int not null default 0,

  -- Flattened copy of chat_log for full-text search (see the GIN index below).
  transcript_text text,

  -- Gemini-generated use-case summary, best-effort (may be null if the
  -- classification call failed or no API key was configured).
  topic           text,
  description     text,

  -- Deterministic, derived from the CTA the conversation actually reached:
  --   signup_prompt — Path A: visitor got a Magic Create prompt + signup CTA
  --   demo_cta      — Path B: qualifying finished, "Book a demo" CTA shown
  --   qualifying    — Path B: mid-flow, a qualifying question was asked, no CTA yet
  --   unresolved    — still vague, or the visitor never got a routed answer
  outcome         text not null default 'unresolved'
                    check (outcome in ('signup_prompt', 'demo_cta', 'qualifying', 'unresolved')),

  cta_href        text,
  model           text,
  source          text not null default 'homepage'
);

create index if not exists chat_logs_created_at_idx on public.chat_logs (created_at desc);
create index if not exists chat_logs_outcome_idx on public.chat_logs (outcome);
create index if not exists chat_logs_transcript_search_idx
  on public.chat_logs using gin (to_tsvector('english', coalesce(transcript_text, '')));

create or replace function public.set_chat_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_logs_set_updated_at on public.chat_logs;
create trigger chat_logs_set_updated_at
  before update on public.chat_logs
  for each row
  execute function public.set_chat_logs_updated_at();

alter table public.chat_logs enable row level security;
-- No policies: anon/authenticated get zero access. Only the service_role
-- key (server-side only, never sent to the browser) can read or write.
