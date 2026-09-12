# Greek card orthography and pronunciation

## Display invariant

Greek study cards must show the specific accent supplied by the authoritative course source on the card itself. Acute, grave, and circumflex are not interchangeable and must not be replaced by an unspecified accent mark.

For Groton-based cards, *From Alpha to Omega* is authoritative for the printed form. Do not infer a grave from a general rule when the referenced Groton entry prints an acute, and do not replace a Groton grave with an acute. The source decides **which accent** belongs on the form.

`normalizeGreekDisplayAccents()` is deliberately narrower than an accent engine. It converts modern Greek tonos encodings to the corresponding polytonic acute/oxia encoding so the acute renders directionally. It preserves existing grave and circumflex marks. It must never be used to decide whether a source form should be acute or grave.

All Greek flashcard surfaces use Noto Serif through `public/greek-font.css`. New Greek card views should reuse the existing `greek-front`, `greek-script`, `greek-answer-title`, `greek-answer-copy`, or `priority-script` classes rather than introducing an unrelated font.

Cloud/admin Greek cards are normalized in `src/features/decks/deck-service.ts` when imported or saved. This applies to front/back text, reverse prompts, notes, and nested metadata such as grammar-chart cells and `pronunciationText`. Existing cloud Greek cards are also normalized when read for study. CSV, XLSX, JSON, and manual editor workflows therefore share the same display rule.

## Pronunciation pipeline

The displayed Greek spelling is also the default pronunciation source. A cloud card may explicitly override this with metadata `pronunciationText`; grammar charts use their chart cells as the pronunciation source. Pronunciation overrides are for pronunciation only and must not silently change the visible lexical identity of the card.

The audio function creates two representations:

1. **Canonical Classical Attic IPA.** `greekToClassicalIpa()` preserves reconstructed pitch-accent information. Acute is represented as an upward pitch mark, grave as a downward/no-upward distinction, and circumflex as a rise-fall over the relevant morae.
2. **ElevenLabs synthesis input.** `greekToElevenLabsIpa()` uses a controlled approximation because ElevenLabs does not expose deterministic Ancient-Greek pitch-accent control. In multisyllabic forms, acute/circumflex are approximated with stress; grave is deliberately left unstressed. This audio is therefore an approximation of reconstructed pitch accent, not a claim that stress and pitch accent are identical.

Generated audio is stored in Supabase. The stored `source_note` includes the pronunciation system, canonical IPA, and ElevenLabs input. If the source/pronunciation signature is unchanged, the existing shared asset is reused. If a published cloud card is edited so that its pronunciation source changes, the audio function detects the changed signature and generates a replacement asset.

## Adding future Greek cards

When adding a card:

1. Copy the Greek form exactly from the cited source, including acute/grave/circumflex, breathings, quantity marks, and iota subscripts where supplied.
2. Keep that exact form on the question side when Greek is the prompt.
3. Do not add an answer-side explanation of the accent unless the card is specifically an accent-rule teaching card.
4. Use the existing Greek study classes so Noto Serif renders the accent direction clearly.
5. For cloud/admin cards, use the normal import/editor path; it automatically normalizes ambiguous tonos encoding without changing the selected accent type.
6. Run the test suite. `tests/greek-orthography-invariant.test.ts` protects the normalization and font requirements, while source-specific tests protect known Groton forms.
