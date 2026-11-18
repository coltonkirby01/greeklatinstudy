/**
 * Shared Greek vocabulary audio speech rules.
 * Verbs pronounce every displayed principal part, including future fifth
 * and sixth parts. Nouns start with their Greek definite article.
 * Declension shorthand (e.g. -ου) is never spoken as a standalone word.
 */
export type GreekVocabularySpeech = {
  kind: "verb" | "noun" | "other";
  text: string;
  parts: string[];
  articles: string[];
};

const greekWord = /^[\p{Script=Greek}\p{M}]+$/u;
const greekStartWord = /^[\p{Script=Greek}\p{M}]+/u;
const articleByKey: Record<string, string> = { "ο": "ὁ", "η": "ἡ", "το": "τό" };

function normalizedGreekLetters(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}
function articleOf(part: string): string | null {
  const token = part.trim();
  if (!greekWord.test(token)) return null;
  const key = normalizedGreekLetters(token);
  if (!Object.prototype.hasOwnProperty.call(articleByKey, key)) return null;
  // The article must have the expected accent or breathing: not a bare
  // declension suffix, or an unaccented Greek stem written without a dash.
  if (token === key) return null;
  return articleByKey[key];
}
function lemmaOf(label: string, fallback: string) {
  return (label.split(",")[0]?.match(greekStartWord)?.[0]
    ?? fallback.match(greekStartWord)?.[0]
    ?? "").trim();
}
function fullNounForms(label: string, greek: string, lemma: string) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const word of [...label.split(","), ...greek.split(",")]) {
    const value = word.trim();
    if (value === lemma || !greekWord.test(value) || articleOf(value)) continue;
    if (!seen.has(value)) { seen.add(value); result.push(value); }
  }
  return result;
}
function looksLikeGreekVerb(label: string) {
  const parts = label.split(",").map((part) => part.trim());
  if (parts.length < 2 || !greekStartWord.test(parts[1])) return false;
  const plain = normalizedGreekLetters(lemmaOf(label, ""));
  return /(?:ω|μι|μαι)$/u.test(plain);
}

/** The display label is authoritative for all present and future principal parts. */
export function greekVocabularySpeech(
  label: string, greek: string, partOfSpeech?: string,
): GreekVocabularySpeech {
  const displayed = label.trim();
  const supplied = greek.trim();
  const normalizedPos = partOfSpeech?.trim().toLocaleLowerCase() ?? "";
  const components = displayed.split(",").map((part) => part.trim()).filter(Boolean);
  // Older audio maps sometimes abbreviate the label to just the nominative
  // but retain the article in their Greek source field; examine both.
  const genderFields = [...components, ...supplied.split(",").map((part) => part.trim())];
  const articles = [...new Set(genderFields.map(articleOf).filter((value): value is string => Boolean(value)))];
  const explicitNoun = normalizedPos === "noun" || normalizedPos === "proper noun";
  const noun = articles.length > 0 && (explicitNoun || (!normalizedPos && genderFields.slice(1).some((part) => articleOf(part))));

  if (noun) {
    const lemma = lemmaOf(displayed, supplied);
    if (lemma) {
      const phrases = articles.map((article) => article + " " + lemma);
      const forms = fullNounForms(displayed, supplied, lemma);
      const text = [...phrases, ...forms].join(", ");
      return { kind: "noun", text, parts: [text], articles };
    }
  }
  const verb = normalizedPos === "verb" || (!normalizedPos && looksLikeGreekVerb(displayed));
  if (verb) {
    const parts = components.length ? components : supplied.split(",").map((x) => x.trim()).filter(Boolean);
    return { kind: "verb", text: parts.join(", "), parts, articles: [] };
  }
  return { kind: "other", text: supplied || displayed, parts: [supplied || displayed], articles: [] };
}
