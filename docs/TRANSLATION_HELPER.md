# Translation Helper

The Translation Helper is a source-grounded reading aid. It is not an automatic translator and it does not generate contextual paraphrases or AI-tutor explanations.

## Learner-facing goal

A learner pastes or uploads Greek or Latin text, reviews the extracted text, and then clicks individual words. The helper shows a dictionary definition for the clicked word.

## Source policy

### Greek

Definitions and recognized vocabulary are restricted to:

1. Anne H. Groton, *From Alpha to Omega* vocabulary already entered into the site.
2. Sakae Kubo New Testament vocabulary already entered into the site.

Do not add an outside Greek dictionary or model-generated gloss without an explicit product decision.

### Latin

Target course-source priority remains:

1. Robert J. Henle material represented in the site.
2. Moreland & Fleischer once ingested.
3. Dickinson College Commentaries Latin Core Vocabulary.

Direct Dickinson headword matches are checked first. If the clicked surface form is not a direct Dickinson entry, the helper uses a server-backed Whitaker's Words lookup through the site's Supabase `latin-lookup` Edge Function. The Edge Function calls a public JSON Whitaker API and returns only normalized headword/definition records to the site. This avoids loading third-party executable JavaScript and multi-megabyte dictionary files in every user's browser.

The browser keeps a seven-day cache of successful fallback lookups. If the Supabase lookup is temporarily unavailable, the client may try the same public JSON provider directly. The previous architecture that dynamically imported Whitaker's Words from third-party CDNs and downloaded its raw data files at runtime is intentionally retired.

Online Latin Dictionary (Olivetti) remains an optional external reference only. Do not scrape, mirror, proxy, or republish its dictionary entries inside the site without permission. Its published terms restrict reproduction/publication of the service on third-party sites, so the Translation Helper must not present copied Olivetti entries as an in-app dictionary.

## Form recognition

Vocabulary lookup and form recognition are separate concerns. A recognized inflected form may point to a lemma, but the displayed English definition must still come from an approved/source-identified dictionary layer. Do not invent a lemma or definition and present it as source-backed.

The Whitaker fallback handles the common reading case in which the passage contains an inflected form rather than a dictionary headword. The learner-facing panel still shows dictionary information rather than a contextual sentence translation.

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
- The definition panel shows the clicked surface form, matched source headword, source definition, and source reference.
- Latin checks Dickinson first and then the server-backed Whitaker lookup when the clicked surface form is not a direct Dickinson headword.
- Successful fallback lookups are cached locally for seven days.
- The client must not dynamically import a Latin dictionary engine or download raw Whitaker dictionary files at runtime.
- If neither Dickinson nor Whitaker matches, the page may offer Online Latin Dictionary as an optional external reference.
- Greek does not fall back outside Groton/Kubo.
