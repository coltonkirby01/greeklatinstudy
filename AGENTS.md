# Greek & Latin Study — permanent repository instructions

The canonical GitHub repository is `coltonkirby01/greeklatinstudy`; its GitHub Pages base path is `/greeklatinstudy/` unless a custom domain is configured.

Treat the repository root as authoritative. Do not edit the retired `greek-latin-study-github/` implementation if it appears in old commits.

For the practical file map, safe-change procedure, and performance-maintenance rules, also read [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) before nontrivial work.

## Core rule

Preserve existing study behavior unless the requested change explicitly modifies it. New features must not silently break, merge, reset, or reinterpret existing decks, statistics, mastery, review history, authentication, synchronization, timing, filtering, or session behavior.

Cleanup, refactoring, performance optimization, dependency work, and file reorganization are not permission to redesign the interface or alter/delete existing user progress. Preserve the visible interface and durable learning state unless the user explicitly requests a change.

## App structure and filtering

- The primary public navigation is Home, Greek, Latin, Stats, and Reading. Stats is a first-class navigation destination, not something users should have to discover only inside a study page.
- The public study navigation has one Greek app and one Latin app. Do not reintroduce separate Henle, vocabulary, grammar, or Decks apps/pages in the primary navigation.
- `/henle` is a compatibility redirect into `/latin`; Henle grammar is studied inside the Latin app.
- Individual imported/custom deck routes under `/decks/:slug` may remain addressable, but there is no standalone `/decks` library page or Decks navigation item.
- Greek and Latin selectors use a vertical accordion/drop-down hierarchy, not dense side-by-side settings panels.
- Every expandable filter heading has a checkbox visible while the disclosure is closed. That parent checkbox selects or clears everything beneath the heading; users must not have to open a dropdown merely to choose all or none. Partially selected parents show an indeterminate/mixed state.
- Expanding/opening a dropdown is independent from selecting its parent. Users must be able to open an unchecked parent and select one or several child boxes without first selecting the entire parent.
- Selecting a child beneath an unchecked parent activates only the necessary child path, not every sibling in that parent.
- Filters narrow the current study pool only. Deselecting a source or child must never erase or reset stored mastery, history, scheduling, timing, or statistics for those cards.
- Greek and Latin filter selections persist when the user leaves and returns to the flashcard app. Do not reset filters merely because the route unmounted or the user navigated elsewhere.
- When filters change, keep the user on the same current card whenever that card still belongs to the newly selected pool. Choose a replacement card only if the current card was actually excluded by the new filter selection.
- Changing a study filter or direction returns the active study surface to the Start gate before timing resumes.

### Greek selector

- Greek has top-level quick selectors for All Vocabulary and All Grammar; narrower lesson selectors remain independently adjustable.
- All Grammar includes Lesson 1 Alphabet and Punctuation, Lesson 2 Accent Marks, and all current Lesson 3 grammar paradigms. The only material currently classified as Greek vocabulary is Lesson 3 Vocabulary.
- Greek filtering is organized by lesson.
- Lesson 1 contains Alphabet and Punctuation. Alphabet expands to independent Uppercase and Lowercase choices. Alphabet and punctuation are Grammar, not vocabulary.
- Lesson 2 contains Accent Marks. Accent marks are Grammar, not vocabulary.
- The only current Greek vocabulary source is Lesson 3 Vocabulary.
- Greek Lesson 3 contains separate Vocabulary and Grammar headings. Lesson 3 Grammar currently contains exactly three whole-paradigm chart cards: Present Active Indicative, Present Active Infinitive, and Present Active Imperative from the παιδεύω paradigm.
- Each Lesson 3 grammar filter corresponds to one whole chart card, not a collection of individual person/number form cards. Do not reintroduce the retired 11 isolated Lesson 3 grammar questions unless explicitly requested.
- Forward study asks for the named whole paradigm and reveals its chart. Reverse study shows the complete chart and asks the user to identify the paradigm; Reverse must not decompose the chart back into isolated form-identification cards.
- Keep Lesson 3 vocabulary progress separate from Lesson 3 chart progress even when both are mixed in one session.
- Every Greek vocabulary card must show a Classical-Greek pronunciation guide on the answer side in both Forward and Reverse study. Future Greek vocabulary imports must use the shared pronunciation helper rather than requiring a hand-maintained pronunciation list.
- Greek card types remain multi-select. Lesson material, vocabulary, grammar, punctuation, accents, and future lesson categories may be combined in one adaptive session without merging their stored histories.

