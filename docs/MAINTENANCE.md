# Greek & Latin Study — maintenance guide

This is the practical code map for future maintainers and AI agents. `AGENTS.md` is the permanent behavioral contract. Read both before nontrivial work.

## Non-negotiable rule

Cleanup, refactoring, performance work, dependency work, styling reorganization, and code splitting must preserve the current interface and all durable learning state unless the user explicitly asks for a behavior change.

Never treat cleanup as permission to redesign the site, reset progress, simplify study behavior, collapse study modes, merge histories, regenerate source data, or remove a feature that looks unused.

Public deployment: `https://coltonkirby01.github.io/greeklatinstudy/`

Canonical repository: `coltonkirby01/greeklatinstudy`

## Durable learning state

The following must survive ordinary maintenance:

- Forward and Reverse histories as separate `studyKey` modes.
- Henle Whole Chart progress as its own mode.
- Card strength/mastery and initial mastery.
- Correct/wrong and Easy/Medium/Hard aggregates.
- Response-time history and averages.
- Due dates, intervals, streaks, lapse history, adaptive-priority inputs, and recent presentation state.
- Dickinson progressive unlock state.
- Session IDs, names, resumable-session state, deletion tombstones, and Stats-exclusion markers.
- Local guest progress and signed-in cloud progress.
- Greek and Latin filter preferences.
- Saved reading/audio records.

Do not change local-storage keys, `DeckProgressEnvelope`, review-event semantics, Supabase tables, or merge rules during cleanup unless a deliberate backward-compatible migration is part of the task.

## Source-of-truth file map

### App shell and routes

- `src/main.tsx` — React root, router base path, global auth provider.
- `src/app.tsx` — lazy route declarations.
- `src/route-preload.ts` — shared route-loader map and intent preloading.
- `src/components/site-layout.tsx` — navigation and shared site layout.
- `src/config/site.ts` — home-card and navigation metadata.

Keep route pages lazy unless a measured reason says otherwise.

### Greek and Latin study pages

- `src/pages/greek-page.tsx` — Greek filter composition and unified Greek study surface.
- `src/pages/latin-page.tsx` — Dickinson + Henle filter composition and unified Latin study surface.
- `src/features/study/filter-preferences.ts` — persistent filter selections.
- `src/features/study/study-filter-menu.tsx` — shared hierarchical selector UI.
- `src/features/study/latin-study-filters.ts` — Latin filter helpers.

The `cards` arrays placed into each active `StudySourceDefinition` are the selected card pool. Any sidebar or priority feature that claims to be filter-scoped must derive candidates from these selected cards, never from the complete source deck.

### Shared flashcard behavior

- `src/features/study/multi-source-study-session.tsx` — primary Greek/Latin mixed-source controller.
- `src/features/study/study-session.tsx` — ordinary/imported single-deck controller.
- `src/features/study/study-session-ui.tsx` — shared card faces, grading controls, Start gate, Enter/F interaction, and sidebar.
- `src/features/study/session-review.ts` — automatic reveal defaults and active-session Progress calculations.
- `src/features/study/study-shortcuts.ts` — keyboard semantics and shared Enter helper.
- `src/features/study/use-response-timer.ts` — active recall timer and focus/visibility handling.
- `src/features/study/engine.ts` — adaptive scheduling, review recording, staged unlocking, Back/Skip transitions, and card priority.
- `src/features/study/types.ts` — persistent study-state types; treat changes as migration-sensitive.

`StudyCardFaces` is the single shared physical front/back card implementation. Do not fork card flipping separately for Greek, Latin, Henle, or imported decks.

### Current card interaction

- Clicking an unrevealed question reveals the answer and captures response time.
- After reveal, clicking whichever card face is visible flips to the opposite face.
- Plain Enter toggles the suggested correctness between Right and Wrong.
- F flips question/answer after reveal.
- R/W are intentionally unassigned.
- 1/2/3 set Easy/Medium/Hard directly.
- Space reveals before answer and saves after reveal.
- Post-reveal flipping never restarts or adds response time.
- Native keyboard behavior for ordinary controls must remain usable. A focused flashcard face is the deliberate exception: Enter/F retain the study shortcuts.

