import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadLatinPassiveIndicativeParadigmsDeck } from "../data/latin-passive-indicative-paradigms";
import { useAuth } from "../features/auth/auth-context";
import { LatinParadigmTable } from "../features/latin/latin-paradigm-table";
import { MultiSourceStudySession, type StudySourceDefinition } from "../features/study/multi-source-study-session";
import { useAsync } from "../hooks/use-async";

export function LatinPassiveIndicativePage() {
  const { value: deck, error } = useAsync(loadLatinPassiveIndicativeParadigmsDeck, []);
  const { user } = useAuth();
  const sources = useMemo<StudySourceDefinition[]>(() => deck ? [{
    id: "passive-indicative-paradigms",
    label: "Passive indicative paradigms",
    deck,
    cards: deck.cards,
    studyKey: "chart",
    direction: "forward",
  }] : [], [deck]);

  return <main className="page-shell study-page latin-page">
    <div className="study-page-heading">
      <div><p className="eyebrow">Latin · whole paradigms</p><h1>Passive Indicative Paradigms</h1></div>
      <p>Twelve whole-paradigm cards covering the present, imperfect, and future passive indicative in all four regular conjugations.</p>
    </div>
    <p><Link to="/latin">← Back to Latin</Link></p>
    {!user && <div className="guest-banner"><span>You are studying as a guest. Progress stays on this device.</span><Link to="/account">Sign in to sync</Link></div>}
    {error && <div className="inline-alert">{error}</div>}

    {deck ? <MultiSourceStudySession
      deck={deck}
      sources={sources}
      resetKey="latin-passive-indicative-paradigms"
      direction="forward"
      cardMeta={(card) => `${card.category ?? "Passive Indicative"} · whole paradigm`}
      priorityPrompt={(card) => `${card.front} · Complete paradigm`}
      renderFront={(card) => <span className="henle-chart-face">
        <strong className="henle-card-title">{card.front}</strong>
        <span className="chart-instruction">Reconstruct the complete paradigm from memory.</span>
        <LatinParadigmTable card={card} revealed={false} />
      </span>}
      renderBack={(card) => <span className="henle-chart-face">
        <strong className="henle-card-title">{card.front}</strong>
        <LatinParadigmTable card={card} revealed />
      </span>}
    /> : <div className="study-loading panel-surface"><span className="loading-mark">A</span><p>Preparing paradigms…</p></div>}
  </main>;
}
