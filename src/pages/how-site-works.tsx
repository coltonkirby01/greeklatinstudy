import {
  EASY_RECALL_LIMIT_MS,
  HARD_RECALL_START_MS,
  INITIAL_AUTO_WRONG_REVIEWS,
  INITIAL_COVERAGE_MULTIPLIER,
  RECENT_AUTO_GRADE_WINDOW,
} from "../features/study/session-review";
import { ADAPTIVE_PROFILES } from "../features/study/adaptive-settings";
import "./how-site-works.css";

const coveragePercent = Math.round(INITIAL_COVERAGE_MULTIPLIER * 100);
const diverseCoveragePercent = Math.round(ADAPTIVE_PROFILES[1].coverageMultiplier * 100);
const concentratedCoveragePercent = Math.round(ADAPTIVE_PROFILES[3].coverageMultiplier * 100);
const easySeconds = EASY_RECALL_LIMIT_MS / 1_000;
const hardSeconds = HARD_RECALL_START_MS / 1_000;

/**
 * User-facing explanation of consequential study behavior.
 *
 * MAINTENANCE INVARIANT: when an agent changes study/session/timer/grading/
 * progress or pronunciation/audio behavior in a way a learner would notice,
 * update this guide in the same change. Keep implementation-linked numbers
 * sourced from shared constants rather than duplicating them here whenever
 * practical.
 */
