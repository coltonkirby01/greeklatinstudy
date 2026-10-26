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

### Groton vocabulary and case forms

The Greek index automatically includes all vocabulary sources registered for Groton Lessons 3–14 and the Kubo list. It also uses existing Groton grammar charts to recognize source-derived noun, adjective, and verb forms. Groton Lesson 13's **ὅδε, οὗτος, ἐκεῖνος** paradigms are indexed for every singular/plural case and masculine/feminine/neuter form. Lesson 14's **ἐγώ / ἡμεῖς**, **σύ / ὑμεῖς**, and **αὐτός** charts are indexed for every listed case/number/gender, including the emphatic and enclitic oblique variants. The first- and second-person charts have English headings, so their singular and plural columns must map to separate source vocabulary headwords before indexing.

Groton's explicit Lesson 14 compound note for ἐπιπλήττω (“rebuke,” + dative) supplies a source-backed lexical form and productive regular present/imperfect inflections, including ἐπιπλήττετε. The Lesson 14 exercise spelling ἔμοιγ᾽ is indexed as the dative ἐμοί with the emphatic particle γε; it is not a new case. Do not infer unlisted irregular principal parts or obtain forms from an outside lexicon. In tests, verify every listed cell and slash alternative in the ten original Lesson 13–14 chart files rather than validating only a handful of common examples.

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

Morphology labels are expanded for readability from the abbreviations returned by Whitaker's Words. For example, `ACC S F` is displayed as `accusative · singular · feminine`, while a verb analysis can display tense, voice, mood, person, and number. Latin adjective/adverb degree markers `POS`, `COMP`, and `SUPER` appear prominently as **Positive**, **Comparative**, and **Superlative** both in the collapsed word-choice summary and the expanded *Degree of comparison* field. For example, when Whitaker labels *infirmior* `ADJ … COMP`, display **Comparative**, not just its case and gender. Derive degrees from returned morphology, falling back to raw Whitaker analyses when necessary; never infer degree merely from a Latin ending or headword. The site must not invent a grammatical analysis that is not present in the source output.

The expanded Latin dictionary choice is intentionally a compact reading aid, not a full bibliographic/debug report. Show **headword, part of speech, meaning, inflected form(s), comparison degree (when supplied), and declension/conjugation (when Whitaker explicitly supplies it)**. For example, *gustatum* as a noun with `N (4th) M` displays **4th declension**; a verb with `V (1st)` displays **1st conjugation**. Keep the class in the expanded entry only, not in the collapsed preview. Use the lexical dictionary class before falling back to matching numbered raw form analyses; never mistake the variant number for the class, conflate an unrelated supine with a noun, or guess a class from an ending. If the source does not give a reliable class, omit it.

Collapsed Latin dictionary-choice headings display up to **five English meaning words** (retaining shorter definitions as written), then the part of speech, a separately indicated comparison degree when Whitaker supplies one, and compact morphology. For noun forms (and comparable nominal adjective/pronoun forms), use **case, number, gender** in that order: `Nom/Gen/Dat/Acc/Abl/Voc` (+ `Loc` for genuine locative), then `S/P`, then `M/F/N` (`M/F` when Whitaker explicitly says common gender). For verbs use **tense, person-number, voice, mood**: e.g. `Perf 3P Act Ind` or `Impf 1S Pass Sub`. `3P` means third person plural. Source fields are humanized for the preview without inventing unsupported analyses. Show up to three distinct possible abbreviated forms in the heading, with the remaining count displayed; keep the complete set of forms in the expanded choice. Leave Greek previews unchanged.

Do not render the following in the learner dropdown: age, subject area, geography, frequency, dictionary-source bibliography, raw Whitaker code, raw dictionary entry, raw analyses, or miscellaneous dictionary details. Keep source metadata in the lookup result for parsing/diagnostics, but not visible in the normal UI. Do not duplicate the direct Whitaker word link in every expanded choice: the lookup header already links to the selected word's exact Whitaker entry. Greek source attribution remains unchanged.

## Saved vocabulary flash cards

Authenticated users can save a lookup result into a private vocabulary deck from the Translation Helper. The chooser is deliberately **lexical**, not morphological.

- Every distinct source dictionary entry/sense available for the clicked word is shown as a checkbox with its headword, definition, and source.
- Results that have the same headword, definition, and source but differ only in grammatical analysis are combined into one choice. A nominative and accusative analysis, or two tense/person analyses of the same lexical entry, must not become separate vocabulary cards.
- Genuine lexical alternatives remain separate choices. The helper does not silently pick one when the source provides more than one possible dictionary entry.
- The saved flashcard uses the source dictionary headword as the front and the selected source definition as the back. The clicked surface form is retained as metadata but is not used to create a separate inflection card.
- Vocabulary choices are stored in the authenticated user's private `translation_vocab_cards` rows and protected by row-level security.
- The Greek and Latin study apps expose these cards as a separate top-level **Translation Helper Vocab** deck. It is independently selectable, supports Forward and Reverse study, and permits exact-card selection.
- Removing a checkbox in the Translation Helper removes that lexical choice from the account's Translation Helper vocabulary deck.
- Signed-out learners can inspect the available lexical choices but must sign in to save them to the cross-device deck.

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
- The lookup panel includes the lexical vocabulary chooser whenever the source returns one or more dictionary entries.
- The Latin lookup panel prominently identifies Whitaker's Words Online. When a Latin word is selected, the header Word source link must point directly to `https://latin-words.com/word/latin/{normalized-selected-form}` (e.g. `amārent` → `/word/latin/amarent`), not the general homepage or search form. Do not duplicate the link inside every definition disclosure. Before a word is selected, do not show a misleading generic Source link.
- Latin results come only from latin-words.com and show meaning plus form analysis when available.
- Ambiguous Latin forms remain visible as multiple possible analyses, while morphology-only duplicates collapse to one vocabulary-saving choice.
- Successful Latin lookups are cached locally for seven days.
- Greek does not fall back outside Groton/Kubo.
