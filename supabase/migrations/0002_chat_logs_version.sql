-- Which chat backend produced this conversation: v1 (lib/system-prompt.ts,
-- Gemini Developer API, Intercom-grounded) or v2 (lib/vertex-agent-prompt.ts,
-- Vertex AI, Google Search + URL Context grounded). Both now upsert into the
-- same chat_logs table so every conversation is visible in one place,
-- filterable by which backend handled it.

alter table public.chat_logs
  add column if not exists version text not null default 'v1'
    check (version in ('v1', 'v2'));

create index if not exists chat_logs_version_idx on public.chat_logs (version);
