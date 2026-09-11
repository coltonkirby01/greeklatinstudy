-- Remove retired Reading/Audio database objects and the temporary ElevenLabs usage snapshot.
-- Storage bucket cleanup is performed through the Supabase Storage API because direct SQL deletion
-- from storage system tables is intentionally blocked by Supabase.

drop policy if exists "users read their own reading audio" on storage.objects;
drop policy if exists "users upload their own reading audio" on storage.objects;
drop policy if exists "users update their own reading audio" on storage.objects;
drop policy if exists "users delete their own reading audio" on storage.objects;

drop table if exists public.readings cascade;
drop table if exists public.elevenlabs_usage_snapshot cascade;