### Current automatic grading defaults

Reveal freezes active front-side recall time. Correctness follows the rolling three-review default. Time selects only the initial difficulty:

- under 3.00 seconds → `Easy`
- 3.00 seconds through under 10.00 seconds → `Medium`
- 10.00 seconds or more → `Hard`

These are defaults, not forced grades. The user may change correctness and difficulty independently before saving. Never reapply an automatic default after the user changes it. Back/correction restores the previously saved grade and response time rather than calculating a fresh default.

Recall time remains stored independently and continues to influence adaptive priority/scheduling.

### Active-session Progress panel

The Progress panel beside the active flashcard is intentionally session-specific rather than lifetime/user-specific.

- Its stats come from ranked reviews whose `sessionId` matches the active session.
- Warm-up reviews and `statsExcluded` reviews do not contribute.
- Reviewed is the number of distinct currently selected/available cards reviewed in that session.
- Accuracy, wrong/hard counts, average time, right-once count, and best streak are session scoped.
- The Initial review bar is distinct-card coverage of the currently selected/available pool in the active session.
- Filtering may change the current denominator but must never delete long-term progress.

### Highest-Priority Review

Highest-Priority Review is different from the Progress panel:

- It uses long-term adaptive learning evidence rather than only the current session.
- Its candidate cards must nevertheless come **only from the currently selected/available card pool**.
- Example: if only Greek Lesson 3 is selected, only Lesson 3 cards may appear in Highest-Priority Review.
- It shows prompts only; answers remain hidden.

For ordinary decks, `highestPriorityCards(cards, state, ...)` must receive the selected cards. For mixed Greek/Latin study, build the list from the selected visible candidates, not from full deck histories.

## Persistence, authentication, and synchronization

- `src/features/study/progress-repository.ts` — local/cloud envelope load, save, merge, review-event persistence, and deletion tombstones.
- `src/features/study/session-management.ts` — canonical session catalog, explicit sessions, legacy inferred sessions, naming, rename/delete support.
- `src/pages/stats-page.tsx` — Stats calculations and session management UI.
- `src/lib/supabase-config.ts` — lightweight public Supabase URL/key/config helpers; intentionally no SDK import.
- `src/lib/supabase.ts` — actual Supabase client.
- `src/features/auth/auth-context.tsx` — auth context; dynamically imports the Supabase client so the SDK stays outside the initial shell.
- `supabase/migrations/` — authoritative database schema and RLS history.

Do not replace the dynamic Supabase client load with a static import merely because it is shorter source code. That split is a measured performance optimization.

Do not optimize `progress-repository.ts` by discarding history fields or recomputing learning state from visible Stats history. Long-term adaptive state intentionally survives session deletion.

### Session deletion semantics

Deleting a session has two simultaneous requirements:

1. The session disappears from Stats and all resumable session menus and stale local/cloud data must not resurrect it.
2. Learning evidence already incorporated into adaptive memory remains intact.

The implementation therefore de-sessionizes affected reviews and marks them `statsExcluded` while persisting deletion markers. It does not roll back mastery, scheduling, response-time memory, adaptive priority, review sequence, or Dickinson unlock progress.

Never replace this with a naive delete-history-and-rebuild implementation.

## Built-in data

- `src/data/builtin-decks.ts` — adapters/loaders for built-in Greek and Dickinson data.
- `public/data/greek-cards.json` — Greek Lessons 1–2.
- `public/data/greek-lesson3-vocab.json` — Greek Lesson 3 vocabulary.
- `public/data/greek-lesson3-grammar.json` — Greek Lesson 3 grammar.
- `public/data/dickinson-latin-core.csv` — Dickinson Latin source.
- `src/features/henle/henle-data.ts` and `public/data/henle-part1-forms.json` — Henle adapter and authoritative source data.
- `src/features/henle/henle-chart.tsx` — Whole Chart grouping and answer rendering.

Never regenerate Henle or Dickinson material from model memory. Preserve protected source counts and IDs.

