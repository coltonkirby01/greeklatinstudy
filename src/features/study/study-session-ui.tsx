import { Gauge, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { directionalCopy, formatResponseTime, priorityReason } from "./engine";
import type { CardProgress, DirectionalCardCopy, ReviewDifficulty, ReviewResult, StudyCard, StudyDirection, StudyStats } from "./types";

type Priority = Array<{ card: StudyCard; progress: CardProgress; score: number }>;

function percent(value: number | null) { return value === null ? "—" : `${(value * 100).toFixed(value >= 0.995 ? 0 : 1)}%`; }

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

export function StudyCardFaces({ revealed, showingAnswer, backtracking, onReveal, onFlip, front, back }: {
  revealed: boolean;
  showingAnswer: boolean;
  backtracking: boolean;
  onReveal: () => void;
  onFlip: () => void;
  front: ReactNode;
  back: ReactNode;
}) {
  return <div className={`flashcard-scene ${showingAnswer ? "is-flipped" : ""} ${backtracking ? "is-backtracking" : ""}`}>
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
  const difficultyKeys: Record<ReviewDifficulty, string> = { easy: "1", medium: "2", hard: "3" };
  return <div className="study-controls">
    {!revealed ? <button className="primary-button study-primary" type="button" onClick={onReveal}>Reveal Answer <kbd>Space</kbd></button> : <>
      <button className="small-outline-button" type="button" onClick={onFlip}>Flip question / answer <kbd>Enter</kbd></button>
      <div className="rating-grid" style={{ gridTemplateColumns: "1fr" }}>
        <fieldset className="rating-box"><legend>Did you get it right? Suggested from recall time; change if needed.</legend><div className="choice-row two-choices"><button type="button" className="rating-choice right-choice" aria-pressed={result === "right"} onClick={() => onResult("right")}>Right <kbd>R</kbd></button><button type="button" className="rating-choice wrong-choice" aria-pressed={result === "wrong"} onClick={() => onResult("wrong")}>Wrong <kbd>W</kbd></button></div></fieldset>
        <fieldset className="rating-box"><legend>Difficulty is suggested by time: under 3 s Easy, 3 to under 10 s Medium, 10+ s Hard.</legend><div className="choice-row three-choices">{(["easy", "medium", "hard"] as ReviewDifficulty[]).map((value) => <button key={value} type="button" className="rating-choice" aria-pressed={difficulty === value} onClick={() => onDifficulty(value)}>{value[0].toUpperCase() + value.slice(1)} <kbd>{difficultyKeys[value]}</kbd></button>)}</div></fieldset>
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
    <section className="panel-surface stats-panel">
      <div className="sidebar-heading"><div><p className="eyebrow">Current session</p><h2>Progress · {copy.sideLabel}</h2></div><Gauge /></div>
      <div className="stats-grid"><div className="stat-tile"><span>Available</span><strong>{stats.available}</strong></div><div className="stat-tile"><span>Reviewed</span><strong>{stats.reviewed}</strong></div><div className="stat-tile"><span>Accuracy</span><strong>{percent(stats.accuracy)}</strong></div><div className="stat-tile"><span>Ever wrong</span><strong>{stats.everWrong}</strong></div><div className="stat-tile"><span>Marked hard</span><strong>{stats.markedHard}</strong></div><div className="stat-tile"><span>Avg. time</span><strong>{formatResponseTime(stats.averageResponseTimeMs)}</strong></div><div className="stat-tile"><span>Right once</span><strong>{stats.mastered}</strong></div><div className="stat-tile"><span>Best streak</span><strong>{stats.bestStreak}</strong></div></div>
      <div className="progress-block"><div className="progress-label"><span>Initial review · {initialReviewed}/{initialTotal}</span><strong>{Math.round(initialPercent)}%</strong></div><div className="progress-track" role="progressbar" aria-label="Initial review of selected cards" aria-valuenow={initialPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${initialPercent}%` }} /></div></div>
    </section>
    <section className="panel-surface priority-panel">
      <div className="sidebar-heading"><div><p className="eyebrow">Prompts only</p><h2>Highest-Priority Review</h2></div><RotateCcw /></div>
      <div className="priority-list">{priority.map(({ card, progress, score }) => { const itemCopy = cardCopy ? cardCopy(card, direction) : directionalCopy(card, direction); return <div className="priority-row" key={`${card.deckId}:${card.id}`}><span className="priority-meta">{card.rank ? `#${card.rank}` : card.category ?? "Card"}</span><span className="priority-prompt">{priorityPrompt ? priorityPrompt(card, itemCopy) : itemCopy.prompt}<small>{priorityReason(progress)}</small></span><span className="priority-score">{Math.max(0, Math.round(score))}</span></div>; })}</div>
      <p className="source-note">Answers remain hidden. Correctness, difficulty, recall time, recency, strength, and due dates all affect priority.</p>
    </section>
  </aside>;
}