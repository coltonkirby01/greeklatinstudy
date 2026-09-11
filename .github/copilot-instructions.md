# Greek & Latin Study — repository editing instructions

Read `AGENTS.md` and `docs/MAINTENANCE.md` before nontrivial work. Preserve existing user progress, session history, authentication, audio cache behavior, deployment workflows, source data, and mobile behavior unless the user explicitly asks to change them.

## Clean first-pass rule

- Make the smallest coherent change and remove temporary patch files/workflows before merge.
- Do not leave dead imports, retired UI, duplicate registries, temporary tables/functions, commented-out implementations, backup copies, or one-off scripts in the production tree.
- Reuse shared study components and registries instead of creating a second list or parallel implementation.
- Run `npm run maintain:check` before finalizing every nontrivial change. CI runs it too and must remain green.
- Run the full tests and production Pages build; do not raise bundle budgets to make a change pass.
- Before deleting something that looks unused, prove it is not part of persistence migration, source protection, auth/RLS, deployment, audio caching, or future deck administration.

## Weekly card additions

- Assume new cards will be added regularly. Prefer data-driven updates that require changing source/card data only.
- Adding cards to an **existing registered built-in deck** must automatically flow into Stats, permanent Learner/Reviewer sessions, cloud progress, saved-card handling, and Select all/Deselect all behavior without adding another hand-maintained deck list.
- Keep stable deck IDs and stable existing card IDs. Give every new card a stable unique ID before release so old cloud progress remains attached.
- `src/features/study/builtin-study-catalog.ts` is the canonical registry for active built-in Greek/Latin decks, Stats modes, and session coverage. Do not create a parallel registry.
- A genuinely **new deck or new study direction** must be registered in `BUILTIN_STUDY_DECKS` in the same change that exposes it in the UI. The catalog regression test must pass before merge.
- If a weekly addition introduces a new filter category/lesson, update the language selector hierarchy so Select all includes it and existing saved filter preferences degrade safely. Never make new cards invisible only because an old explicit selector array was not extended.
- Update protected source-count tests only when the source was intentionally expanded. Never regenerate authoritative Greek/Latin/Henle source data from model memory.

## Built-in cards and Stats/session coverage

- `src/features/study/builtin-study-catalog.ts` is the canonical registry for active built-in Greek/Latin decks, their Stats modes, and session coverage.
- Adding cards to an existing registered deck automatically belongs in Stats because Stats loads the complete registered deck. Do not maintain a separate Account-page deck list.
- Preserve stable deck/card IDs when expanding source material so existing cloud progress remains attached.
- Greek Lesson 3 has three ending cards plus three παιδεύω paradigm cards. Greek Lesson 4 has two first-declension ending cards, four model-noun paradigms, and two feminine definite-article cards.
- In Lesson 4, both feminine definite-article cards belong under **Endings**. **Paradigms** contains the four model-noun paradigms.

## Choose cards

- Both Greek and Latin Choose cards menus must retain top-level **Select all** and **Deselect all** actions.
- Keep selectors concise; hierarchy, checkbox labels, counts, and summaries carry the structure.
- Parent checkbox selection and disclosure expansion are independent. Mixed states must remain correct.
- Filter changes narrow the pool only; never delete progress for deselected cards.
- Saved Cards is the one selector that may carry its explanatory hint.

## Sessions

- Every language always exposes two permanent built-in session types: **Learner** and **Reviewer**. Their IDs are deterministic in `session-management.ts`, so they exist for old and new users without provisioning rows.
- Learner/Reviewer cannot be renamed or deleted. Custom sessions remain renameable/deletable and preserve long-term adaptive evidence when removed from Stats.
- Stats must show Learner and Reviewer as selectable session scopes even before they have reviews.

## Study controls and grading

- Space = reveal before answer; Save & Next after reveal.
- F = flip question/answer after reveal.
- Enter = toggle Right/Wrong after reveal. R/W are intentionally unassigned.
- 1/2/3 = Easy/Medium/Hard. S = save/unsave a card. A = Greek audio.
- Shift+Enter is unassigned.
- Automatic correctness is per card + study mode/direction: attempts 1–3 default Wrong; from attempt 4 onward use the majority of the three most recent saved results. Difficulty remains time-based (<3s Easy, <10s Medium, otherwise Hard).
- Back truly undoes/replaces the prior grade; Skip records no grade.

## Greek audio

- Playback uses cached Supabase Storage audio when available; replaying cached audio must not spend ElevenLabs generation credits.
- For ending-only chart audio, read each vertical column continuously and put exactly one `[pause]` between columns.
- Keep ElevenLabs API keys server-side only.

## Removed features

- Do not reintroduce Reading/Audio, progress-file backup/import, or the ElevenLabs usage-snapshot/admin panel unless the user explicitly requests a new implementation.