## Reading and administration

- `src/pages/admin-page.tsx` and `src/features/decks/` — administrator deck management/imports.

These routes are lazy-loaded. Keep heavy admin/import functionality out of the initial shell.

## Performance rules

Optimize measured bottlenecks, not source-code aesthetics.

Safe defaults:

- Keep route pages lazy-loaded.
- Keep the Supabase SDK outside the initial shell.
- Keep large built-in data in `public/data` and fetch/cache it on demand.
- Do not eagerly load Henle source data merely because the Latin page exists.
- Home study cards may prefetch route/data on hover, focus, or pointer-down.
- Reuse shared study components instead of shipping separate timers, card faces, graders, or schedulers.
- Avoid large UI/chart/state libraries when React/CSS/SVG is sufficient.
- Preserve the bundle-size gate instead of raising it to make cleanup pass.

`scripts/check-bundle-size.mjs` guards the production bundle. The async Supabase split reduced the main shell from roughly 138 KB gzip to about 80 KB gzip, with a 100 KB main-shell budget. CSS has its own budget. If cleanup causes an unexpected increase, investigate the dependency graph instead of raising the limits.

## Safe change procedure

For any nontrivial change:

1. Read `AGENTS.md` and this file.
2. Identify persistent state, filters, sessions, study modes, keyboard behavior, and timing that could be touched indirectly.
3. Make the smallest coherent change.
4. Add or update regression tests for behavioral changes.
5. Run the complete test suite.
6. Run the production GitHub Pages build and bundle-size check.
7. Do not deploy a failed build merely because unit tests passed.
8. For persistence changes, prove backward compatibility with existing envelopes before deployment.
9. For source-data changes, verify protected counts and IDs deliberately.
10. For visible CSS/markup changes, verify desktop/mobile and light/dark readability.

Normal commands:

```bash
npm test
npm run build:pages
```

`npm run check` runs the repository's standard combined verification.

## Common update recipes

### Change Greek or Latin filters

Work primarily in the language page plus shared filter utilities. Preserve stored progress for deselected cards and preserve the current card if it remains in the new pool. Verify Highest-Priority Review and the Initial review denominator also follow the selected pool.

### Change grading or shortcuts

Keep the shared rules in `session-review.ts`, `study-shortcuts.ts`, and `study-session-ui.tsx`, and make both study controllers consume those shared semantics. Do not implement different grading rules for Greek and Latin.

### Change adaptive scheduling

Work in `engine.ts`. Preserve Back rollback, Skip, staged unlocking, response-time influence, due dates, Forward/Reverse separation, anti-repeat behavior, and session classification. Add focused engine tests.

### Change sessions

Keep `session-management.ts`, `multi-source-study-session.tsx`, `stats-page.tsx`, and `progress-repository.ts` consistent. Explicit sessions and inferred legacy sessions have different resumability rules. Test deletion tombstones so stale tabs/cloud state cannot restore deleted sessions.

### Change Henle

Do not rewrite source data. Keep Rule numbers from the authoritative `rule` field. Individual Forms and Whole Charts remain distinct modes. Whole Chart answers identify stems/endings only where the source supports the split.

### Add a new deck

Use the existing `DeckDefinition` / `StudyCard` model and shared `StudySession`. Do not create another timer, grader, scheduler, or progress system.

## Deployment note

The repository can still receive GitHub's legacy Pages branch-build job. The custom `pages.yml` deployment intentionally waits for that legacy job to finish before publishing the tested Vite artifact so the legacy deployment cannot overwrite the correct site. Do not remove that wait until repository Pages settings are confirmed to use GitHub Actions as the sole source.

## Documentation hierarchy

When documentation disagrees:

1. The user's explicit current request wins.
2. `AGENTS.md` is the permanent behavioral contract.
3. This file is the implementation/maintenance map.
4. Tests and the current deployed implementation establish regression behavior.
5. `README.md` is overview/setup documentation and must not override the above.

When behavior changes deliberately, update regression tests and the relevant documentation in the same maintenance pass.