### Latin selector

- Latin is a unified study surface. There is exactly one Latin vocabulary source/control: the Dickinson Latin Core Vocabulary. Do not create separate "Latin vocabulary" and "Dickinson vocabulary" boxes for the same source.
- Latin vocabulary, Henle individual forms, and Henle whole charts can be selected singly or combined in one study pool.
- Henle Grammar Forms and Henle Whole Charts each have their own compact vertical dropdown and independent filter state, so a user may choose different Part I sections for forms and charts in the same mixed session.
- Do not put a redundant "Parts of speech" dropdown inside Dickinson Vocabulary or a redundant "Part 1 sections" / "Parts of speech" dropdown inside either Henle source. Once a source is opened, users should reach the meaningful category parents directly.
- Opening a Henle dropdown may load Henle source data, but opening alone must not select the source.
- Latin grammar filters are hierarchical and composable. Broad sections can be narrowed by verb family, voice, and form/mood (for example Verbs + Active Voice + Indicative).
- Henle Part I grammatical sections are Nouns, Adjectives, Adverbs, Numerals, Pronouns, and Verbs. Do not reduce the Henle selector to verbs only.
- Henle Individual Forms and Whole Charts show the authoritative Henle Rule number on the answer side when source data supplies it.
- Henle Whole Chart answers must explicitly identify stems as `Stem:` and endings/personal signs as `Ending:` whenever the source metadata identifies them as such. Ordinary finite forms may show a defensible `Stem / base + Ending → Complete form` breakdown when the source supports it. Do not invent a morphological split where the data is ambiguous.
- Do not reintroduce a separate "How to read this answer" instructional block on Henle cards unless the user explicitly asks for it.

## Built-in deck invariants

- Built-in source counts are Greek Lessons 1–2: 55 cards; Greek Lesson 3 Vocabulary: 11 cards; Greek Lesson 3 Grammar: 3 whole-paradigm chart cards; Dickinson Latin: 997; Henle: 2,062 unique cards across 331 rules; Henle Whole Charts: 248 groups.
- Greek Lesson 3 grammar categories are Present Active Indicative, Present Active Infinitive, and Present Active Imperative unless the course source is deliberately expanded.
- The three active Lesson 3 grammar card IDs are `lesson3-chart-present-active-indicative`, `lesson3-chart-present-active-infinitive`, and `lesson3-chart-present-active-imperative`. The retired `lesson3-g-*` individual-form IDs may remain only in historical progress storage; they must never re-enter the active study pool, warmups, Highest-Priority Review, or new session statistics.
- Any deck-data change must update and pass the source-count tests deliberately.
- Preserve spelling, accents, breathing marks, macrons, principal parts, gender, and other source forms unless the task explicitly corrects source data.
- Existing source decks remain independently persisted even when Greek or Latin UI sessions interleave cards from multiple sources.
- Dickinson's staged introduction remains 100 cards initially and 25 additional cards at a time; filtering or mixing with grammar must not silently expose locked Dickinson cards.

## Study directions and progress

