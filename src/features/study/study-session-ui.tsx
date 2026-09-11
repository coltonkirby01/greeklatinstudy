import { Gauge, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { directionalCopy, formatResponseTime, priorityReason } from "./engine";
import { studyEnterShortcut } from "./study-shortcuts";
import type { CardProgress, DirectionalCardCopy, ReviewDifficulty, ReviewResult, StudyCard, StudyDirection, StudyStats } from "./types";

type Priority = Array<{ card: StudyCard; progress: CardProgress; score: number }>;

function percent(value: number | null) { return value === null ? "—" : `${(value * 100).toFixed(value >= 0.995 ? 0 : 1)}%`; }

const sharedStudyPolishCss = `.study-toolbar{width:100%}.toolbar-control-group{width:100%;display:grid;grid-template-columns:max-content minmax(175px,.8fr) minmax(220px,1.45fr) max-content;gap:.6rem;align-items:stretch}.toolbar-control-group>*{min-width:0}.compact-select-label,.compact-select-label select{width:100%}.toolbar-timer{min-height:38px;display:inline-flex;align-items:stretch;overflow:hidden;border:1px solid var(--border);border-radius:.65rem;background:var(--panel);font-variant-numeric:tabular-nums}.toolbar-timer-value{min-width:4.55rem;padding:.45rem .42rem .45rem .7rem;display:inline-flex;align-items:center;justify-content:flex-end;color:var(--foreground);font-weight:800}.toolbar-timer-toggle{width:2.35rem;min-height:36px;padding:0;display:grid;place-items:center;border:0;border-left:1px solid var(--border);color:var(--burgundy);background:transparent;cursor:pointer}.toolbar-timer-toggle:hover:not(:disabled){background:var(--panel-2)}.toolbar-timer-toggle:disabled{opacity:.42;cursor:default}.toolbar-timer-toggle svg{width:1rem;height:1rem}.flashcard-scene{position:relative}.flashcard-card-controls{position:absolute;top:.7rem;right:.7rem;left:.7rem;z-index:12;display:flex;gap:.55rem;align-items:flex-start;justify-content:space-between;pointer-events:none}.flashcard-card-controls.is-question .card-overlay-actions:has(.save-card-button){display:none}.flashcard-card-controls.is-answer{justify-content:flex-end}.flashcard-card-controls.is-answer .card-overlay-actions:not(:has(.save-card-button)){display:none}.card-overlay-actions{display:flex;gap:.45rem;align-items:center;pointer-events:auto}.card-overlay-button{min-height:34px;padding:.38rem .55rem;border-radius:.55rem;background:color-mix(in srgb,var(--panel) 94%,transparent);box-shadow:0 3px 12px color-mix(in srgb,var(--foreground) 8%,transparent);backdrop-filter:blur(6px);font-size:.75rem}.card-overlay-button svg{width:.9rem;height:.9rem}.save-card-button[aria-pressed=true]{border-color:color-mix(in srgb,var(--burgundy) 58%,var(--border));color:var(--burgundy);background:color-mix(in srgb,var(--burgundy) 10%,var(--panel))}.flashcard-actions-only{justify-content:flex-end}.session-stats-link{width:100%;margin-top:.85rem}.flashcard-face:has(.chart-scroll){padding:clamp(.7rem,2.1vw,1.2rem);overflow:hidden}.flashcard-face:has(.chart-scroll) .answer-block,.flashcard-face:has(.chart-scroll) .henle-chart-face{width:100%;gap:.5rem}.flashcard-face:has(.chart-scroll) .henle-card-title{font-size:clamp(1rem,2vw,1.4rem);line-height:1.15}.flashcard-face:has(.chart-scroll) .chart-instruction{font-size:.8rem;line-height:1.25}.flashcard-face:has(.chart-scroll) .chart-scroll{width:100%;max-width:100%;overflow:visible}.flashcard-face:has(.chart-scroll) .henle-chart{width:100%;table-layout:fixed;font-size:clamp(.68rem,1.35vw,.86rem);line-height:1.12}.flashcard-face:has(.chart-scroll) .henle-chart th,.flashcard-face:has(.chart-scroll) .henle-chart td{min-width:0;padding:clamp(.23rem,.8vw,.38rem)}.henle-chart .greek-front.compact-greek,.flashcard-face:has(.chart-scroll) .latin-front.compact-latin{font-size:clamp(1rem,2.2vw,1.55rem);line-height:1.12}.flashcard-face:has(.chart-scroll) [data-study-control="audio"]{margin-top:.4rem!important}@media(max-width:840px){.toolbar-control-group{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.toolbar-timer-value{min-width:4.2rem;padding-left:.55rem}.flashcard-face:has(.chart-scroll) .henle-chart th,.flashcard-face:has(.chart-scroll) .henle-chart td{padding:.2rem}.flashcard-face:has(.chart-scroll) .henle-chart .greek-front.compact-greek,.flashcard-face:has(.chart-scroll) .latin-front.compact-latin{font-size:clamp(.88rem,4vw,1.2rem)}}@media(max-width:480px){.toolbar-control-group{grid-template-columns:1fr}.flashcard-card-controls{top:.45rem;right:.45rem;left:.45rem}.card-overlay-button{padding:.32rem .42rem;font-size:.7rem}}`;

export function StudyStartGate({ onStart, onWarmup }: { onStart: () => void; onWarmup?: () => void }) {
  return <div className="study-start-gate" role="region" aria-label="Start flashcard timing">
    <div className="study-start-card">
      <p className="eyebrow">Timer paused</p>
      <h2>Ready?</h2>
      <p>Choose direction or card order above while paused, then begin when ready.</p>
      <div className="study-start-actions">
        <button type="button" className="primary-button study-start-button" onClick={onStart}>Start</button>
        {onWarmup && <button type="button" className="small-outline-button study-warmup-button" onClick={onWarmup}>Personalized warm-up · 5 cards</button>}
      </div>
      <span>or press any key outside the study controls to begin</span>
    </div>
  </div>;
}

export function StudyCardFaces({ revealed, showingAnswer, backtracking, onReveal, onFlip, front, back, frontControls }: {
  revealed: boolean;
  showingAnswer: boolean;
  backtracking: boolean;
  onReveal: () => void;
  onFlip: () => void;
  front: ReactNode;
  back: ReactNode;
  frontControls?: ReactNode;
}) {
  return <div className={`flashcard-scene ${showingAnswer ? "is-flipped" : ""} ${backtracking ? "is-backtracking" : ""}`}>
    {frontControls && <div className={`flashcard-card-controls ${showingAnswer ? "is-answer" : "is-question"}`}>{frontControls}</div>}
    <div className="flashcard-inner">
      <button type="button" className="flashcard-face flashcard-front-face" onClick={() => revealed ? onFlip() : onReveal()} aria-label={revealed ? "Return to answer" : "Reveal answer"} aria-hidden={showingAnswer} tabIndex={showingAnswer ? -1 : 0}>{front}</button>
      <button type="button" className="flashcard-face flashcard-back-face" onClick={onFlip} aria-label="Return to question" aria-hidden={!showingAnswer} tabIndex={showingAnswer ? 0 : -1}>{back}</button>
    </div>
  </div>;
}

export function StudyRatingControls({ revealed, result, difficulty, editing, onReveal, onFlip, onResult, onDifficulty, onSave }: {
  revealed: boolean;
  result: ReviewResult | null;
  difficulty: ReviewDifficulty | null;
  editing: boolean;
  onReveal: () => void;
  onFlip: () => void;
  onResult: (value: ReviewResult) => void;
  onDifficulty: (value: ReviewDifficulty) => void;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!revealed) return;
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const shortcut = studyEnterShortcut({
        key: event.key,
        shiftKey: event.shiftKey,
        revealed,
        result,
        typingTarget: Boolean(target?.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], [role='listbox']")),
        controlsTarget: Boolean(target?.closest("button:not(.flashcard-face), [data-study-control], .session-toolbar, .study-start-card")),
      });
      if (!shortcut) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (shortcut.type === "result") onResult(shortcut.value);
    }
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  }, [onResult, result, revealed]);

  const difficultyKeys: Record<ReviewDifficulty, string> = { easy: "1", medium: "2", hard: "3" };
  return <div className="study-controls">
    {!revealed ? <button className="primary-button study-primary" type="button" onClick={onReveal}>Reveal Answer <kbd>Space</kbd></button> : <>
      <button className="small-outline-button" type="button" onClick={onFlip}>Flip question / answer <kbd>F</kbd></button>
      <div className="rating-grid" style={{ gridTemplateColumns: "1fr" }}>
        <fieldset className="rating-box"><legend className="sr-only">Correctness</legend><div className="choice-row two-choices"><button type="button" className="rating-choice right-choice" aria-pressed={result === "right"} onClick={() => onResult("right")}>Right {result === "wrong" && <kbd>Enter</kbd>}</button><button type="button" className="rating-choice wrong-choice" aria-pressed={result === "wrong"} onClick={() => onResult("wrong")}>Wrong {result === "right" && <kbd>Enter</kbd>}</button></div></fieldset>
        <fieldset className="rating-box"><legend className="sr-only">Difficulty</legend><div className="choice-row three-choices">{(["easy", "medium", "hard"] as ReviewDifficulty[]).map((value) => <button key={value} type="button" className="rating-choice" aria-pressed={difficulty === value} onClick={() => onDifficulty(value)}>{value[0].toUpperCase() + value.slice(1)} <kbd>{difficultyKeys[value]}</kbd></button>)}</div></fieldset>
      </div>
      <button className="primary-button study-primary" type="button" disabled={!result || !difficulty} onClick={onSave}>{editing ? "Save Corrected Grade" : "Save & Next"} <kbd>Space</kbd></button>
    </>}
  </div>;
}

