# Medieval Latin audio pacing invariant

This file is a permanent implementation rule for all current and future Medieval Latin paradigm audio on the site.

## Required pacing

- The delivery should be **slightly brisk**, but never rushed.
- Every individual form inside a paradigm column receives the same ElevenLabs v3 `[short pause]` separator.
- The boundary between the singular column and plural column receives one longer `[pause]` separator.
- Singular forms must not be spoken faster than plural forms merely because they occur first in the request.
- Do not hand-tune only one conjugation or one card. The shared helper in `supabase/functions/course-audio/medieval-latin-ipa.ts` is the source of truth.
- All future Latin paradigm cards that use the shared helper inherit this pacing automatically.
- If future ElevenLabs models change their pause syntax, update the shared constants and regression test together; preserve the same perceptual goal: even form-to-form spacing, a slightly longer singular/plural break, and an overall pace that is a little on the faster side without sacrificing intelligibility.

## Current implementation

`MEDIEVAL_LATIN_FORM_PAUSE` is `[short pause]` and is inserted between each adjacent form in a column.

`MEDIEVAL_LATIN_COLUMN_PAUSE` is `[pause]` and is inserted between the singular and plural columns.

The regression test in `tests/medieval-latin-pronunciation.test.ts` enforces both separators and reads this policy file so future automated changes cannot silently discard the pacing rule.
