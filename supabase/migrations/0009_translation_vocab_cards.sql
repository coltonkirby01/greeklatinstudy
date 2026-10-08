-- Account-linked vocabulary cards saved from the Translation Helper.
-- Each row is one lexical dictionary choice. Morphological analyses are not
-- stored as separate cards, so inflectional ambiguity does not duplicate vocab.

create table public.translation_vocab_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null check (language in ('greek', 'latin')),
  surface_form text not null check (length(trim(surface_form)) > 0),
  headword text not null check (length(trim(headword)) > 0),
  definition text not null check (length(trim(definition)) > 0),
  source text not null check (length(trim(source)) > 0),
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, language, headword, definition, source)
);

create index translation_vocab_cards_user_language_idx
on public.translation_vocab_cards(user_id, language, updated_at desc);

alter table public.translation_vocab_cards enable row level security;

create policy "users read their own translation vocab"
on public.translation_vocab_cards for select to authenticated
using (user_id = (select auth.uid()));

create policy "users create their own translation vocab"
on public.translation_vocab_cards for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update their own translation vocab"
on public.translation_vocab_cards for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users delete their own translation vocab"
on public.translation_vocab_cards for delete to authenticated
using (user_id = (select auth.uid()));
