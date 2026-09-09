create table if not exists public.course_audio_assets (
  id text primary key,
  mime_type text not null check (mime_type like 'audio/%'),
  audio_base64 text not null default '',
  pronunciation_system text not null,
  engine text not null,
  source_note text,
  duration_ms integer check (duration_ms is null or duration_ms > 0),
  sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_audio_assets enable row level security;

drop policy if exists "course audio is readable by everyone" on public.course_audio_assets;
create policy "course audio is readable by everyone"
on public.course_audio_assets
for select
to anon, authenticated
using (true);

comment on table public.course_audio_assets is
  'Shared, immutable-by-clients course audio. Audio is generated server-side and readable by every guest or authenticated learner.';
