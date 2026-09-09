alter table public.course_audio_assets
  add column if not exists storage_path text;

comment on column public.course_audio_assets.storage_path is
  'Content-addressed path in the public course-audio Storage bucket; preferred over legacy inline base64 for fast CDN playback.';
