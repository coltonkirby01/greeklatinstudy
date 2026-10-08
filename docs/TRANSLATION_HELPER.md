# Translation Helper

The Translation Helper is a source-grounded reading aid, not an automatic translator and not an AI tutor.

## Learner-facing goal

A learner pastes or uploads Greek or Latin text, reviews the extracted text, and then clicks individual words. The helper shows a dictionary definition for the clicked word. It must not silently generate a sentence translation, contextual paraphrase, grammar explanation, or invented dictionary entry.

## Source policy

### Greek

Definitions and recognized vocabulary are restricted to:

1. Anne H. Groton, *From Alpha to Omega* (course vocabulary and forms already entered into the site)
2. Sakae Kubo, New Testament vocabulary currently loaded into the site

Do not add an outside Greek dictionary or model-generated gloss without an explicit product decision.

### Latin

Target priority is:

1. Robert J. Henle, *Latin Grammar* / Henle course material already represented in the site
2. Moreland & Fleischer (source ingestion pending)
3. Dickinson College Commentaries Latin Core Vocabulary
4. Online Latin Dictionary (Olivetti) as an external fallback

Definitions shown in the app must remain traceable to one of these sources. The current foundation build connects the existing Dickinson deck locally and exposes Olivetti as an explicit fallback link; Henle-form and Moreland & Fleischer lookup layers are the next source-ingestion step.

## Form recognition

Vocabulary lookup and form recognition are separate concerns. A recognized inflected form may point to a lemma, but the displayed English definition must still come from an approved dictionary/course source. Do not use a language model to invent a lemma or definition and present it as source-backed.

The intended form layers are:

- Latin: Henle and Moreland & Fleischer forms first; source-backed vocabulary from Henle/Moreland & Fleischer/Dickinson/Olivetti.
- Greek: Groton forms and Groton/Kubo vocabulary only for now.

## File ingestion

Target inputs are pasted text, TXT, DOC/DOCX, PDF, and images. The source text must be reviewable/editable before the clickable reader is generated. OCR or document extraction may use a separate extraction service later, but extraction output is not a dictionary source.

The first foundation build intentionally extracts plain-text files locally and does not upload binary DOC/DOCX, PDF, or image files anywhere yet. Those formats are accepted by the UI only to establish the workflow and will be connected after the extraction path is selected and tested.

## UI contract

- Language is explicitly Greek or Latin.
- Source text is editable before preparation.
- Words are rendered as clickable tokens while punctuation and whitespace are preserved.
- The definition panel shows the clicked surface form, the matched source headword, the source definition, and the source/source reference.
- If there is no approved-source match, say so. For Latin, an explicit Olivetti lookup link may be offered; for Greek, do not fall back outside Groton/Kubo.
