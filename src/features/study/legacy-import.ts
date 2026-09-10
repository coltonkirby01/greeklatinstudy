import type { DeckProgressEnvelope } from "./types";

export function importProgressFile(value: unknown): DeckProgressEnvelope {
  if (!value || typeof value !== "object") throw new Error("The selected JSON file is not a progress backup.");
  const source = value as Record<string, unknown>;
  if (source.version === 2 && source.deckId && source.modes) return source as unknown as DeckProgressEnvelope;
  throw new Error("This importer accepts Greek & Latin Study v2 progress backups.");
}

export function exportProgress(envelope: DeckProgressEnvelope) {
  return { ...envelope, type: "GreekLatinStudyProgressBackup", exportedAt: new Date().toISOString() };
}
