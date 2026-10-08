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

The first live version connects Dickinson locally and exposes Online Latin Dictionary as a fallback. Henle/Moreland form-recognition and vocabulary layers remain the next source-ingestion step.

## Form recognition

Vocabulary lookup and form recognition are separate concerns. A recognized inflected form may point to a lemma, but the displayed English definition must still come from an approved source. Do not invent a lemma or definition and present it as source-backed.

## File ingestion

Target inputs are pasted text, TXT, DOC/DOCX, PDF, and images. The source text must remain reviewable/editable before the clickable reader is generated.

The first live version supports pasted text and local TXT/MD extraction. DOC/DOCX, PDF, and image OCR remain the next extraction milestone. Binary files are not uploaded anywhere in the current version.

## UI contract

- Language is explicitly Greek or Latin.
- Source text is editable before preparation.
- Words are rendered as clickable tokens while punctuation and whitespace are preserved.
- The definition panel shows the clicked surface form, matched source headword, source definition, and source reference.
- If there is no approved-source match, say so. Latin may offer an explicit Online Latin Dictionary fallback. Greek does not fall back outside Groton/Kubo.
