# Greek & Latin Study

A permanent, maintainable edition of the Greek & Latin Study web application. It preserves the scholarly cream-and-burgundy appearance and active-recall workflow of the original ChatGPT Site while adding a shared flashcard engine, complete Henle grammar data, independent bidirectional learning histories, cloud-ready accounts, deck administration.

The original ChatGPT Site remains intact. This repository is the source of truth for the GitHub edition.

## Included study material

| Study area | Source count | Modes |
| --- | ---: | --- |
| Greek I | 55 cards | Symbol → Name; Name → Symbol |
| Greek Lesson 3 Vocabulary | 11 cards | Greek → English; English → Greek |
| Greek Lesson 3 Grammar | 6 cards | Three ending charts + three model-verb paradigms |
| Greek Lesson 4 Vocabulary | 11 cards | Greek → English; English → Greek |
| Greek Lesson 4 Grammar | 8 cards | Endings, model-noun paradigms, and feminine article |
| Dickinson Latin Core | 997 entries | Latin → English; English → Latin; staged 100 then 25 |
| Henle Part I Forms | 2,062 unique cards; 331 rules | Prompt → Form; Form → Identify |
| Henle Whole Charts | 248 multi-form rule groups | Reconstruct complete chart |

The Henle JSON is generated from the exact supplied `Henle_Part1_Forms_Full_App...html` data object. Runtime validation and automated tests fail if its required counts or unique IDs change unexpectedly.

## Stack

- React 19, TypeScript, Vite
- React Router with a GitHub Pages 404 fallback
- Supabase Auth, Postgres, Row Level Security, Storage, and optional Edge Functions
- Vitest for review logic, import parsing, session behavior, and source-count protection
- GitHub Actions for test, build, and Pages deployment

The app remains usable without Supabase: all built-in decks and guest progress work locally. The production deployment is connected to the owner's **Latin Greek** Supabase project for accounts, cloud progress, administrator-created decks and synced study progress.

The initial application shell deliberately does not bundle the Supabase SDK. Authentication restores asynchronously behind a separate chunk so the public shell can become interactive sooner. `scripts/check-bundle-size.mjs` keeps the main JavaScript bundle under 100 KB gzip to prevent a future refactor from silently undoing that split.

## Project map

```text
src/
  components/              navigation and shared site layout
  data/                    built-in deck loaders and CSV parser
  features/
    auth/                  Supabase session and administrator status
    decks/                 cloud deck service and CSV/XLSX/JSON importer
    henle/                 authoritative data adapter and chart renderer
    study/                 timer, adaptive scheduler, progress, Back/Skip, shared UI
  pages/                   route-level screens
  lib/supabase-config.ts   lightweight public configuration used before SDK load
  lib/supabase.ts          lazily loaded Supabase client
public/data/               versioned built-in source data
public/privacy/, terms/    crawlable privacy and terms pages
supabase/migrations/       complete schema and RLS policies
tests/                     invariant and behavior tests
```

For implementation-sensitive maintenance, read `AGENTS.md` and `docs/MAINTENANCE.md` before changing behavior or persistence.

## Local development

Requires Node 22 or newer.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when using another Supabase project locally:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

The repository's `.env.production` contains only the project URL and a modern Supabase **publishable** key. Publishable keys are designed for browser exposure; authorization still comes from RLS. Never put a secret key, service-role key, or TTS provider credential in any `VITE_` variable or committed file. CI environment variables can override this file when moving the deployment to another project.

Run all automated checks:

```bash
npm run check
```

Build the repository-path deployment exactly as GitHub Pages does:

```bash
npm run build:pages
```

## Flashcard data model

All ordinary decks become a `DeckDefinition` containing `StudyCard` records. A card has a stable ID, forward front/back, optional explicit reverse prompt/answer, category, rank, source, notes, and extensible metadata. Administrator-created records use the same model when loaded from Supabase.

If `reverse_prompt` is blank, a normal imported deck uses Back as the reverse question and Front as the reverse answer. For ambiguous grammar material, supply an explicit Reverse Prompt or use a specialized adapter such as Henle.

New ordinary decks automatically inherit:

