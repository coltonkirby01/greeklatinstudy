# Greek & Latin Study — maintenance guide

This file is the practical map for future maintainers and AI agents. `AGENTS.md` contains the permanent behavioral rules. Read both before changing code.

## Non-negotiable maintenance rule

Refactoring, cleanup, performance work, dependency work, styling reorganization, and code splitting must preserve the current interface and all user learning state unless the user explicitly asks to change one of those things.

Never treat a cleanup task as permission to redesign the site, reset stored progress, simplify study behavior, collapse study modes, merge histories, regenerate source data, or remove a feature that looks unused.

The current public deployment is:

`https://coltonkirby01.github.io/greeklatinstudy/`

The canonical repository is:

`coltonkirby01/greeklatinstudy`

## What counts as user learning state

The following are durable state and must survive ordinary code cleanup:

- Forward and Reverse histories as separate `studyKey` modes.
- Henle Whole Chart progress as its own mode.
- Card strength/mastery and initial mastery.
- Correct/wrong and Easy/Medium/Hard aggregates.
- Response-time history and averages.
- Due dates, intervals, streaks, lapse history, adaptive priority inputs, and recent presentation state.
- Dickinson progressive unlock state.
- Session IDs, names, resumable-session state, deletion tombstones, and Stats-exclusion markers.
- Local guest progress and signed-in cloud progress.
- Filter preferences.
- Saved reading/audio records.

Do not change local-storage keys, `DeckProgressEnvelope`, review-event semantics, Supabase tables, or merge rules during a cleanup unless a deliberate backward-compatible migration is part of the task.

## Source-of-truth file map

### App shell and routes

- `src/main.tsx` — React root, router base path, global auth provider.
- `src/app.tsx` — route-level lazy loading. Keep route pages lazy unless there is a measured reason not to.
- `src/route-preload.ts` — shared lazy route-loader map and intent preloading.
- `src/components/site-layout.tsx` — primary navigation and shared layout.
- `src/config/site.ts` — home-card and navigation metadata.

### Greek and Latin study pages

- `src/pages/greek-page.tsx` — Greek filter composition and the unified Greek study surface.
- `src/pages/latin-page.tsx` — Dickinson + Henle filter composition and the unified Latin study surface.
- `src/features/study/filter-preferences.ts` — persistent Greek/Latin filter selections.
- `src/features/study/study-filter-menu.tsx` — shared hierarchical selector UI.
- `src/features/study/latin-study-filters.ts` — Latin filter helpers.

### Shared flashcard behavior

- `src/features/study/multi-source-study-session.tsx` — the primary Greek/Latin mixed-source session controller.
- `src/features/study/study-session.tsx` — ordinary/imported single-deck session controller.
- `src/features/study/study-session-ui.tsx` — shared card faces, grading controls, Start gate, and sidebar.
- `src/features/study/session-review.ts` — time-based default grades and active-session Progress-panel calculations. Keep this helper shared by mixed and single-deck study.
- `src/features/study/study-shortcuts.ts` — keyboard semantics.
- `src/features/study/use-response-timer.ts` — active recall timer and focus/visibility handling.
- `src/features/study/engine.ts` — adaptive scheduling, review recording, staged unlocking, Back/Skip state transitions, and card priority.
- `src/features/study/types.ts` — persistent study-state types. Treat changes here as migration-sensitive.

`StudyCardFaces` is the single shared implementation of the physical front/back card interaction. Keep Greek, Latin, Henle, and ordinary imported decks using this shared behavior instead of forking card flipping.

Current card interaction rules:

- Clicking an unrevealed question reveals the answer and captures the response time.
- After reveal, clicking whichever face is visible flips to the opposite face.
- Enter performs the same post-reveal question/answer flip.
- Flipping after reveal never restarts or adds to response time.

Current grading rules:

- Reveal captures active front-side recall time and immediately preselects both correctness and difficulty.
- Under 3.00 seconds defaults to `Right` + `Easy`.
- 3.00 seconds through under 10.00 seconds defaults to `Wrong` + `Medium`.
- 10.00 seconds or more defaults to `Wrong` + `Hard`.
- These are defaults only. Users can change Right/Wrong and Easy/Medium/Hard independently before saving.
- Do not reapply a default after the user manually changes a grade.
- Back/correction restores the prior saved grade and response time rather than silently recalculating a new default.
- Recall time is stored independently and remains part of adaptive priority/scheduling.
- Difficulty controls appear below the Right/Wrong controls.

