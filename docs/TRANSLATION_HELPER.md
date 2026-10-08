# Translation Helper

The Translation Helper is a source-grounded reading aid. It is not an automatic translator and it does not generate contextual paraphrases or AI-tutor explanations.

## Learner-facing goal

A learner pastes or uploads Greek or Latin text, reviews the extracted text, and then reads from a large clickable passage. Clicking a word opens its dictionary information in a dedicated lookup panel. Latin also shows the grammatical form analysis returned by the selected source.

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

The lookup panel presents the source output in a learner-readable order:

1. clicked surface form;
2. dictionary headword/principal parts;
3. English dictionary meaning;
4. grammatical form or possible forms.

When latin-words.com returns more than one valid analysis, the helper must preserve the ambiguity instead of choosing one. The first result is shown cleanly and additional analyses are available under an `Other possible analyses` disclosure.

Morphology labels are expanded for readability from the abbreviations returned by Whitaker's Words. For example, `ACC S F` is displayed as `accusative · singular · feminine`, while a verb analysis can display tense, voice, mood, person, and number. The site must not invent a grammatical analysis that is not present in the source output.

## File ingestion

The current Translation Helper supports pasted text plus local extraction from TXT/MD, DOCX, and text-based PDF files. Extracted text is placed in the editable review box before the learner creates the clickable reading view.

DOCX extraction uses a pinned browser build of Mammoth loaded only when a DOCX is selected. PDF extraction uses a pinned browser build of PDF.js loaded only when a PDF is selected. Extraction itself happens in the learner's browser and is not sent to an AI service.

PDF extraction depends on an embedded PDF text layer. A scanned/image-only PDF will report that no embedded text was found. Image OCR and scanned-PDF OCR remain a later milestone. Older binary `.doc` files are also not supported yet; users should save them as `.docx` or PDF first.

## Cloud text persistence

Authenticated users have a private `translation_texts` collection in Supabase. Row-level security limits select, insert, update, and delete operations to the authenticated user's own rows.

- After a supported file is extracted, its **extracted text** is automatically saved to the signed-in user's cloud account. The original PDF/DOCX/TXT file bytes are not copied to cloud storage by this feature.
- The saved record includes a user-editable title, language, extracted/edited text, source filename when available, and timestamps.
- Creating or updating the reading text updates the same cloud record, so corrections made in the review box persist.
- A signed-in user's `Saved texts` disclosure lists recent texts and lets the learner reopen them on another device or delete them.
- Pasted text is saved when a signed-in learner creates the reading text. Signed-out learners can still use the Translation Helper, but their text is not written to a cloud account.
- Cloud errors must never discard the locally extracted or edited text; the reading workflow remains usable and the failure is shown to the learner.

## UI contract

- The clickable reading text is the dominant visual element after a passage is prepared.
- The text/upload editor is compact and collapsible. It starts open and automatically collapses after the learner creates or updates the reading text.
- The collapsed editor remains available as a small `Text & upload` control, and an `Edit source` action is available beside the reading text.
- Language is explicitly Greek or Latin.
- Source text and title are editable before preparation.
- Uploading TXT/MD, DOCX, or a text-based PDF automatically fills the review box with extracted text.
- Signed-in uploads automatically create a private cloud text; subsequent edits update it.
- The editor shows cloud state clearly and provides a `Saved texts` library for authenticated users.
- Extraction and cloud-save progress or failures are surfaced instead of failing silently.
- Words are rendered as clickable tokens while punctuation and whitespace are preserved.
- The lookup panel remains visible beside the text on desktop and below it on narrow screens.
- The Latin lookup panel prominently identifies Whitaker's Words Online and links to latin-words.com.
- Latin results come only from latin-words.com and show meaning plus form analysis when available.
- Ambiguous Latin forms remain visible as multiple possible analyses.
- Successful Latin lookups are cached locally for seven days.
- Greek does not fall back outside Groton/Kubo.
