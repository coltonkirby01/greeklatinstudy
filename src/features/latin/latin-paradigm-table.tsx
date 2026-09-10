import type { StudyCard } from "../study/types";

type LatinChartRow = { label: string; cells: string[] };

function chartColumns(card: StudyCard) {
  const columns = card.metadata?.chartColumns;
  return Array.isArray(columns) ? columns.filter((value): value is string => typeof value === "string") : [];
}

function chartRows(card: StudyCard): LatinChartRow[] {
  const rows = card.metadata?.chartRows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as { label?: unknown; cells?: unknown };
    if (typeof value.label !== "string" || !Array.isArray(value.cells) || !value.cells.every((cell) => typeof cell === "string")) return [];
    return [{ label: value.label, cells: value.cells as string[] }];
  });
}

export function LatinParadigmTable({ card, revealed }: { card: StudyCard; revealed: boolean }) {
  const columns = chartColumns(card);
  const rows = chartRows(card);

  return <div className="chart-scroll">
    <table className="henle-chart">
      <thead>
        <tr><th scope="col">Person</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.label}>
          <th scope="row">{row.label}</th>
          {row.cells.map((cell, index) => <td key={`${row.label}-${columns[index] ?? index}`}>
            {revealed ? <strong className="latin-front compact-latin">{cell}</strong> : <span aria-hidden="true">—</span>}
          </td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