- `studyKey` separates Forward, Reverse, and Henle Whole Charts. Never merge their mastery, statistics, review history, or scheduling state.
- Forward and Reverse are logically separate study directions even when they use the same underlying card.
- Preserve per-direction statistics and scheduling.
- A card's displayed flip/front-back behavior must not collapse the logical distinction between Forward and Reverse.
- Mixed Greek and Latin sessions may rank cards from multiple persisted sources together, but each review must save to its original deck and study mode.
- Direction and card order (Adaptive/Sequential) remain adjustable while the Start gate is open. Changing them must not start the timer.
- The Progress panel beside the active flashcard is session-specific. Its reviewed count, accuracy, wrong/hard counts, average time, right-once count, and streak are derived only from ranked reviews belonging to the active session, not from the user's full long-term history.
- Warm-up reviews and Stats-excluded reviews do not contribute to that active-session Progress panel.
- The Progress panel includes an Initial review bar showing how many distinct cards in the currently selected/available study pool have been reviewed at least once in the active ranked session. Filtering changes the current denominator but never deletes historical learning state.
- Highest-Priority Review remains long-term/adaptive and may use the user's continuous learning history for scoring, but its candidate list MUST be limited to the currently selected/available card pool. If only Lesson 3 is selected, only Lesson 3 cards may appear there. Do not make the list session-only, and do not allow deselected cards into it.

## Sessions and warm-ups

- A new study session is a performance window layered on top of continuous long-term mastery. Starting a new session must never reset mastery, due dates, intervals, response-time history, or adaptive priorities.
- Reviews belonging to a normal session carry a stable session ID/start time so sessions can be compared in Stats.
- Normal sessions may also carry a persistent custom session name. Renaming a session changes only its display identity; it must not change its session ID, review membership, mastery, scheduling, ranking data, or long-term memory. Everywhere a custom name exists, show only that custom name; do not append the old automatic/timestamped name.
- The currently active Greek/Latin session selector shows a stable current-session name with no appended timestamp. If there is a custom name, use it; otherwise use a source-based default such as `Latin · Dickinson Vocabulary`.
- Historical sessions without custom names may retain useful automatic names based on language, source/focus, and date/time so multiple sessions remain distinguishable.
- Users can deliberately continue a past ranked session. Continuing reuses that session's original ID, start time, and custom name when present, while card selection still uses the user's current long-term mastery, due state, speed, accuracy, and adaptive priorities.
- When the user enters the Greek or Latin flashcard app without explicitly selecting/creating another session, default to the most recently reviewed resumable explicit session. Starting a fresh session must be a deliberate user action through Start new session (or an explicitly defined equivalent).
- Both Greek and Latin study toolbars expose one compact Session dropdown in the control position previously used by the standalone New session button. That menu lets the user keep the current session, start a new session, or select a resumable past session.
- Toolbar select controls (including Adaptive/Sequential and Session) use a clean, fully visible dropdown indicator with enough right-side padding; never let the arrow crowd or clip against the rounded edge.
- Do not reintroduce a separate New session button beside the Session dropdown unless explicitly requested; starting a new session belongs in that menu.
- The Stats session table also provides an explicit Continue action for resumable non-legacy sessions, so users can resume either from Stats or directly inside Greek/Latin.
- A resumed session can use the user's current filter selection; resuming must not restore or overwrite old filter state unless explicitly requested.
- The Start gate offers a Personalized Warm-up. The default warm-up contains 5 reviewed cards.
- Warm-up selection is adaptive/personalized and should favor due, slow, difficult, recently missed, or otherwise high-priority cards from the currently selected material.
- Warm-up reviews DO update the continuous long-term memory bank and scheduling because they are real recall practice.
- Warm-up reviews are tagged separately and MUST NOT inflate or distort ranked main-session scores.
- After the warm-up completes, return to the Start gate and create a fresh ranked session window where the active controller explicitly requires that behavior; do not reset long-term learning memory.

## Review and mastery behavior

