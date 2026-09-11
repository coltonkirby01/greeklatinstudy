# Repository editing instructions for card selectors

When adding or changing Greek or Latin cards, keep **Choose cards** concise. The hierarchy, checkbox label, count, and summary should carry the structure. Do not add prose that merely repeats those controls.

- Do not add explanatory `StudyFilterMenu` detail text unless the user explicitly requests it.
- In Greek Quick Select, **All Vocabulary** and **All Grammar** must have no hint or description text. Do not add replacement hints when later lessons are added.
- Do not add nested `FilterSection` headings/descriptions that merely repeat a parent such as `Lesson 3 > Vocabulary` or `Lesson 3 > Grammar`. Put the actual child checkboxes directly under the disclosure when no genuinely new grouping is needed.
- For Greek lessons that contain both ending-only cards and full model-word/model-verb charts, keep them under separate parent selectors named **Endings** and **Paradigms**. Ending-only cards belong under Endings; cards containing model words, model verbs, or complete article paradigms belong under Paradigms. Do not collapse these back into one generic Grammar selector.
- Apply the same sparse-selector rule to future lessons: add the necessary lesson/type controls and counts, not redundant instructional copy.
- **Saved Cards** is the intentional exception. Its checkbox hint in both Greek and Latin is exactly: `Cards you save with the card button or S shortcut are private to your account or this guest browser.`
- Preserve selector behavior, mixed/indeterminate states, saved progress, and independent lesson/deck histories while simplifying copy.
- Automatic correctness is user-progress-specific: attempts 1–3 for a card in a study mode/direction default to **Wrong**; from attempt 4 onward, use the majority result of that card's three most recent saved reviews. Never replace this with a global/shared default or merge Forward/Reverse histories.
- The **Current session** sidebar must summarize the session selected in the card-app session selector across that session's loaded Greek/Latin envelopes, independent of the currently visible card filters. Keep it aligned with the Stats page's session scope.
- Stats/session coverage is mandatory for both languages. Adding cards to an existing Greek or Latin deck automatically belongs in Stats because the full deck is analyzed. Whenever a new built-in Greek/Latin deck or study direction is added, update both `SESSION_DECKS` in `session-management.ts` and the Stats source list in `stats-page.tsx` in the same change; never ship cards that can generate reviews but are absent from Stats/session selection.
- For Greek ending-only chart audio on Eleven v3, read each chart column top-to-bottom without punctuation pauses inside the column and place exactly one `[pause]` between vertical columns.

- In Greek Lesson 4, both feminine definite-article cards (singular and plural) belong under the `Endings` selector, not `Paradigms`; `Paradigms` is reserved for the model-noun paradigm cards.
