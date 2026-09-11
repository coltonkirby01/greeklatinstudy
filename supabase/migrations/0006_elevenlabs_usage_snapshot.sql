create table if not exists public.elevenlabs_usage_snapshot (
  id text primary key default 'current' check (id = 'current'),
  tier text not null default '',
  status text not null default '',
  credits_used bigint not null default 0,
  credits_limit bigint not null default 0,
  next_reset_unix bigint,
  billing_period text,
  refresh_period text,
  current_overage_amount text,
  current_overage_currency text,
  updated_at timestamptz not null default now()
);

alter table public.elevenlabs_usage_snapshot enable row level security;

revoke all on table public.elevenlabs_usage_snapshot from anon;
grant select on table public.elevenlabs_usage_snapshot to authenticated;
grant all on table public.elevenlabs_usage_snapshot to service_role;

drop policy if exists "admins read ElevenLabs usage" on public.elevenlabs_usage_snapshot;
create policy "admins read ElevenLabs usage"
on public.elevenlabs_usage_snapshot
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
