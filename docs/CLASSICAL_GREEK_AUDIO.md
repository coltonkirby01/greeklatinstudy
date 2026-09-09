# Classical Greek course audio

Lesson 3 grammar audio is shared course content. It is not stored in a learner's progress record and is not tied to any login.

## Pronunciation profile

The current profile is labeled:

`From Alpha to Omega — Classical Greek (segmental reconstruction; accent approximated)`

The segmental reconstruction follows the Classical pronunciation conventions used by the course: Classical vowel quality and quantity, Classical diphthongs, and Classical consonants. Eleven v3 receives IPA directly. Greek pitch accent is not claimed to be reproduced exactly; stress placement in the IPA is a practical TTS approximation and should be replaced by validated pitch-accent audio if that becomes available.

## Shared storage

Generated MP3 data is stored in `public.course_audio_assets` in Supabase. RLS allows `SELECT` for both `anon` and `authenticated`, while clients receive no write policy. This makes the same approved recording available to guests and every signed-in learner on every device.

The active asset IDs match the three Lesson 3 grammar card IDs exactly.

## ElevenLabs generation

The `course-audio` Edge Function is deliberately limited to the three hard-coded Lesson 3 assets. It does not accept arbitrary text and it does not regenerate an asset that already has stored audio, preventing ordinary calls from repeatedly consuming paid TTS credits.

Required secret:

```text
ELEVENLABS_API_KEY
```

Optional secret:

```text
ELEVENLABS_CLASSICAL_GREEK_VOICE_ID
```

If no voice ID is supplied, the function uses ElevenLabs' documented quickstart voice, George (`JBFqnCBsd6RMkjVDRZzb`). The model is fixed to `eleven_v3` and output is MP3 at `mp3_44100_128`.

Never place the ElevenLabs API key in `VITE_*`, browser code, GitHub source, or a public Supabase table. It belongs only in Supabase Edge Function secrets.

## Regeneration

Stored audio is treated as approved course content. To change pronunciation or voice, review the new IPA/voice first, then intentionally remove or version the affected shared asset before invoking the generator again. Do not add a public `force` switch to the Edge Function.