- forward and optional reverse modes with separate learning histories
- smooth 3D card flipping by clicking the visible card; after reveal F also flips question/answer
- Enter after reveal toggles the correctness selection between Right and Wrong
- hundredths-of-a-second front timer behind an explicit Start gate
- focus/visibility protection that returns an unrevealed card to the Start gate rather than charging hidden time
- Reveal plus rolling-history correctness and time-based Easy/Medium/Hard difficulty defaults
- manual Right/Wrong and Easy/Medium/Hard overrides before save
- Save & Next after the default or manually changed grade
- Back with true grade rollback, and ungraded Skip
- adaptive or sequential ordering
- top-five prompt-only priority review limited to the currently selected card pool
- session-specific sidebar progress plus an Initial review coverage bar
- per-direction statistics and cloud-ready progress

### Separate directions

One deck has a progress envelope containing independent `modes`, keyed by `studyKey`. Greek and vocabulary use `forward` and `reverse`; Henle uses `individual:forward`, `individual:reverse`, and `chart`. Each mode owns its card strength, due date, response-time totals, history, counters, and unlocked stage. Cloud/local reconciliation merges modes by each mode's update time instead of falsely combining their mastery.

### Timer

The timer displays hundredths of a second and measures only active time spent viewing the unrevealed question side. It begins only after the Start gate is dismissed, stops when the answer is revealed, and never charges hidden or unfocused time. If the tab/window loses focus while an unrevealed card is active, the user must pass through the Start gate again on return; timing does not silently auto-resume.

Reveal captures and freezes the response time. After reveal, flipping between question and answer by click or F does not restart or add time. Moving normally to the next card in an already active, focused session does not require another Start gate.

### Grading and adaptive review

Correctness and difficulty remain separate recorded inputs. Automatic correctness is per card and per study direction: attempts 1–3 default to **Wrong**; starting with attempt 4, the default is the majority result among that card's three most recent saved reviews. The captured active recall time chooses the initial difficulty:

- under 3.00 seconds → **Easy**
- 3.00 seconds through under 10.00 seconds → **Medium**
- 10.00 seconds or more → **Hard**

These are defaults, not forced grades. Enter toggles Right/Wrong; R/W are intentionally unassigned; 1/2/3 choose Easy/Medium/Hard; F flips the revealed card. Manual corrections are saved into the rolling history and affect later defaults.

Response time is always stored independently, so speed contributes to adaptive priority and scheduling in addition to the selected correctness and difficulty.

Scheduling is intentionally transparent rather than a black box. Correctness has the strongest effect; difficulty influences interval and growth; current strength and streak expand successful intervals; Wrong creates a lapse and short interval. Slow response applies an interval penalty and adds review priority. Priority also includes whether a card is new, mastered once, due/overdue, inconsistent, recently wrong, hard, and recently shown.

Cards never disappear after one success. Initial mastery controls staged introduction; all mastered cards continue returning according to due dates and adaptive priority.

### Session progress and Highest-Priority Review

The Progress panel beside a flashcard is session-specific. Its Reviewed, Accuracy, Ever wrong, Marked hard, Avg. time, Right once, and Best streak values come only from ranked reviews in the active session. Warm-up and Stats-excluded reviews do not inflate it.

The Initial review bar shows how many distinct cards in the currently selected/available pool have been reviewed at least once in that active session.

Highest-Priority Review is deliberately different: it may use the user's long-term adaptive learning history to score cards, but its candidates are limited to the **currently selected card pool**. For example, selecting only Greek Lesson 3 means only Lesson 3 cards can appear there. Answers remain hidden.

### Back and Skip

Every saved review keeps a transaction containing the exact pre-review mode snapshot. Back restores that snapshot, removes/replaces the review event as appropriate, and reopens the card for correction. The corrected grade reuses the same review UUID, so the mistaken and corrected ratings can never count as two reviews. It also preserves the originally captured response time and session/warm-up classification. Skip presents another card without changing review, accuracy, or difficulty counts.

## Sessions and long-term progress

A study session is a performance window layered on top of continuous long-term mastery. Starting or resuming a session never resets mastery, intervals, due dates, response-time memory, adaptive priorities, or Dickinson unlock state. Greek and Latin default to the most recently reviewed resumable explicit session unless the user deliberately starts another one.

Deleting a session removes its session identity from Stats and resumable session menus while preserving the learning evidence already incorporated into adaptive memory. The implementation uses persistent deletion/exclusion markers so stale local or cloud state cannot resurrect a deleted session. Do not rewrite this behavior as a naive history purge/rebuild during maintenance.

## Supabase setup

The production project already has all repository migrations applied. For a fresh replacement project:

