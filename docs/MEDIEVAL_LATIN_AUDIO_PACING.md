# Medieval Latin audio pacing invariant

This file is a permanent implementation rule for all current and future Medieval Latin paradigm audio on the site.

## Required pacing

- The delivery should be **slightly brisk**, but never rushed.
- Do **not** use Eleven v3 `[short pause]` between ordinary forms inside a paradigm column. The current recordings showed that this pause is slightly too long.
- The singular/plural boundary may retain one visibly longer break.
- Singular forms must not be spoken faster than plural forms merely because they occur first in the request.
- Do not hand-tune only one conjugation or one card. Shared code must govern every paradigm.

## Required production method for future generation

Future Latin paradigm audio must **synthesize each form independently** rather than asking Eleven v3 to read all six repetitive forms in one TTS request.

Reason: the first full generation showed that Eleven v3 can compress or elide repeated stems in a paradigm, especially in first- and second-person plural forms. For example, the stored IPA for `laudāmur` and `laudāminī` contains the complete `laud-` stem, but the generated audio may omit most of that stem when the forms are embedded in a repetitive six-form IPA sequence. This is a model-delivery artifact, not a morphology or IPA-data error.

Each form therefore needs its own cached synthesis unit so the complete stem and every syllable are present in the TTS request. The site should then sequence the six cached form clips in this order:

1. first-person singular
2. second-person singular
3. third-person singular
4. first-person plural
5. second-person plural
6. third-person plural

The player, not ElevenLabs, should control the gaps between these cached clips. Keep the within-column gap short and even, with a slightly longer gap after the third-person singular before the plural column begins. This architecture has an important maintenance benefit: playback spacing can later be shortened or lengthened without regenerating any ElevenLabs audio or spending additional credits.

## Monolithic fallback

`supabase/functions/course-audio/medieval-latin-ipa.ts` retains a monolithic fallback representation for compatibility with the 36 already-cached paradigm recordings. In that fallback only:

- `MEDIEVAL_LATIN_FORM_SEPARATOR` is a comma, giving a shorter natural beat than `[short pause]`.
- `MEDIEVAL_LATIN_COLUMN_PAUSE` is `[pause]` between singular and plural.

Do not use that monolithic fallback for a new full production generation when segmented per-form synthesis is available.

## Future cards and automated coding agents

All future Latin paradigm cards must inherit this policy. A bot adding or regenerating paradigm audio must not revert to one six-form ElevenLabs request merely because it is simpler. Preserve full stems and syllables first; pacing is then controlled in the player.

Before spending credits on a large regeneration, test at least one passive paradigm containing `-mur` and `-minī` forms and one active paradigm containing first- and second-person plural forms. Confirm that every stem is audible in full.

The regression test in `tests/medieval-latin-pronunciation.test.ts` enforces the short fallback separator, preserves the complete IPA for representative plural forms, and requires this segmented-production policy to remain documented.