- Correctness and difficulty remain separate recorded inputs. When an answer is revealed, correctness defaults to `Right` for every card, while difficulty is selected automatically from the captured active front-side recall time.
- Automatic difficulty thresholds are: under 3.00 seconds = `Easy`; 3.00 seconds through under 10.00 seconds = `Medium`; 10.00 seconds or more = `Hard`.
- These are defaults, not irreversible grades. The user may change correctness and difficulty independently before Save & Next.
- Never overwrite a user's manual Right/Wrong or Easy/Medium/Hard change after the default has been shown.
- Response time is recorded independently and remains part of adaptive priority/scheduling in addition to the selected correctness and difficulty.
- Review scheduling continues to consider correctness, difficulty, response time, recency, strength, and due state as implemented by the study engine.
- Staged decks preserve their configured unlocking behavior. Do not expose locked cards early.
- Mastered cards continue to recur according to the scheduling system; mastery must not remove them permanently from review.
- Priority lists show prompts only and only from the currently selected/available card pool. Never reveal answers in Highest-Priority Review and never show a deselected card there.
- Back restores the pre-review snapshot and reuses the review event ID; it must never count both the original grade and the corrected grade.
- Back preserves the original response time and the review's session/warm-up classification unless explicitly changed.
- Back/correction restores the saved grade for editing; it must not silently recalculate a new automatic default from the old response time.
- Skip must not be treated as a correct answer or mastery event unless explicitly requested.

## Flashcard timing

- The front timer displays hundredths of a second.
- The timer measures only active time spent viewing the unrevealed front of the current card.
- The timer stops when the answer is revealed; that captured value is used to choose the initial Easy/Medium/Hard difficulty. Correctness starts as Right regardless of elapsed time.
- Time while the browser tab/window is hidden or unfocused must never count.
- A study session begins behind an explicit Start gate. The timer remains at rest until the user presses Start or a non-control key.
- The Start gate also has an explicit Pause/Start-gate path available without leaving the browser tab.
- If the study tab/window loses focus or becomes hidden while an unrevealed card is active, require the Start gate again on return. Do not automatically resume timing merely because focus/visibility returns.
- The keypress used to dismiss the Start gate must not also reveal, grade, skip, save, or otherwise act on the card.
- Toolbar controls and Start-gate buttons retain normal keyboard behavior while the gate is open; interacting with them must not be misinterpreted as the global "press any key to start" gesture.
- Moving normally from one card to the next within an already active, focused study session does not require a new Start gate.
- Correcting a previous grade preserves the originally captured response time unless the task explicitly changes that behavior.
- After Reveal, flipping back to the question side and then to the answer side does not restart or add time to the timer.

## Keyboard and interaction behavior

- Space reveals an unrevealed card after the Start gate has been dismissed; reveal also fills `Right` plus the time-based difficulty default.
- After reveal, Enter toggles correctness between Right and Wrong without saving.
- After reveal, Shift+Enter flips between question and answer without saving and without adding response time.
- After reveal, R = Right and W = Wrong and may override or confirm the automatic correctness selection.
- After reveal, 1 = Easy, 2 = Medium, and 3 = Hard and may override the automatic difficulty selection.
- Clicking an unrevealed question card reveals the answer. After reveal, clicking whichever card face is visible flips to the opposite face, including clicking the answer side to return to the question.
- Because reveal supplies both defaults, Space after reveal = Save & Next unless the grade state is deliberately cleared by future UI behavior.
- The difficulty controls remain visible beneath the Right/Wrong controls so the user can override the suggested value before saving.
- Do not let global study shortcuts interfere with typing in inputs, textareas, selects, editable regions, listboxes, toolbar controls, Start-gate controls, or native activation of ordinary buttons. A focused flashcard face is the exception: Enter/Shift+Enter retain the study shortcuts rather than triggering an unintended face-button click.
- When adding overlays or dialogs, preserve keyboard accessibility and prevent the activating/dismissing key from leaking through to underlying controls.

## Continuous memory and synchronization

- Each user has a continuous Greek and Latin memory bank across sessions and logins.
- Deselecting a source, lesson, part of speech, grammar category, direction, or other filter must never delete that source's stored progress.
- Guest/local progress and signed-in/cloud progress continue to work according to the existing repository design.
- Do not erase or reset user progress as a side effect of UI or deck changes.
- Review corrections must not create duplicate review events.
- Preserve compatibility with existing stored progress whenever practical; migrations must be deliberate and documented.