export function StudySidebar({ copy, direction, stats, initialReviewed, initialTotal, initialPercent, priority, priorityPrompt, cardCopy }: {
  copy: DirectionalCardCopy;
  direction: StudyDirection;
  stats: StudyStats;
  initialReviewed: number;
  initialTotal: number;
  initialPercent: number;
  priority: Priority;
  priorityPrompt?: (card: StudyCard, copy: DirectionalCardCopy) => ReactNode;
  cardCopy?: (card: StudyCard, direction: StudyDirection) => DirectionalCardCopy;
}) {
  return <aside className="study-sidebar">
    <style>{sharedStudyPolishCss}</style>
    <section className="panel-surface stats-panel">
      <div className="sidebar-heading"><div><p className="eyebrow">Current session</p><h2>Progress · {copy.sideLabel}</h2></div><Gauge /></div>
      <div className="stats-grid"><div className="stat-tile"><span>Available</span><strong>{stats.available}</strong></div><div className="stat-tile"><span>Reviewed</span><strong>{stats.reviewed}</strong></div><div className="stat-tile"><span>Accuracy</span><strong>{percent(stats.accuracy)}</strong></div><div className="stat-tile"><span>Ever wrong</span><strong>{stats.everWrong}</strong></div><div className="stat-tile"><span>Marked hard</span><strong>{stats.markedHard}</strong></div><div className="stat-tile"><span>Avg. time</span><strong>{formatResponseTime(stats.averageResponseTimeMs)}</strong></div><div className="stat-tile"><span>Right once</span><strong>{stats.mastered}</strong></div><div className="stat-tile"><span>Best streak</span><strong>{stats.bestStreak}</strong></div></div>
      <div className="progress-block"><div className="progress-label"><span>Initial review · {initialReviewed}/{initialTotal}</span><strong>{Math.round(initialPercent)}%</strong></div><div className="progress-track" role="progressbar" aria-label="Initial review of selected cards" aria-valuenow={initialPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${initialPercent}%` }} /></div></div>
      <Link className="small-outline-button session-stats-link" to="/stats">Stats</Link>
    </section>
    <section className="panel-surface priority-panel">
      <div className="sidebar-heading"><div><p className="eyebrow">Prompts only</p><h2>Highest-Priority Review</h2></div><RotateCcw /></div>
      <div className="priority-list">{priority.map(({ card, progress, score }) => { const itemCopy = cardCopy ? cardCopy(card, direction) : directionalCopy(card, direction); return <div className="priority-row" key={`${card.deckId}:${card.id}`}><span className="priority-meta">{card.rank ? `#${card.rank}` : card.category ?? "Card"}</span><span className="priority-prompt">{priorityPrompt ? priorityPrompt(card, itemCopy) : itemCopy.prompt}<small>{priorityReason(progress)}</small></span><span className="priority-score">{Math.max(0, Math.round(score))}</span></div>; })}</div>
      <p className="source-note">Answers remain hidden. Only the currently selected cards can appear here; their correctness, difficulty, recall time, recency, strength, and due dates affect priority.</p>
    </section>
  </aside>;
}
