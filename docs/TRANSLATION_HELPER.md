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

Target priority is:

1. Robert J. Henle material represented in the site.
2. Moreland & Fleischer once ingested.
3. Dickinson College Commentaries Latin Core Vocabulary.
4. Online Latin Dictionary (Olivetti) as an explicit external fallback.

The current live version connects Dickinson locally and exposes Online Latin Dictionary as a fallback. Henle/Moreland form-recognition and vocabulary layers remain the next source-ingestion step.

## Form recognition

Vocabulary lookup and form recognition are separate concerns. A recognized inflected form may point to a lemma, but the displayed English definition must still come from an approved source. Do not invent a lemma or definition and present it as source-backed.

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
- If there is no approved-source match, say so. Latin may offer an explicit Online Latin Dictionary fallback. Greek does not fall back outside Groton/Kubo.