export function HowSiteWorks() {
  return (
    <details className="site-guide panel-surface">
      <summary>How this site works</summary>
      <div className="site-guide-body">
        <p className="site-guide-intro">The study apps keep long-term memory for each card while also showing live progress for the page visit you are currently studying. The sections below explain the parts that materially affect what you see and how cards are chosen.</p>

        <details className="site-guide-section">
          <summary>Adaptive, Sequential, and Shuffle study</summary>
          <div>
            <h3>Adaptive</h3>
            <p>Adaptive study gives more attention to cards that need it. Priority is influenced by past Right/Wrong results, Easy/Medium/Hard ratings, response time, recency, current strength, whether a card is due, and whether it has been learned correctly before. The repetition control has three levels: <strong>1: Diverse</strong> favors breadth and fewer immediate repeats; <strong>2: Standard</strong> balances breadth and review; <strong>3: Concentrated</strong> focuses more aggressively on recently Wrong or Hard cards.</p>
            <h3>Initial coverage</h3>
            <p>Difficult cards may repeat during initial coverage, but they cannot crowd out unseen cards indefinitely. In the main Greek and Latin apps, Diverse forces complete first coverage by about {diverseCoveragePercent}% of the selected pool, Standard by {coveragePercent}%, and Concentrated by about {concentratedCoveragePercent}%, each rounded up. For example, with Standard and 20 selected cards, all 20 must appear by card 25. Once every selected card has appeared, normal Adaptive selection takes over.</p>
            <p>The Progress panel's <strong>Words/forms left</strong> dropdown lists selected cards not yet seen during the current page visit. Clicking one queues that word or form to be shown next without changing its long-term history.</p>
            <h3>Sequential</h3>
            <p>Sequential study follows the selected cards in their defined order and wraps to the beginning after the last card. It does not use Adaptive priority to choose the next card.</p>
            <h3>Shuffle</h3>
            <p>Shuffle uses the same selected card pool as Sequential but randomizes the order. Every currently selected and available card appears exactly once before a new shuffle cycle begins. After the full pool has been covered, the site creates a fresh random order for the next cycle rather than repeating the same shuffle pattern.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Visit completion and Visit mastery</summary>
          <div>
            <p>The live progress bar first shows <strong>Visit completion</strong>: the share of the currently selected and unlocked cards reviewed at least once since this Greek or Latin page was loaded. When every selected card has been seen during that page visit, the same bar changes to <strong>Visit mastery</strong>.</p>
            <p>Visit mastery means the share of those selected cards that have received at least one <strong>Right</strong> answer during the current page visit. A hard reload or leaving and re-entering the study page starts this live progress at zero again. That reset affects only the on-page progress display; it does not erase saved reviews, mastery, scheduling, Stats, or long-term Adaptive memory. Changing filters changes the denominator to the cards currently selected.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Wrong Bank and page-visit review tools</summary>
          <div>
            <p>The Progress panel keeps a page-visit <strong>Wrong Bank</strong>. <strong>Highest-Priority Review</strong> is now a dropdown inside that same Progress box, so long-term Adaptive review suggestions stay available without occupying a separate sidebar panel. A card enters the bank when it is saved Wrong and leaves if that same review is corrected to Right with Back. The bank resets when the page is reloaded or re-entered; it does not alter permanent review history.</p>
            <p>Open Wrong Bank to see each missed Greek or Latin form with its English answer. <strong>Flash These</strong> starts a temporary run containing only those missed cards. When the run finishes, the popup lets you repeat the same bank or return to the larger selected study pool.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Automatic grade suggestions</summary>
          <div>
            <h3>Right / Wrong suggestion</h3>
            <p>The automatic correctness choice is a suggestion, not a final grade. For a card's first {INITIAL_AUTO_WRONG_REVIEWS} saved reviews in a particular study direction, the suggested result is Wrong. Beginning with the next attempt, the site looks at that same card's {RECENT_AUTO_GRADE_WINDOW} most recent saved reviews and suggests the majority result. This is per card and per study direction, not a judgment based on the last three different cards you studied.</p>
            <h3>Easy / Medium / Hard suggestion</h3>
            <p>Difficulty is suggested independently from active recall time: under {easySeconds.toFixed(2)} seconds is Easy, {easySeconds.toFixed(2)} through under {hardSeconds.toFixed(2)} seconds is Medium, and {hardSeconds.toFixed(2)} seconds or more is Hard. You can change either correctness or difficulty before saving.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Learner, Reviewer, and custom sessions</summary>
          <div>
            <h3>Permanent sessions</h3>
            <p>Greek and Latin each have one permanent <strong>Learner</strong> session and one permanent <strong>Reviewer</strong> session. They are session lanes for organizing study history and statistics; they are not separate users, accounts, or separate copies of your learning memory. These permanent sessions cannot be renamed or deleted.</p>
            <h3>Create a custom session</h3>
            <p>You can create additional study sessions whenever you want a separate Stats grouping—for example, a particular homework set, lesson, exam review, or study day. In the Greek or Latin flashcard toolbar, open the <strong>Session</strong> menu and choose <strong>Start new custom session</strong>. Persistent session history remains separate from the live page-visit Progress display.</p>
            <h3>Resume, rename, or delete a custom session</h3>
            <p>Previous explicit sessions can be resumed from the Session menu, and the Stats page can be used to continue a session as well. Custom sessions can be renamed in Stats so meaningful study periods are easy to recognize. They can also be deleted from Stats; deleting a custom session removes that session grouping and its contribution to Stats, but it does <strong>not</strong> erase the card mastery, scheduling, response-time evidence, or Adaptive learning memory earned while studying it.</p>
            <h3>Shared long-term memory</h3>
            <p>Changing between Learner, Reviewer, and custom sessions does not reset a card. Adaptive priority continues to use the card's long-term history, due state, speed, difficulty, and strength. Sessions organize and compare study periods without splitting the underlying learning record.</p>
            <h3>Warm-up</h3>
            <p>The optional personalized warm-up uses high-priority selected cards. Warm-up reviews improve long-term card memory and scheduling, but they are excluded from ranked session performance statistics and from the normal live study-progress count.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Directions, filters, and staged vocabulary</summary>
          <div>
            <h3>Forward and Reverse</h3>
            <p>When a deck supports both directions, Forward and Reverse keep separate review histories, mastery, response times, and scheduling. Success in one direction does not automatically count as success in the other. In the main Greek and Latin apps, the Forward/Reverse control is inside <strong>Choose cards</strong>. The response timer sits at the far right of the study toolbar so card-order and session controls read naturally from left to right.</p>
            <h3>Selected cards</h3>
            <p>Filters define the active study pool. They do not delete progress when a category is deselected. Adaptive, Sequential, Shuffle, live page-visit Progress, and Highest-Priority Review are restricted to the material currently selected and available.</p>
            <p>Every built-in card can also be selected or deselected individually in <strong>Choose cards</strong>. All Groton course material is grouped under the top-level <strong>Greek Lessons (Groton)</strong> heading, with Lessons 1–10 beneath it. Greek Lessons 3–10 are organized around <strong>Vocabulary</strong> and <strong>Endings</strong>; opening a lesson's Vocabulary heading shows its individual words immediately, with no extra “Vocabulary words” layer. <strong>New Testament Vocab (Kubo)</strong> remains a separate top-level vocabulary family from the Groton lessons, ordered from highest to lowest New Testament frequency. It is divided into parent bands of 1,000+, 500–999, 250–499, 150–249, 100–149, 75–99, 60–74, and 50–59 occurrences, and each band opens directly to its individual words. The answer side shows both the occurrence count and frequency rank. Kubo's separate John special-vocabulary lists are not imported unless a word also appears on the general frequency list. In both the Groton and Kubo exact-word dropdowns, each Greek entry also shows a compact one-word English gloss derived from that card's source meaning so the list can be scanned quickly. Greek paradigm cards remain source data but are not exposed in the active lesson menu. Dickinson's larger Latin vocabulary list is divided into 10-card ranges such as <strong>1–10</strong> and <strong>11–20</strong>, which open to the exact individual cards.</p>
            <p>On the answer side of every built-in Greek and Latin card, press <strong>D</strong> or click <strong>Deselect card</strong> to mark that card for removal. The button changes to <strong>Deselected</strong>, but the current card stays visible and the Start gate does not reopen. When you press Space to Save &amp; Next, the grade is saved, that card is removed from the active Choose cards pool, and study continues directly to the next selected card. The exact checkbox in Choose cards reflects the same individual selection state. Reselecting that exact card restores it, and selecting any parent heading that contains the card restores all cards beneath that parent. There is no separate deselected-card list.</p>
            <h3>Staged vocabulary</h3>
            <p>Some large vocabulary decks introduce cards in stages. Locked cards stay out of the active pool until the current stage meets its learning requirement; adding grammar or another source to the session does not bypass that lock.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Timer, keyboard, Back, and Skip</summary>
          <div>
            <p>The response timer measures active time on the unrevealed question side and sits at the far right of the main Greek/Latin toolbar. It pauses when the tab or window is hidden or loses focus. While question-side timing is running, <strong>Z</strong> stops the timer and reopens the Start gate. Clicking anything on the page also pauses question-side timing and reopens the Start gate; the clicked page control can still open or change normally, but clicking the flashcard itself does not reveal it on that interrupting click. Revealing the answer stops the timer as well.</p>
            <p>The Start gate begins only when you click Start or press Space. During study, Space reveals the question and, after reveal, saves and advances. On the unrevealed question side, plain Enter uses <strong>Back</strong> when a preceding saved grade is available; after reveal, Enter toggles Right/Wrong. Keys 1, 2, and 3 choose Easy, Medium, and Hard; F flips between question and answer. On the visible answer side, D marks or unmarks the current card for deselection on the next Save &amp; Next. S saves or unsaves a card, and A controls audio when audio is available. Text-entry fields keep normal typing behavior.</p>
            <p><strong>Back</strong> truly undoes the preceding saved grade and lets you replace it without double-counting the review. <strong>Skip</strong> advances without recording a grade or improving accuracy.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Progress and Stats</summary>
          <div>
            <h3>Progress beside the flashcards</h3>
            <p>The Progress panel beside the Greek and Latin cards describes the <strong>current page visit</strong>, not your lifetime history and not the full lifetime of the persistent Learner, Reviewer, or custom session. It starts over when the study page is hard-reloaded or re-entered. It includes reviews, distinct cards reviewed, accuracy, cards answered Wrong, cards marked Hard, average response time, cards answered Right at least once, best streak, and the Visit completion / Visit mastery bar for that loaded visit.</p>
            <h3>Choose what Stats analyzes</h3>
            <p>The <strong>Stats</strong> page analyzes your saved Greek and Latin study history. Its session selector can show <strong>all sessions</strong>, one session by itself, or any combination of sessions. The scores, card analysis, trends, and review history shown below the selector all follow that chosen scope. This makes it possible to compare a custom session with Learner or Reviewer, combine several study periods, or return to your complete history.</p>
            <h3>What Stats measures</h3>
            <p>Stats includes overall, Greek, and Latin proficiency; session scores; accuracy and review volume; response time; reviewed-card difficulty; mastery; streak information; and card-level performance. <strong>Session score is now accuracy only:</strong> the percentage of saved reviews answered Right in that session. Speed and card difficulty remain visible for analysis but do not raise or lower a session score. The separate proficiency scores still use broader long-term performance evidence.</p>
            <h3>Sessions in Stats</h3>
            <p>Each permanent or custom session has its own Stats scope. Custom sessions can be renamed, continued, or deleted there. Learner and Reviewer remain permanent. Session-level Stats are organizational: the site's long-term Adaptive memory continues across all of them unless learning data itself is explicitly changed.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Accounts and cloud sync</summary>
          <div>
            <p>When signed in, progress, sessions, saved cards, timing, and review history synchronize with your private account so the same learning state can continue on another device. Guest study can work locally on the current device, but cloud synchronization requires an account.</p>
            <p>Signing in does not create separate learning histories for Learner, Reviewer, or custom sessions. Those sessions all belong to the same account and share the same underlying long-term card memory.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Greek and Latin pronunciation/audio</summary>
          <div>
            <h3>Greek</h3>
            <p>Greek cards preserve the written accents and other orthographic marks supplied by the course source. The pronunciation layer keeps a Classical Attic pronunciation representation, including the distinction among acute, grave, and circumflex accents. ElevenLabs is a practical speech approximation and cannot reproduce reconstructed Ancient Greek pitch accent with complete phonetic precision.</p>
            <h3>Latin</h3>
            <p>Latin Grammar (Henle) includes active and passive indicative paradigms and a 20-card subjunctive set: Active and Passive Present and Imperfect remain separate by conjugation (1–4), while Active Perfect, Active Pluperfect, Passive Perfect, and Passive Pluperfect each place conjugations 1–4 together on one card. It also includes adjective cards for <em>magnus, -a, -um</em> (three separate genders), <em>gravis, -e</em> (Rule 78: two terminations), <em>ācer, ācris, ācre</em> (Rule 80: three terminations), and <em>dīligēns, dīligentis</em> (Rule 82: one termination); and a four-card Participles deck covering present active, perfect passive, future active, and future passive formation. The present active participle declines as a third-declension adjective of one termination. Latin grammar paradigms use a broad, normalized <strong>Medieval Latin</strong> pronunciation designed for scholastic theology, philosophy, and general medieval reading. It is informed principally by Rigg and Stotz rather than tied to one narrow regional accent. Stem/ending dashes are visual teaching marks and are not spoken. Macrons remain on the cards and help preserve inherited stress where useful, but the Medieval Latin audio does not treat Classical vowel length as a phonemic contrast.</p>
            <h3>Shared audio cache</h3>
            <p>Generated Greek and Latin card audio is stored in the shared Supabase cache. Replaying an existing recording uses that cached MP3 and does not spend new generation credits. The audio button uses <strong>A</strong> as its keyboard shortcut when an audio recording is available for the visible card.</p>
          </div>
        </details>
      </div>
    </details>
  );
}