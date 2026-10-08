-- Save Translation Helper source text to authenticated users' cloud accounts.

create table public.translation_texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  language text not null check (language in ('latin', 'greek')),
  content text not null check (length(trim(content)) > 0),
  source_filename text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index translation_texts_user_updated_idx
on public.translation_texts(user_id, updated_at desc);

alter table public.translation_texts enable row level security;

create policy "users read their own translation texts"
on public.translation_texts for select to authenticated
using (user_id = (select auth.uid()));

create policy "users create their own translation texts"
on public.translation_texts for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update their own translation texts"
on public.translation_texts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users delete their own translation texts"
on public.translation_texts for delete to authenticated
using (user_id = (select auth.uid()));
