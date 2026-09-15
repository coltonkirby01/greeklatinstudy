# Greek & Latin Study — repository editing instructions

Read `AGENTS.md` and `docs/MAINTENANCE.md` before nontrivial work. Preserve existing user progress, session history, authentication, audio cache behavior, deployment workflows, source data, and mobile behavior unless the user explicitly asks to change them.

## Clean first-pass rule

- Make the smallest coherent change and remove temporary patch files/workflows before merge.
- Do not leave dead imports, retired UI, duplicate registries, temporary tables/functions, commented-out implementations, backup copies, or one-off scripts in the production tree.
- Reuse shared study components and registries instead of creating a second list or parallel implementation.
- Run `npm run maintain:check` before finalizing every nontrivial change. CI runs it too and must remain green.
- Run the full tests and production Pages build; do not raise bundle budgets to make a change pass.
- Before deleting something that looks unused, prove it is not part of persistence migration, source protection, auth/RLS, deployment, audio caching, or future deck administration.

## User-facing behavior guide

- `src/pages/how-site-works.tsx` is the canonical learner-facing explanation of consequential site behavior and appears on the Home page directly above the progress/cloud-sync callout.
- Any change to Adaptive/Sequential/Shuffle selection, first-pass coverage, grading defaults, timing, keyboard controls, session behavior, page-visit Progress, staged unlocking, cloud-sync behavior, pronunciation/audio behavior, or other learner-visible study mechanics MUST update this guide in the same change when the explanation is affected.
- Prefer importing shared implementation constants into the guide instead of duplicating numeric values. Keep the guide useful to learners; do not fill it with implementation trivia.
- Tests should protect important examples and invariants described in the guide, including the 125% Adaptive initial-coverage rule.

## Weekly card additions

- Assume new cards will be added regularly. Prefer data-driven updates that require changing source/card data only.
- Adding cards to an **existing registered built-in deck** must automatically flow into Stats, permanent Learner/Reviewer sessions, cloud progress, saved-card handling, Select all/Deselect all behavior, exact-card selection, Shuffle, and the shared answer-side **Deselect card** control without adding another hand-maintained deck list or card-specific button.
- Keep stable deck IDs and stable existing card IDs. Give each new card a stable unique ID before release so old cloud progress remains attached.
- `src/features/study/builtin-study-catalog.ts` is the canonical registry for active built-in Greek/Latin decks, Stats modes, and session coverage. Do not create a parallel registry.
- A genuinely **new deck or new study direction** must be registered in `BUILTIN_STUDY_DECKS` in the same change that exposes it in the UI. The catalog regression test must pass before merge.
- If a weekly addition introduces a new filter category/lesson, update the language selector hierarchy so Select all/Deselect all and saved filter preferences handle it safely. Never make new cards invisible only because an old explicit selector array was not extended.
- Update protected source-count tests only when the source was intentionally expanded. Never regenerate authoritative Greek/Latin/Henle source data from model memory.

## Built-in cards and Stats/session coverage

- `src/features/study/builtin-study-catalog.ts` is the canonical registry for active built-in Greek/Latin decks, their Stats modes, and session coverage.
- Adding cards to an existing registered deck automatically belongs in Stats because Stats loads the complete registered deck. Do not maintain a separate Account-page deck list.
- Preserve stable deck/card IDs when expanding source material so existing cloud progress remains attached.
- Greek Lesson 3 has three ending cards plus three παιδεύω paradigm cards. Greek Lesson 4 has two first-declension ending cards, four model-noun paradigms, and two feminine definite-article cards. Greek Lesson 5 has two short-alpha first-declension ending cards plus the μοῖρα and θάλαττα paradigms.
- In Lesson 4, both feminine definite-article cards belong under **Endings**. **Paradigms** contains the four model-noun paradigms.
- For Greek grammar **paradigm** charts that teach a stem plus ending, display each complete paradigm cell as `stem - ending` with exactly one space on each side of the hyphen. Preserve the source's actual accent, breathing, and quantity marks on the appropriate stem or ending. Ending-only charts continue to use ordinary ending notation such as `-ης` rather than adding the spaced separator.
- The spaced stem/ending separator is visual morphology, not pronunciation. Greek audio should pronounce the complete form naturally and must not speak the dash.

## Choose cards

- Both Greek and Latin Choose cards menus must retain top-level **Select all** and **Deselect all** actions.
- Every built-in card must be reachable as an exact individual checkbox in the language Choose cards menu. Per-card selection is not a separate temporary UI; it is another view of the same persistent per-card exclusion state used by the answer-side D control.
- Greek may list exact cards directly under source/deck disclosures. Dickinson is large, so exact Dickinson cards MUST be grouped into nested 10-card ranges (`1–10`, `11–20`, and so on), with each range opening to the ten exact card checkboxes.
- Keep selectors concise; hierarchy, checkbox labels, counts, and summaries carry the structure.
- Parent checkbox selection and disclosure expansion are independent. Mixed states must remain correct when only some exact cards are selected, including cards excluded with D.
- Selecting any parent checkbox MUST restore every per-card exclusion beneath that parent. Reselecting an exact card restores that card only. Do not add a separate **Individually deselected** section; deselected cards remain represented only by their normal exact-card checkbox and parent mixed states.
- Filter changes narrow the pool only; never delete progress for deselected cards.
- Every built-in Greek and Latin answer side inherits **Deselect card** from `MultiSourceStudySession`. Pressing D or clicking the button marks the current answer-side card as pending deselection and visually changes the button to **Deselected**. It MUST NOT immediately change cards or reopen the Start gate. The exclusion is committed only when the learner advances with Space/Save & Next, after which the next selected card appears normally without a new Start gate.
- Per-card exclusions are stored through `src/features/study/card-exclusions.ts`. Exact-card checkboxes and the answer-side D action must read/write that same state. Top-level **Select all** and every selected parent scope clear the relevant individual exclusions beneath them.
- Do not implement Deselect card separately in individual deck/card renderers; future cards must receive it through the shared controller by default.
- Saved Cards is the one selector that may carry its explanatory hint.

