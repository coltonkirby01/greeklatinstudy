import type { StudyCard } from "./types";

/**
 * Find potential confusions only among the selected source cards. Never invent
 * headwords or meanings; use the actual first lexical form and English gloss.
 */
export type ConfusableItem = { key: string; card: StudyCard };
export type ConfusableMatch = { key: string; reason: "similar form" | "shared meaning" };
export type ConfusableIndex = Map<string, ConfusableMatch[]>;

const unhelpfulGlosses = new Set(["a", "an", "the", "of", "to", "in", "on", "at", "by", "and", "or", "with", "for", "as", "one", "thing", "someone", "something"]);

function normalizedForm(value: string) {
  const token = value.match(/[\p{L}\p{M}]+/u)?.[0] ?? "";
  return token.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/ς/gu, "σ");
}

function englishSenses(value: string) {
  const firstLine = value.split("\n")[0]?.slice(0, 200) ?? "";
  return [...new Set(firstLine
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:to be|to do)\s+/gi, "to ")
    .split(/[;,/]|\s+or\s+/i)
    .map((part) => part.toLowerCase().replace(/\b(?:to|a|an|the)\s+/g, " ").replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((part) => part.length >= 2 && part.length <= 34 && !unhelpfulGlosses.has(part)))];
}

function similarSpelling(left: string, right: string) {
  if (!left || !right || left === right || left.length < 4 || right.length < 4) return false;
  const difference = Math.abs(left.length - right.length);
  const limit = Math.min(left.length, right.length) >= 7 ? 2 : 1;
  if (difference > limit) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= right.length; j += 1) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    if (Math.min(...row) > limit) return false;
    previous = row;
  }
  return previous[right.length] <= limit;
}

function isVocabulary(card: StudyCard) {
  return Boolean(card.metadata?.partOfSpeech ||
    card.metadata?.studySource === "vocabulary" ||
    card.metadata?.translationVocab === true ||
    card.deckId === "dickinson-latin-core" ||
    /vocabular/i.test(card.category ?? ""));
}

function add(index: ConfusableIndex, left: string, right: string, reason: ConfusableMatch["reason"]) {
  if (left === right) return;
  const existing = index.get(left) ?? [];
  if (existing.some((item) => item.key === right)) return;
  existing.push({ key: right, reason });
  index.set(left, existing);
}

export function buildConfusableIndex(items: readonly ConfusableItem[]): ConfusableIndex {
  const index: ConfusableIndex = new Map();
  const meanings = new Map<string, string[]>();
  const spelling = new Map<string, string[]>();
  const forms = new Map<string, string>();
  for (const { key, card } of items) {
    // Declension and whole-paradigm cards can have overlapping English
    // instruction text, but are not vocabulary confusions.
    if (!isVocabulary(card)) continue;
    const form = normalizedForm(card.front);
    forms.set(key, form);
    if (form.length >= 4) {
      const prefix = form.slice(0, 1);
      spelling.set(prefix, [...(spelling.get(prefix) ?? []), key]);
    }
    for (const sense of englishSenses(card.back)) meanings.set(sense, [...(meanings.get(sense) ?? []), key]);
  }
  for (const keys of meanings.values()) {
    if (keys.length > 24) continue; // An ultra-generic gloss must not dominate a study pool.
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        add(index, keys[i], keys[j], "shared meaning");
        add(index, keys[j], keys[i], "shared meaning");
      }
    }
  }
  for (const keys of spelling.values()) {
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        if (!similarSpelling(forms.get(keys[i]) ?? "", forms.get(keys[j]) ?? "")) continue;
        add(index, keys[i], keys[j], "similar form");
        add(index, keys[j], keys[i], "similar form");
      }
    }
  }
  return index;
}

export function confusableSelectedKeys(index: ConfusableIndex, available: readonly string[]) {
  const selected = new Set(available);
  return new Set([...index.keys()].filter((key) => selected.has(key) && index.get(key)?.some((match) => selected.has(match.key))));
}

export function confusablePartner(index: ConfusableIndex, key: string, eligible: readonly string[]) {
  const allowed = new Set(eligible);
  return index.get(key)?.find((match) => allowed.has(match.key)) ?? null;
}
