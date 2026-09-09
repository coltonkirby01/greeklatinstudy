import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadPublishedDeck } from "../features/decks/deck-service";
import { ClassicalGreekAudio } from "../features/greek/classical-greek-audio";
import { StudySession } from "../features/study/study-session";
import type { StudyCard, StudyDirection } from "../features/study/types";
import { useAsync } from "../hooks/use-async";

type ChartRow = { label: string; cells: string[] };
function chartRows(card: StudyCard): ChartRow[] {
  const rows = card.metadata?.chartRows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as { label?: unknown; cells?: unknown };
    return typeof value.label === "string" && Array.isArray(value.cells) && value.cells.every((cell) => typeof cell === "string") ? [{ label: value.label, cells: value.cells as string[] }] : [];
  });
}
function chartColumns(card: StudyCard) {
  const columns = card.metadata?.chartColumns;
  return Array.isArray(columns) ? columns.filter((value): value is string => typeof value === "string") : [];
}
function cloudCardId(card: StudyCard) {
  return typeof card.metadata?.cloudCardId === "string" ? card.metadata.cloudCardId : undefined;
}
function GreekUploadedAnswer({ card, answer }: { card: StudyCard; answer: string }) {
  const rows = chartRows(card), columns = chartColumns(card), cloudId = cloudCardId(card);
  return <div className="answer-block">
    {rows.length ? <div className="chart-scroll"><table className="henle-chart"><thead><tr><th scope="col">{columns.length === 1 ? "Form" : "Person"}</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.cells.map((cell, index) => <td key={`${row.label}-${index}`}><strong className="greek-front compact-greek">{cell}</strong></td>)}</tr>)}</tbody></table></div> : <strong className="study-answer">{answer}</strong>}
    {cloudId && <ClassicalGreekAudio assetId={`cloud-card-${cloudId}`} cloudCardId={cloudId} label={card.front} />}
  </div>;
}

export function DynamicDeckPage() {
  const { slug = "" } = useParams(), [direction, setDirection] = useState<StudyDirection>("forward"), { value, error, loading } = useAsync(() => loadPublishedDeck(slug), [slug]);
  if (loading) return <main className="page-shell"><div className="study-loading panel-surface"><p>Loading deck…</p></div></main>;
  if (error || !value) return <main className="page-shell article-page"><section className="prose-panel panel-surface"><h1>This deck could not be opened.</h1><p>{error ?? "It may be unpublished."}</p><Link to="/decks">Return to deck library</Link></section></main>;
  const deck = value.definition;
  return <main className="page-shell study-page"><div className="study-page-heading"><div><p className="eyebrow">{deck.eyebrow}</p><h1>{deck.title}</h1></div><p>{deck.cards.length} cards · {deck.supportsReverse ? "two directions" : "forward"}</p></div><StudySession deck={deck} studyKey={direction} direction={direction} onDirectionChange={deck.supportsReverse ? setDirection : undefined} directionLabels={{ forward: "Front → Back", reverse: "Back → Front" }} cardMeta={(card) => [card.source, card.rank ? `Rank ${card.rank}` : ""].filter(Boolean).join(" · ")} renderBack={deck.language === "greek" ? (card, copy) => <GreekUploadedAnswer card={card} answer={copy.answer} /> : undefined} /></main>;
}