## Sessions

- Every language always exposes two permanent built-in session types: **Learner** and **Reviewer**. Their IDs are deterministic in `session-management.ts`, so they exist for old and new users without provisioning rows.
- Learner/Reviewer cannot be renamed or deleted. They are organizational session lanes, not separate users or separate long-term learning memories.
- Custom sessions remain renameable/deletable and preserve long-term adaptive evidence when removed from Stats.
- Stats must show Learner and Reviewer as selectable session scopes even before they have reviews.
- Stats session selection is grouped into two language columns on desktop: **Greek** on the left and **Latin** on the right. Use one heading per column; do not repeat a Greek/Latin label inside each session card.
- Persistent named/session IDs remain part of Stats and review history, but the live Progress panel in the Greek and Latin apps is **page-visit scoped**. Entering/re-entering the page or performing a hard reload starts live Progress at zero without deleting any historical reviews or mastery. Do not derive that live bar from the permanent Learner/Reviewer/custom session lifetime.

## Study controls and grading

- Card order exposes **Adaptive**, **Sequential**, and **Shuffle** in the shared study controller.
- Sequential follows the selected pool in order. Shuffle visits every currently selected/available card exactly once per cycle in randomized order, then creates a fresh permutation for the next cycle. Do not repeat the exact prior permutation when a new cycle begins, and avoid an immediate same-card repeat at the cycle boundary when more than one card exists.
- Shuffle is equal-coverage random order, not adaptive weighting. Filtering changes the eligible pool and may start a new shuffle cycle; long-term progress is unaffected.
- Space = Start while the Start gate is open; Reveal before answer; Save & Next after reveal. No other key may dismiss the Start gate.
- F = flip question/answer after reveal.
- Enter = toggle Right/Wrong after reveal. R/W are intentionally unassigned.
- 1/2/3 = Easy/Medium/Hard. S = save/unsave a card. A = audio on Greek or Latin cards where audio exists.
- D = Deselect card: mark/unmark the visible answer-side card for deselection. D must not fire while typing, using toolbar controls, or correcting a prior grade. The actual pool mutation happens on the subsequent Space/Save & Next advance, not on the D keypress itself.
- Shift+Enter is unassigned.
- Automatic correctness is per card + study mode/direction: attempts 1–3 default Wrong; from attempt 4 onward use the majority of the three most recent saved results. Difficulty remains time-based (<3s Easy, <10s Medium, otherwise Hard).
- Back truly undoes/replaces the prior grade; Skip records no grade.
- Adaptive initial coverage uses `INITIAL_COVERAGE_MULTIPLIER = 1.25` against the current selected/unlocked pool. Repeats may occur early, but all selected cards must be covered by `ceil(pool size × 1.25)` ranked presentations; after full initial coverage, normal Adaptive selection resumes.

## Greek audio

- Playback uses cached Supabase Storage audio when available; replaying cached audio must not spend ElevenLabs generation credits.
- For ending-only chart audio, read each vertical column continuously and put exactly one `[pause]` between columns.
- Keep ElevenLabs API keys server-side only.

## Medieval Latin audio

- `docs/MEDIEVAL_LATIN_PRONUNCIATION.md` is the pronunciation-source and normalization contract. The learner-facing label is **Medieval Latin**; do not silently replace it with Classical or modern ecclesiastical Latin.
- The profile is deliberately broad scholastic Medieval Latin: Rigg and Stotz lead, regional reconstructions are comparative controls, and Allen is only the Classical baseline for recognizability.
- Latin paradigm audio must reconstruct and pronounce the complete word; morphology dashes such as `laud-āmus` are visual only and must never be spoken.
- Latin paradigm audio is ordered vertically: singular column first, exactly one `[pause]`, then plural column.
- `src/features/latin/medieval-latin-audio.tsx` is intentionally **cache-only** until the user explicitly approves paid generation. It may read `course_audio_assets`/Supabase Storage but must not call the generation Edge Function merely because a learner opens a card.
- `course-audio` requires `allowGeneration: true` before a missing/changed Latin asset may call ElevenLabs. Preserve that safeguard unless the user explicitly changes the policy.
- Use a dedicated `ELEVENLABS_MEDIEVAL_LATIN_VOICE_ID`; never silently fall back to the Greek voice for Latin generation.
- Do not add Latin asset IDs to an automatic prewarm workflow without explicit user approval. Replays of cached Latin MP3s must never spend new ElevenLabs credits.
- When new built-in Latin grammar paradigm cards are added, give them stable audio definitions in `supabase/functions/course-audio/builtin-latin-assets.ts` and extend regression coverage in the same change.

## Removed features

- Do not reintroduce Reading/Audio, progress-file backup/import, or the ElevenLabs usage-snapshot/admin panel unless the user explicitly requests a new implementation.
