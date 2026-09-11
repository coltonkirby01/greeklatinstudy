# Repository editing instructions for card selectors

When adding or changing Greek or Latin cards, keep **Choose cards** concise. The hierarchy, checkbox label, count, and summary should carry the structure. Do not add prose that merely repeats those controls.

- Do not add explanatory `StudyFilterMenu` detail text unless the user explicitly requests it.
- In Greek Quick Select, **All Vocabulary** and **All Grammar** must have no hint or description text. Do not add replacement hints when later lessons are added.
- Do not add nested `FilterSection` headings/descriptions that merely repeat a parent such as `Lesson 3 > Vocabulary` or `Lesson 3 > Grammar`. Put the actual child checkboxes directly under the disclosure when no genuinely new grouping is needed.
- For Greek lessons that contain both ending-only cards and full model-word/model-verb charts, keep them under separate parent selectors named **Endings** and **Paradigms**. Ending-only cards belong under Endings; cards containing model words, model verbs, or complete article paradigms belong under Paradigms. Do not collapse these back into one generic Grammar selector.
- Apply the same sparse-selector rule to future lessons: add the necessary lesson/type controls and counts, not redundant instructional copy.
- **Saved Cards** is the intentional exception. Its checkbox hint in both Greek and Latin is exactly: `Cards you save with the card button or S shortcut are private to your account or this guest browser.`
- Preserve selector behavior, mixed/indeterminate states, saved progress, and independent lesson/deck histories while simplifying copy.
