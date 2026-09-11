# Greek & Latin Study — maintenance guide

This is the practical code map for future maintainers and AI agents. `AGENTS.md` is the permanent behavioral contract. Read both before nontrivial work.

Public deployment: `https://coltonkirby01.github.io/greeklatinstudy/`

Canonical repository: `coltonkirby01/greeklatinstudy`

## Non-negotiable rule

Cleanup, refactoring, performance work, dependency work, styling reorganization, and code splitting must preserve the current interface and durable learning state unless the user explicitly asks for a behavior change.

Never treat cleanup as permission to reset progress, merge study modes, regenerate source data, remove working admin/deployment infrastructure, or rewrite stable card/deck IDs.

## Standard verification commands

Every nontrivial change must run:

```bash
npm run maintain:check
npm test
npm run build:pages
```

`npm run check` runs the repository maintenance guard, tests, and production build together.

The GitHub Pages CI runs the maintenance guard automatically. Do not weaken or bypass it to merge a change.

`npm run maintain:check` rejects common cleanup regressions such as tracked temporary workflows/backups and retired Reading, local-file backup/import, ElevenLabs usage-snapshot, Stats-heading, or footer-tagline code returning to the production source tree.

## Clean first-pass procedure

For every substantial update:

1. Read `AGENTS.md`, this guide, and `.github/copilot-instructions.md`.
2. Identify persistence, filtering, session, Stats, keyboard, timing, auth, deployment, and audio behavior the change could touch indirectly.
3. Make the smallest coherent change.
4. Reuse existing registries/components rather than introducing another list or parallel implementation.
5. Delete temporary patch workflows/scripts before the PR is ready to merge.
6. Add or update regression tests for changed behavior.
7. Run `npm run check`.
8. For source-data changes, verify counts, IDs, accents/macrons, and authoritative source fidelity.
9. For persistence/schema changes, prove backward compatibility with existing cloud/local envelopes before deployment.
10. For visible changes, check mobile/desktop and light/dark behavior where relevant.

Do not raise bundle budgets simply to make a change pass.

## Weekly card additions

New cards are expected regularly. The repository should make routine additions boring and data-driven.

### Adding cards to an existing built-in deck

When adding cards to an already registered deck:

- Keep the existing deck ID unchanged.
- Keep every existing card ID unchanged.
- Give each new card a stable, unique ID.
- Add/extend the authoritative source data or loader; do not duplicate the deck in another registry.
- `src/features/study/builtin-study-catalog.ts` automatically feeds the complete registered deck into Stats/session coverage.
- `tests/builtin-study-catalog.test.ts` verifies that every registered Stats mode receives the deck's complete current card array and that card IDs are unique.
- If the cards belong to an existing filter group, they should appear through that group's deck/category selection without a second Stats/session/account list update.
- If the cards introduce a new lesson/category, extend the language selector hierarchy and its Select all/Deselect all set. Make sure users with older saved filter preferences can still reach the new cards deliberately.
- If Greek audio is required, add the audio asset definition using the existing cached Supabase/ElevenLabs path. Replays must continue to use cached Supabase audio.

### Adding a genuinely new built-in deck or study direction

A new deck/direction is different from adding cards to an existing deck. In the same change:

1. Add its loader/source data.
2. Register it once in `BUILTIN_STUDY_DECKS` in `src/features/study/builtin-study-catalog.ts`.
3. Expose it in the appropriate Greek/Latin selector.
4. Preserve separate `studyKey` histories for logically distinct directions/modes.
5. Run `npm run check` and confirm `tests/builtin-study-catalog.test.ts` passes.

Do not create a separate Account, Stats, or session deck registry. The built-in catalog is the canonical source for those cross-cutting concerns.

## Durable learning state

Ordinary maintenance must preserve:

- Forward and Reverse histories as separate `studyKey` modes.
- Henle Whole Chart progress as its own mode where present in historical/current study data.
- Card strength/mastery and initial mastery.
- Correct/wrong and Easy/Medium/Hard aggregates.
- Response-time history and averages.
- Due dates, intervals, streaks, lapse history, adaptive-priority inputs, and recent presentation state.
- Dickinson progressive unlock state.
- Session IDs/names and Stats-exclusion/deletion behavior.
- Guest/local progress and signed-in cloud progress.
- Greek and Latin filter preferences.
- Saved-card references.

Do not change local-storage keys, `DeckProgressEnvelope`, review-event semantics, Supabase tables, or merge rules during cleanup unless a deliberate backward-compatible migration is part of the task.

## Source-of-truth file map

### App shell and routes

- `src/main.tsx` — React root, router base path, auth provider.
- `src/app.tsx` — lazy route declarations.
- `src/route-preload.ts` — route-loader map and intent preloading.
- `src/components/site-layout.tsx` — navigation/footer/shared layout.
- `src/config/site.ts` — home-card and navigation metadata.

Keep route pages lazy unless measurement shows a reason not to.

### Built-in study registration

- `src/features/study/builtin-study-catalog.ts` — canonical active built-in Greek/Latin deck, Stats-mode, and session-coverage registry.
- `tests/builtin-study-catalog.test.ts` — regression guard for registry uniqueness, mode coverage, full current card-array coverage, and unique card IDs.

Do not maintain parallel built-in deck lists in Account, Stats, or session code.

### Greek and Latin study pages

- `src/pages/greek-page.tsx` — Greek filter composition and unified Greek study surface.
- `src/pages/latin-page.tsx` — Latin filter composition and unified Latin study surface.
- `src/features/study/filter-preferences.ts` — persistent filter selections.
- `src/features/study/study-filter-menu.tsx` — shared hierarchical selector UI, including Select all/Deselect all actions.
- `src/features/study/latin-study-filters.ts` — Latin filter helpers.