### Active-session Progress panel

The Progress panel beside a flashcard is intentionally not a lifetime/user-history panel.

- Its statistics use ranked review records whose `sessionId` matches the active session.
- Warm-up reviews and `statsExcluded` reviews do not contribute.
- `Reviewed` is the number of distinct currently selected/available cards reviewed in that session.
- Accuracy, wrong/hard counts, average time, right-once count, and best streak are session scoped.
- The Initial review bar is distinct-card coverage of the currently selected/available pool in the active session.
- Changing filters can change the current denominator; it must never remove underlying progress or review history.
- Highest-Priority Review remains based on continuous adaptive learning history and is not session-only.

If this behavior changes, update `session-review.ts`, both session controllers, `study-session-ui.tsx`, and `tests/session-review.test.ts` together.

### Persistence, authentication, and synchronization

- `src/features/study/progress-repository.ts` — local/cloud envelope load, save, merge, review-event persistence, and deletion tombstones.
- `src/features/study/session-management.ts` — canonical session catalog, explicit sessions, legacy inferred sessions, naming, rename/delete support.
- `src/pages/stats-page.tsx` — Stats calculations and session-management UI.
- `src/lib/supabase-config.ts` — lightweight public Supabase URL/key/config helpers. This file intentionally has no SDK import and is safe in the initial shell.
- `src/lib/supabase.ts` — actual Supabase client. Keep the `@supabase/supabase-js` dependency behind the asynchronous boundary.
- `src/features/auth/auth-context.tsx` — auth session/admin context. It intentionally dynamically imports `src/lib/supabase.ts` so the service SDK does not return to the initial JavaScript bundle.
- `supabase/migrations/` — authoritative database schema and RLS history.

Do not optimize `progress-repository.ts` by discarding history fields or recomputing state from remaining Stats history. Long-term learning state intentionally survives session deletion.

Do not replace the auth-context dynamic client load with a static `supabase` import merely because the static version is shorter source code. The async split is a measured performance optimization and the bundle-size gate is intended to catch regressions here.

### Session deletion semantics

Session deletion has two simultaneous requirements:

1. The session must disappear from Stats and all Greek/Latin session menus and must not be resurrected by stale local/cloud data.
2. The review evidence that already trained the adaptive system must remain available to the card-learning state.

The current implementation therefore de-sessionizes affected reviews and marks them `statsExcluded` while persisting session deletion markers. It does not roll back accumulated mastery, scheduling, response-time memory, adaptive priority, review sequence, or Dickinson unlock progress.

Do not replace this with a naive "delete every learning review and rebuild card state" implementation.

### Built-in data

- `src/data/builtin-decks.ts` — adapters/loaders for built-in Greek and Dickinson data.
- `public/data/greek-cards.json` — Greek Lessons 1–2 source.
- `public/data/greek-lesson3-vocab.json` — Lesson 3 vocabulary.
- `public/data/greek-lesson3-grammar.json` — Lesson 3 grammar.
- `public/data/dickinson-latin-core.csv` — Dickinson Latin source.
- `src/features/henle/henle-data.ts` and `public/data/henle-part1-forms.json` — Henle adapter and source data.
- `src/features/henle/henle-chart.tsx` — Whole Chart grouping and answer rendering.

Never regenerate Henle or Dickinson material from model memory. Preserve the source files and protected source-count tests.

### Reading and administration

- `src/pages/reading-page.tsx` and `src/features/reading/` — Reading & Audio.
- `src/pages/admin-page.tsx` and `src/features/decks/` — administrator deck management/imports.

These routes are lazy-loaded. Keep heavy admin/import functionality out of the initial route bundle.

## Performance rules

Optimize measured bottlenecks, not source-code aesthetics.

Safe defaults:

- Keep route pages lazy-loaded.
- Keep the Supabase SDK out of the initial shell. The lightweight configuration and actual client are deliberately split between `supabase-config.ts` and `supabase.ts`.
- Keep large source data in `public/data` and fetch/cache it on demand.
- Do not eagerly load Henle source data just because the Latin page exists; opening/using Henle may load it.
- Home study cards and primary navigation may prefetch their route/data on hover, focus, or pointer intent so navigation feels immediate without making every source part of the first paint.
- Reuse the shared study components instead of shipping separate copies of the timer, card face, grading, session-progress, and scheduler logic.
- Avoid adding large charting, UI, state-management, or animation libraries when native React/CSS/SVG is already sufficient.
- Preserve the existing bundle-size gate rather than raising the limit to make a cleanup pass.

