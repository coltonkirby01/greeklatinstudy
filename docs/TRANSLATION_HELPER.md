# Translation Helper

The Translation Helper is a source-grounded reading aid. It is not an automatic translator and it does not generate contextual paraphrases or AI-tutor explanations.

## Learner-facing goal

A learner pastes or uploads Greek or Latin text, reviews the extracted text, and then clicks individual words. The helper shows a dictionary definition and, for Latin, the grammatical form analysis returned by the selected source.

## Source policy

### Greek

Definitions and recognized vocabulary are restricted to:

1. Anne H. Groton, *From Alpha to Omega* vocabulary already entered into the site.
2. Sakae Kubo New Testament vocabulary already entered into the site.

Do not add an outside Greek dictionary or model-generated gloss without an explicit product decision.

### Latin

The Translation Helper uses **Whitaker's Words Online at https://latin-words.com/** as its only Latin dictionary and morphology source.

Do not use Dickinson, Henle, Moreland & Fleischer, Olivetti, the previous public JSON Latin API, or any other Latin dictionary/morphology source on this page. This restriction applies only to the Translation Helper. It does not remove or alter Dickinson vocabulary or other Latin material used elsewhere in the site's flashcards.

The site's Supabase `latin-lookup` Edge Function requests the individual-word result page from latin-words.com and converts that result into a small structured response for the learner-facing panel. No Whitaker dictionary engine or bulk dictionary data is downloaded into the learner's browser.

## Latin form display

The panel should present the source output in a learner-readable order:

1. clicked surface form;
2. dictionary headword/principal parts;
3. English dictionary meaning;
4. grammatical form or possible forms.

When latin-words.com returns more than one valid analysis, the helper must preserve the ambiguity instead of choosing one. The first result is shown cleanly and additional analyses are available under an `Other possible analyses` disclosure.

Morphology labels are expanded for readability from the abbreviations returned by Whitaker's Words. For example, `ACC S F` is displayed as `accusative · singular · feminine`, while a verb analysis can display tense, voice, mood, person, and number. The site must not invent a grammatical analysis that is not present in the source output.

## File ingestion

The current Translation Helper supports pasted text plus local extraction from TXT/MD, DOCX, and text-based PDF files. Extracted text is placed in the editable review box before the learner creates the clickable reading view.

DOCX extraction uses a pinned browser build of Mammoth loaded only when a DOCX is selected. PDF extraction uses a pinned browser build of PDF.js loaded only when a PDF is selected. The file contents remain in the learner's browser; they are not uploaded to the site backend or to an AI service for extraction.

PDF extraction depends on an embedded PDF text layer. A scanned/image-only PDF will report that no embedded text was found. Image OCR and scanned-PDF OCR remain a later milestone. Older binary `.doc` files are also not supported yet; users should save them as `.docx` or PDF first.

## UI contract

- Language is explicitly Greek or Latin.
- Source text is editable before preparation.
- Uploading TXT/MD, DOCX, or a text-based PDF automatically fills the review box with extracted text.
- Extraction progress and failures are surfaced to the learner instead of failing silently.
- Words are rendered as clickable tokens while punctuation and whitespace are preserved.
- Latin results come only from latin-words.com and show meaning plus form analysis when available.
- Ambiguous Latin forms remain visible as multiple possible analyses.
- Successful Latin lookups are cached locally for seven days.
- Greek does not fall back outside Groton/Kubo.
