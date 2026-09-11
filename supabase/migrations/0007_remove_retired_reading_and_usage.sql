-- Remove retired Reading/Audio and temporary ElevenLabs usage-snapshot infrastructure.
-- Both features were removed from the application; IF EXISTS keeps upgrades safe.

drop policy if exists "users read their own reading audio" on storage.objects;
drop policy if exists "users upload their own reading audio" on storage.objects;
drop policy if exists "users update their own reading audio" on storage.objects;
drop policy if exists "users delete their own reading audio" on storage.objects;

delete from storage.objects where bucket_id = 'reading-audio';
delete from storage.buckets where id = 'reading-audio';

drop table if exists public.readings cascade;
drop table if exists public.elevenlabs_usage_snapshot cascade;