Current CI bundle budgets are enforced by `scripts/check-bundle-size.mjs`. After the async Supabase split the production main shell is about 78–80 KB gzip, and the main-shell budget is 100 KB gzip. The previous static-Supabase shell was about 138 KB gzip. If a cleanup unexpectedly approaches or exceeds 100 KB, investigate what entered the initial dependency graph instead of raising the budget. Total CSS remains guarded separately at 12 KB gzip and is currently very close to that limit.

A performance change is not successful merely because the source looks shorter; compare production gzip output before and after.

## Deployment safety

The repository still has a legacy GitHub Pages publishing workflow in addition to the custom tested deployment. The custom `.github/workflows/pages.yml` deployment deliberately waits for the legacy Pages run for the same commit to finish before publishing the tested artifact. This prevents the legacy job from overwriting the correct Vite build afterward.

Do not remove or shorten that ordering protection unless the repository's Pages source has definitively been changed so the legacy publisher no longer runs. A successful test/build is not enough; confirm the final custom `deploy` job succeeds before reporting a change as live.

## Safe change procedure

For any nontrivial change:

1. Read `AGENTS.md` and this file.
2. Identify which persistent state, filters, sessions, study modes, and keyboard/timer behaviors could be touched indirectly.
3. Make the smallest coherent change.
4. Add or update a regression test when behavior changes.
5. Run the complete test suite.
6. Run the production GitHub Pages build and bundle-size check.
7. Confirm the final Pages deploy job succeeds; do not equate a green build with a completed live deployment.
8. Do not deploy a failed build merely because some unit tests passed.
9. For persistence changes, verify backward compatibility with existing envelopes before deployment.
10. For source-data changes, verify protected counts and IDs deliberately.
11. For visible CSS/markup changes, verify both desktop and mobile behavior and light/dark readability.

The normal commands are:

```bash
npm test
npm run build:pages
```

`npm run check` runs the repository's standard combined verification.

## Common update recipes

### Change Greek or Latin filters

Work primarily in the language page plus the shared filter utilities. Preserve stored progress for deselected cards and preserve the current card if it remains in the resulting pool. Run the filter-preference, filter-retention, Latin-filter, study-engine, and full build tests.

### Change card grading or shortcuts

Keep the time thresholds/default mapping in `session-review.ts`, shared display/controls in `study-session-ui.tsx`, keyboard behavior in `study-shortcuts.ts`, and both `study-session.tsx` and `multi-source-study-session.tsx` on the same semantics. Never implement Greek and Latin grading separately. Update `tests/session-review.test.ts` for threshold changes.

### Change active-session progress

Keep `session-review.ts` as the shared calculation layer and both study controllers as thin callers. Preserve warm-up exclusion, `statsExcluded` exclusion, current selected-pool coverage, and continuous long-term Highest-Priority Review behavior.

### Change adaptive scheduling

Work in `engine.ts`. Preserve Back rollback, Skip, staged unlocking, response-time influence, due dates, Forward/Reverse separation, recent-card anti-repeat behavior, and session classification. Add focused engine tests before deployment.

### Change sessions

Keep `session-management.ts`, `multi-source-study-session.tsx`, `stats-page.tsx`, `progress-repository.ts`, and session-progress calculations consistent. Explicit sessions and inferred legacy sessions have different resumability rules. Test deletion tombstones so stale tabs/cloud state cannot restore deleted sessions.

### Change Henle

Do not rewrite source data. Keep Rule numbers from the authoritative `rule` field. Individual Forms and Whole Charts must remain distinct modes. Whole Chart answers must identify stems/endings where the source supports it and must not invent a morphological split where the source does not.

### Add a new deck

Use the existing `DeckDefinition` / `StudyCard` model and shared `StudySession`. Do not create another timer, grader, scheduler, session-progress calculator, or progress system. Imported/custom decks should inherit the same core study behavior automatically.

## Documentation hierarchy

When documentation disagrees:

1. The user's explicit current request wins.
2. `AGENTS.md` is the permanent behavioral contract.
3. This file is the implementation/maintenance map.
4. Tests and the current deployed implementation establish actual regression behavior.
5. `README.md` is an overview and setup document; update it when behavior changes, but do not use stale prose to override `AGENTS.md` or tested behavior.

If a behavior has changed deliberately, update both the regression tests and the relevant documentation in the same maintenance pass.