## Stats, intrinsic difficulty, and proficiency score

- `/stats` is one unified Stats page covering both Greek and Latin and appears in the primary navigation. Greek and Latin study pages may also link to it.
- Stats text must remain legible in both light and dark themes. Use foreground/muted-foreground text variables for text; do not use a background fill token such as `--muted` as a text color.
- Stats include per-card total recall time, average/last recall time, accuracy, reviews, mistakes, difficulty ratings, best streak, last review, hardest cards, slowest cards, most reviewed cards, and most improved cards.
- The card-by-card Stats table is a compact preview by default rather than rendering every reviewed card at once. Keep Show more, Show all, and Collapse-to-preview controls so deep inspection is available without overwhelming the page.
- Stats retain Forward/Reverse separation and include Henle Whole Charts as their own study mode.
- Stats rank explicit study sessions. Legacy history without explicit session IDs may be grouped into inferred sessions without altering stored data.
- The Stats page provides a multi-select session scope. Users can view all sessions, one session, or any selected combination; the proficiency summaries, card analysis, recent reviews, and trend views must follow the selected scope.
- Session management belongs directly inside Stats > Choose sessions; do not add a separate session-management card/panel. Double-click an explicit session name there for Finder/Explorer-style inline renaming, and keep Delete in the same row.
- Legacy/inferred session buckets created from pre-session-ID review history must also be renameable and deletable from Stats > Choose sessions. Their storage origin (local or cloud) must not make them unmanageable.
- Deleting a session is permanent for session identity and Stats visibility: the session must disappear from Stats and all resumable Session menus and stale local/cloud state must not resurrect it. Reviews that supplied adaptive learning evidence are de-sessionized/marked Stats-excluded rather than used to rebuild or roll back card-learning state. Preserve mastery, correctness/difficulty aggregates, strength, intervals, due dates, adaptive-priority inputs, response-time aggregates, review sequence, and Dickinson unlock progress. Stats/proficiency are recomputed only from non-excluded sessions/reviews.
- Session deletion markers/tombstones must remain persistent enough that an already-open flashcard app or stale cloud/local merge cannot restore a deleted session. If an open app was using a deleted session, fall back to the newest remaining resumable session or a new session if none remains.
- Session deletion must require a final confirmation explaining both sides of that behavior: what session/Stats/menu history will disappear and what long-term adaptive learning state will remain unchanged.
- Explicit resumable sessions retain Continue actions in the session rankings. Custom session names persist with review history and survive reload/login synchronization.
- Stats include lightweight trend graphs for session score and active recall time over time. Avoid large charting dependencies when simple native/SVG rendering is sufficient.
- Recent Reviews is a combined Greek + Latin activity feed, visually separated from both language-specific Stats sections.
- Intrinsic card difficulty is separate from the user's Easy/Medium/Hard rating.
- Greek intrinsic difficulty rises with lesson progression; grammar may add complexity. Later lessons should generally be worth more than earlier lessons.
- Dickinson vocabulary intrinsic difficulty rises with frequency rank/rarity. Rarer words should generally be worth more than very common words.
- Henle intrinsic difficulty follows rule progression plus grammatical complexity encoded in section/subsection, voice, mood/form, special/irregular families, and whole-chart reconstruction.
- The unified proficiency score is 1–100 with tier labels: Novice, Developing, Proficient, Advanced, Expert, Master.
- A high score must require demonstrated performance, not merely attempting hard material. Difficulty raises potential reward, while accuracy, active recall speed, retention/mastery breadth, and streaks determine whether that reward is earned.
- Stats show overall, Greek, and Latin proficiency plus reviewed difficulty and hardest mastered material.
- Ranked session scores account for intrinsic difficulty, accuracy, speed, and streaks. Warm-up activity is excluded from ranked session scoring.