1. Create a Supabase project; do not enable a paid plan unless you have deliberately approved it.
2. Apply the numbered files in `supabase/migrations/` in order. Migration 0002 hardens administrator authorization; migration 0003 optimizes RLS evaluation without changing access.
3. In Authentication, enable Email. Set the Site URL to the deployed GitHub Pages URL and add both the deployed `/account` URL and local development URL to Redirect URLs.
4. Create your account once, copy its UUID from Authentication → Users, and insert that exact UUID into `public.admin_users`.
5. Replace the public values in `.env.production`, or provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through the deployment environment. Use the project URL and public publishable key only.
6. Add the same values to `.env.local` for local development.

The migration creates:

- `decks`, `deck_categories`, and `cards` for reusable administrator-created decks
- `user_deck_states` for the current sparse state of every mode
- `review_events` for individual review audit/sync records
- `admin_users` with self-visible membership checks used directly by administrator-only RLS policies

Every private row policy compares `user_id` to `(select auth.uid())`, allowing Postgres to initialize the identity once per query. Deck/card writes additionally require a matching self-visible row in `admin_users`. The administrator page refusing access is only a usability layer; RLS remains authoritative if someone manually calls an endpoint or visits `/admin`. Supabase's security advisor reports no findings, and its performance advisor reports no actionable RLS warnings after the hardening migrations.

### Email/password, reset, and Google

Email/password signup, secure Supabase sessions, logout, and password recovery are implemented. Passwords are handled by Supabase Auth and are never stored by this application. Google OAuth is wired but must be explicitly enabled in the Supabase Authentication provider settings with Google client credentials and the callback URL Supabase displays. Until configured, the Google button returns the provider error rather than pretending to work.

For this production project's exact Supabase redirects, Google origin/callback values, provider steps, and verification checklist, see [`docs/AUTH-SETUP.md`](docs/AUTH-SETUP.md).

### Cloud progress

Signed-in progress is synchronized through Supabase `user_deck_states` and review events. Guest study remains browser-local until the user signs in; signed-in study uses the same local cache as a performance layer while the cloud account remains the durable cross-device source.

## Deck administration and imports

Only a row in `admin_users` grants access. The administrator area can:

- create a deck and edit its title, slug, subject, language, description, reverse behavior, and optional staged-introduction configuration
- import CSV, XLSX, or JSON and preview the first ten parsed cards before writing
- append or deliberately replace cards
- add categories, add/edit/delete individual cards, and move cards up or down
- publish or unpublish a deck

CSV requires `Front` and `Back`. Optional columns are `Category`, `Rank`, `Source`, `Notes`, and `Reverse Prompt`. See `public/sample-deck.csv`. JSON accepts an array or `{ "cards": [...] }`; case-insensitive equivalents of the same field names are recognized. XLSX uses its first sheet and first row as headers.

Published custom decks remain addressable through `/decks/:slug` and use the same shared `StudySession` engine. The primary public navigation intentionally remains Home, Greek, Latin, and Stats; do not reintroduce a separate Decks library into that navigation unless explicitly requested. Specialized formats should adapt source data into `StudyCard` and supply custom front/back renderers rather than forking timer, grading, sync, or scheduling logic.

## Deployment and performance checks

The `pages.yml` workflow runs tests and a production build for every pull request. A push to `main` additionally uploads `dist` and deploys GitHub Pages. During GitHub Actions, Vite derives the correct `/greeklatinstudy/` base path from `GITHUB_REPOSITORY`; the post-build script creates `404.html` so direct client routes work on Pages.

The bundle-size check protects both the initial JavaScript shell and total CSS. Heavy service SDKs, admin-only code, route pages, and large study data should remain outside the initial shell whenever practical. Do not raise a bundle budget merely to make a refactor pass; first determine why the bundle grew.

The repository originally used legacy branch publishing. Until the owner changes **Settings → Pages → Build and deployment → Source** to **GitHub Actions**, the compiled deploy job waits for that legacy job to finish and then replaces its output. Branch-specific concurrency labels keep pull-request checks from cancelling the live `main` deployment. Once the source is set to GitHub Actions, the same workflow continues normally and the legacy wait exits immediately.

Recommended branch practice:

- keep `main` deployable and protected after initial setup
- make ordinary changes on short-lived `feature/...` or `fix/...` branches
- require the `check` job before merging
- use deliberate data-change commits for source deck replacements

## Testing status

`docs/TEST-CHECKLIST.md` records the exact verification state. Unit/data/build tests run without external accounts. Supabase authentication, cross-device sync, storage upload, admin RLS, and the live Pages URL require one configured Supabase/GitHub deployment before their final integration checks can truthfully pass.