The cards placed into each active `StudySourceDefinition` are the selected card pool. Filter-scoped priority/sidebar features must derive candidates from that selected pool rather than a complete deck.

### Shared flashcard behavior

- `src/features/study/multi-source-study-session.tsx` — primary built-in Greek/Latin mixed-source controller.
- `src/features/study/study-session.tsx` — ordinary/imported single-deck controller.
- `src/features/study/study-session-ui.tsx` — shared card faces, grading controls, Start gate, Enter/F interaction, sidebar.
- `src/features/study/session-review.ts` — automatic reveal defaults and active-session calculations.
- `src/features/study/study-shortcuts.ts` — keyboard semantics.
- `src/features/study/use-response-timer.ts` — recall timer and focus/visibility handling.
- `src/features/study/engine.ts` — adaptive scheduling, review recording, staged unlocking, Back/Skip, priority.
- `src/features/study/types.ts` — persistent study-state types; migration-sensitive.

Do not fork timer, grading, card-face, or scheduler implementations by language.

### Current keyboard behavior

- Space = Reveal before answer; Save & Next after reveal.
- F = flip question/answer after reveal.
- Enter = toggle Right/Wrong after reveal.
- R/W = intentionally unassigned.
- 1/2/3 = Easy/Medium/Hard.
- S = save/unsave a card in built-in Greek/Latin study.
- A = Greek audio play/pause/replay.
- Shift+Enter = unassigned.

Global shortcuts must not interfere with typing/ordinary controls.

### Automatic correctness and difficulty

Correctness is progress-specific:

- Attempts 1–3 on a card/mode default Wrong.
- Starting with attempt 4, use the majority result of the three most recent saved attempts for that card/mode.

Difficulty remains response-time based:

- under 3.00 seconds → Easy
- 3.00 through under 10.00 seconds → Medium
- 10.00 seconds or more → Hard

These are editable defaults. Back restores/replaces the prior review rather than double-counting it. Skip records no grade.

## Sessions and Stats

Every language has two deterministic permanent built-in session types:

- Learner
- Reviewer

They exist for old and new users without provisioning rows, cannot be renamed/deleted, and appear as selectable Stats scopes even before they contain reviews. Custom sessions remain available alongside them.

The selected-session Progress sidebar and Stats session view must use the same session identity. Warmups and `statsExcluded` reviews do not inflate ranked session metrics.

## Persistence, auth, and cloud synchronization

- `src/features/study/progress-repository.ts` — local/cloud envelope load/save/merge and review-event persistence.
- `src/features/study/session-management.ts` — permanent/custom/historical session behavior.
- `src/pages/stats-page.tsx` — Stats calculations/session UI.
- `src/lib/supabase-config.ts` — public Supabase config helpers without eagerly loading SDK.
- `src/lib/supabase.ts` — Supabase client.
- `src/features/auth/auth-context.tsx` — auth context and lazy Supabase client load.
- `supabase/migrations/` — database schema/RLS history.

Keep the Supabase SDK out of the initial shell. Do not discard history fields to make persistence code smaller.

The Account UI is cloud-first. Do not reintroduce downloadable progress-file backup/import UI unless explicitly requested.

## Built-in/source data

Current source files/loaders include:

- `src/data/builtin-decks.ts`
- `public/data/greek-cards.json`
- `public/data/greek-lesson3-vocab.json`
- `public/data/greek-lesson3-grammar.json`
- Lesson 4 Greek data/loaders in the current built-in data layer
- `public/data/dickinson-latin-core.csv`
- Henle source/adapter files retained for current or historical Latin study behavior

Never regenerate authoritative course data from model memory. Preserve spelling, Greek accents/breathings, Latin macrons, principal parts, gender, source references, and stable IDs unless a deliberate correction is requested.

## Administration

`src/pages/admin-page.tsx` and `src/features/decks/` provide private administrator deck management/import tooling. The Admin navigation item is intentionally visible only to authenticated users present in `admin_users`.

Keep heavy admin/import functionality lazy-loaded and out of the initial public bundle.

## Removed features

The following were deliberately removed and must not be reintroduced by cleanup or copy/paste unless explicitly requested:

- Reading/Audio page, route, backend table/bucket, and TTS feature.
- Local progress-file backup/import UI.
- ElevenLabs subscription-usage snapshot/admin panel.
- Stats heading text `Continuous memory bank`.
- Footer tagline `Active recall · adaptive review · reading aloud`.

## Performance rules

- Keep route pages lazy-loaded.
- Keep the Supabase SDK outside the initial shell.
- Keep large built-in data fetched/cached on demand.
- Do not eagerly load large Latin/Henle data merely because the Latin route exists.
- Reuse shared study components.
- Avoid large UI/state/chart libraries when React/CSS/SVG is sufficient.
- Preserve `scripts/check-bundle-size.mjs` budgets; investigate regressions instead of raising limits.
- Delete dead imports/code and temporary patch infrastructure before merge.

## Deployment

`.github/workflows/pages.yml` performs dependency audit, `npm run maintain:check`, tests, production build, and Pages deployment on `main`.

The deployment intentionally waits for any legacy GitHub Pages branch-publishing job before publishing the tested Vite artifact. Do not remove that wait until repository Pages settings are confirmed to use Actions as the sole source.

## Documentation hierarchy

When documentation disagrees:

1. The user's explicit current request wins.
2. `AGENTS.md` is the permanent behavioral contract.
3. `.github/copilot-instructions.md` and this file specify implementation/maintenance expectations.
4. Tests and deployed behavior establish regression behavior.
5. `README.md` is overview/setup documentation.

When behavior changes deliberately, update regression tests and relevant documentation in the same change.
