import readXlsxFile from "read-excel-file";
import { parseCsv } from "../../data/builtin-decks";
import type { ImportCard } from "./deck-service";

const normalizeHeader = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
function metadataObject(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {}; }
function parseJsonArrayCell(value: unknown) {
  if (Array.isArray(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return null;
  try { const parsed = JSON.parse(text) as unknown; return Array.isArray(parsed) ? parsed : null; }
  catch { return null; }
}
function copyStringMetadata(metadata: Record<string, unknown>, key: string, value: unknown) {
  const text = String(value ?? "").trim();
  if (text) metadata[key] = text;
}

export function rowsToCards(rows: unknown[][]) {
  if (rows.length < 2) throw new Error("The import file has no card rows.");
  const headers = rows[0].map(normalizeHeader), column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const front = column("front", "question", "prompt"), back = column("back", "answer", "definition");
  if (front < 0 || back < 0) throw new Error("Imports require Front and Back columns.");
  const category = column("category"), rank = column("rank", "frequency rank"), source = column("source"), notes = column("notes", "note"), reversePrompt = column("reverse prompt", "reverse");
  const pronunciationText = column("pronunciation text", "audio text", "greek audio text");
  const canonicalIpa = column("canonical ipa", "pronunciation ipa");
  const elevenLabsIpa = column("elevenlabs ipa", "eleven labs ipa", "tts ipa", "pronunciation tts ipa");
  const pronunciationSystem = column("pronunciation system", "audio pronunciation system");
  const chartColumns = column("chart columns", "paradigm columns"), chartRows = column("chart rows", "paradigm rows");
  return rows.slice(1).map((row) => {
    const metadata: Record<string, unknown> = {};
    if (pronunciationText >= 0) copyStringMetadata(metadata, "pronunciationText", row[pronunciationText]);
    if (canonicalIpa >= 0) copyStringMetadata(metadata, "canonicalIpa", row[canonicalIpa]);
    if (elevenLabsIpa >= 0) copyStringMetadata(metadata, "elevenLabsIpa", row[elevenLabsIpa]);
    if (pronunciationSystem >= 0) copyStringMetadata(metadata, "pronunciationSystem", row[pronunciationSystem]);
    const columns = chartColumns >= 0 ? parseJsonArrayCell(row[chartColumns]) : null;
    const paradigmRows = chartRows >= 0 ? parseJsonArrayCell(row[chartRows]) : null;
    if (columns) metadata.chartColumns = columns;
    if (paradigmRows) { metadata.chartRows = paradigmRows; metadata.studySource = "grammar-chart"; }
    return {
      front: String(row[front] ?? "").trim(),
      back: String(row[back] ?? "").trim(),
      category: category >= 0 ? String(row[category] ?? "").trim() : "",
      rank: rank >= 0 && String(row[rank] ?? "").trim() ? Number(row[rank]) : null,
      source: source >= 0 ? String(row[source] ?? "").trim() : "",
      notes: notes >= 0 ? String(row[notes] ?? "").trim() : "",
      reversePrompt: reversePrompt >= 0 ? String(row[reversePrompt] ?? "").trim() : "",
      metadata: Object.keys(metadata).length ? metadata : undefined,
    };
  }).filter((card) => card.front && card.back).map((card, index) => ({ ...card, rank: Number.isFinite(card.rank) ? card.rank : index + 1 })) satisfies ImportCard[];
}

export function jsonToCards(value: unknown) {
  const source = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray((value as { cards?: unknown[] }).cards) ? (value as { cards: unknown[] }).cards : null;
  if (!source) throw new Error("JSON must be an array of cards or an object with a cards array.");
  return source.map((item, index) => {
    const card = item as Record<string, unknown>, metadata = metadataObject(card.Metadata ?? card.metadata);
    const columns = card.Columns ?? card.columns ?? metadata.chartColumns, rows = card.Rows ?? card.rows ?? metadata.chartRows;
    if (Array.isArray(columns)) metadata.chartColumns = columns;
    if (Array.isArray(rows)) { metadata.chartRows = rows; metadata.studySource ??= "grammar-chart"; }
    copyStringMetadata(metadata, "pronunciationText", card["Pronunciation Text"] ?? card.pronunciationText ?? card.audioText ?? metadata.pronunciationText);
    copyStringMetadata(metadata, "canonicalIpa", card["Canonical IPA"] ?? card.canonicalIpa ?? card.pronunciationIpa ?? metadata.canonicalIpa);
    copyStringMetadata(metadata, "elevenLabsIpa", card["ElevenLabs IPA"] ?? card.elevenLabsIpa ?? card.ttsIpa ?? metadata.elevenLabsIpa);
    copyStringMetadata(metadata, "pronunciationSystem", card["Pronunciation System"] ?? card.pronunciationSystem ?? metadata.pronunciationSystem);
    return {
      front: String(card.Front ?? card.front ?? card.prompt ?? "").trim(),
      back: String(card.Back ?? card.back ?? card.answer ?? "").trim(),
      category: String(card.Category ?? card.category ?? "").trim(),
      rank: Number(card.Rank ?? card.rank ?? index + 1),
      source: String(card.Source ?? card.source ?? "").trim(),
      notes: String(card.Notes ?? card.notes ?? card.note ?? "").trim(),
      reversePrompt: String(card["Reverse Prompt"] ?? card.reversePrompt ?? card.reverse_prompt ?? "").trim(),
      metadata: Object.keys(metadata).length ? metadata : undefined,
    };
  }).filter((card) => card.front && card.back) satisfies ImportCard[];
}

export async function parseDeckImport(file: File) {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  let cards: ImportCard[];
  if (extension === "json") cards = jsonToCards(JSON.parse(await file.text()));
  else if (extension === "xlsx" || extension === "xls") cards = rowsToCards((await readXlsxFile(file)) as unknown[][]);
  else cards = rowsToCards(parseCsv(await file.text()));
  if (!cards.length) throw new Error("No valid cards were found in the import.");
  return cards;
}
