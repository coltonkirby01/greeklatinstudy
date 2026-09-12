import {
  EASY_RECALL_LIMIT_MS,
  HARD_RECALL_START_MS,
  INITIAL_AUTO_WRONG_REVIEWS,
  INITIAL_COVERAGE_MULTIPLIER,
  RECENT_AUTO_GRADE_WINDOW,
} from "../features/study/session-review";

const coveragePercent = Math.round(INITIAL_COVERAGE_MULTIPLIER * 100);
const easySeconds = EASY_RECALL_LIMIT_MS / 1_000;
const hardSeconds = HARD_RECALL_START_MS / 1_000;

/**
 * User-facing explanation of consequential study behavior.
 *
 * MAINTENANCE INVARIANT: when an agent changes study/session/timer/grading/
 * progress behavior in a way a learner would notice, update this guide in the
 * same change. Keep implementation-linked numbers sourced from shared constants
 * rather than duplicating them here whenever practical.
 */
export function HowSiteWorks() {
  return (
    <details className="site-guide panel-surface">
      <summary>How this site works</summary>
      <div className="site-guide-body">
        <p className="site-guide-intro">The study apps keep long-term memory for each card while also tracking the performance of the session you are currently studying. The sections below explain the parts that materially affect what you see and how cards are chosen.</p>

        <details className="site-guide-section">
          <summary>Adaptive and Sequential study</summary>
          <div>
            <h3>Adaptive</h3>
            <p>Adaptive study gives more attention to cards that need it. Priority is influenced by past Right/Wrong results, Easy/Medium/Hard ratings, response time, recency, current strength, whether a card is due, and whether it has been learned correctly before. Recent cards are also discouraged from repeating immediately when the pool is large enough.</p>
            <h3>Initial coverage</h3>
            <p>At the beginning of an Adaptive session, difficult cards may repeat, but they cannot crowd out new cards indefinitely. Every currently selected and unlocked card must be seen during the initial pass by no later than {coveragePercent}% of that pool's size, rounded up. For example, 20 selected cards must all appear by card 25. Once every selected card has appeared at least once, this coverage constraint ends and the normal Adaptive algorithm takes over.</p>
            <h3>Sequential</h3>
            <p>Sequential study follows the selected cards in their defined order and wraps to the beginning after the last card. It does not use Adaptive priority to choose the next card.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Initial completion and Initial mastery</summary>
          <div>
            <p>The session progress bar first shows <strong>Initial completion</strong>: the share of the currently selected and unlocked cards reviewed at least once in that ranked session. When every selected card has been seen, the same bar changes to <strong>Initial mastery</strong>.</p>
            <p>Initial mastery means the share of those selected cards that have received at least one <strong>Right</strong> answer in the session. Changing filters changes the denominator to the cards currently selected; it does not erase earlier learning history.</p>
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
          <summary>Learner, Reviewer, and other sessions</summary>
          <div>
            <h3>Permanent sessions</h3>
            <p>Greek and Latin each have one permanent <strong>Learner</strong> session and one permanent <strong>Reviewer</strong> session. They are session lanes for organizing study history and statistics; they are not separate users, accounts, or separate copies of your learning memory.</p>
            <h3>Shared long-term memory</h3>
            <p>Changing sessions does not reset a card. Adaptive priority continues to use the card's long-term history, due state, speed, difficulty, and strength. Custom sessions can also be created or resumed so a particular study period can be compared in Stats without splitting the underlying learning record.</p>
            <h3>Warm-up</h3>
            <p>The optional personalized warm-up uses high-priority selected cards. Warm-up reviews improve long-term card memory and scheduling, but they are excluded from the ranked session's progress and performance statistics.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Directions, filters, and staged vocabulary</summary>
          <div>
            <h3>Forward and Reverse</h3>
            <p>When a deck supports both directions, Forward and Reverse keep separate review histories, mastery, response times, and scheduling. Success in one direction does not automatically count as success in the other.</p>
            <h3>Selected cards</h3>
            <p>Filters define the active study pool. They do not delete progress when a category is deselected. Adaptive review, Sequential review, the session progress bar, and Highest-Priority Review are restricted to the material currently selected and available.</p>
            <h3>Staged vocabulary</h3>
            <p>Some large vocabulary decks introduce cards in stages. Locked cards stay out of the active pool until the current stage meets its learning requirement; adding grammar or another source to the session does not bypass that lock.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Timer, keyboard, Back, and Skip</summary>
          <div>
            <p>The response timer measures active time on the unrevealed question side. It pauses when the tab or window is hidden or loses focus and stops when the answer is revealed. Returning from an interruption requires the Start gate again.</p>
            <p>The Start gate begins only when you click Start or press Space. During study, Space reveals the question and, after reveal, saves and advances. Enter toggles Right/Wrong after reveal; 1, 2, and 3 choose Easy, Medium, and Hard; F flips between question and answer. Text-entry fields keep normal typing behavior.</p>
            <p><strong>Back</strong> truly undoes the preceding saved grade and lets you replace it without double-counting the review. <strong>Skip</strong> advances without recording a grade or improving accuracy.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Progress, Stats, and cloud sync</summary>
          <div>
            <p>The progress panel beside the cards describes the active ranked session. The Stats page lets you compare broader history and sessions. Long-term adaptive memory persists across sessions.</p>
            <p>When signed in, progress, sessions, saved cards, timing, and review history synchronize with your private account so the same learning state can continue on another device. Guest study can work locally, but cloud synchronization requires an account.</p>
          </div>
        </details>

        <details className="site-guide-section">
          <summary>Greek pronunciation and audio</summary>
          <div>
            <p>Greek cards preserve the written accents and other orthographic marks supplied by the course source. The pronunciation layer keeps a Classical Attic pronunciation representation, including the distinction among acute, grave, and circumflex accents.</p>
            <p>Generated card audio is shared and cached in Supabase so replaying an existing recording does not spend new generation credits. ElevenLabs is used as a practical speech approximation; its audio cannot reproduce reconstructed Ancient Greek pitch accent with complete phonetic precision.</p>
          </div>
        </details>
      </div>
    </details>
  );
}
