import type { DictionaryMatch } from "./dictionary-sources";

export type LatinInflectionClass = { label: "Declension" | "Conjugation"; value: string };

const ordinal = (value: number) => `${value}${value === 1 ? "st" : value === 2 ? "nd" : value === 3 ? "rd" : "th"}`;

/** Read the declared lexical inflection class rather than guessing from a word's ending. */
export function latinInflectionClass(match: Pick<DictionaryMatch, "whitaker">): LatinInflectionClass | null {
  const metadata = match.whitaker;
  const pos = metadata?.partOfSpeech?.trim().toLocaleLowerCase();
  const label = pos === "noun" || pos === "adjective" ? "Declension"
    : pos === "verb" || pos === "participle" || pos === "supine" ? "Conjugation"
    : null;
  if (!label) return null;

  // Headword metadata, e.g. N (4th) M, V (1st) TRANS, ADJ (1st/2nd).
  // It has priority over individual inflection codes, which may mix analyses
  // (e.g. gustatum can be analyzed as both a 4th-declension noun and a supine).
  const details = metadata?.dictionaryDetails ?? "";
  const parenthesized = details.match(/\(\s*([1-5](?:st|nd|rd|th)?(?:\s*[\/&,]\s*[1-5](?:st|nd|rd|th)?)*)\s*\)/iu);
  const descriptive = details.match(/\b([1-5])(?:st|nd|rd|th)?\s+(?:declension|conjugation)\b/iu);
  const explicit = parenthesized?.[1] ?? descriptive?.[1];
  if (explicit) {
    const numbers = [...new Set((explicit.match(/[1-5]/gu) ?? []).map(Number))];
    if (numbers.length) return {
      label,
      value: `${numbers.map(ordinal).join("/")}${label === "Declension" ? " declension" : " conjugation"}`,
    };
  }

  // Only use Whitaker's explicitly numbered source analyses as a fallback.
  // The second number is a variant, not another declension or conjugation.
  const sourcePos = pos === "noun" ? "N" : pos === "verb" ? "V" : pos === "supine" ? "SUPINE" : pos === "participle" ? "VPAR" : null;
  if (!sourcePos) return null; // ADJ numeric classes do not always map to traditional declensions.
  const numbers = new Set<number>();
  for (const line of metadata?.rawAnalyses ?? []) {
    const parsed = line.match(/\s{2,}(N|V|SUPINE|VPAR)\s+([1-5])\s+[0-9]+\b/u);
    if (parsed?.[1] === sourcePos) numbers.add(Number(parsed[2]));
  }
  if (!numbers.size) return null;
  return {
    label,
    value: `${[...numbers].sort((a, b) => a - b).map(ordinal).join("/")}${label === "Declension" ? " declension" : " conjugation"}`,
  };
}
