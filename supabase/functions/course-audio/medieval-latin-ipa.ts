export const MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM =
  "Medieval Latin (normalized scholastic; broad Rigg/Stotz-led reconstruction)";

const LONG_VOWELS: Record<string, string> = {
  ā: "a",
  ē: "e",
  ī: "i",
  ō: "o",
  ū: "u",
  ȳ: "y",
};
const SIMPLE_VOWELS = new Set(["a", "ā", "e", "ē", "i", "ī", "o", "ō", "u", "ū", "y", "ȳ"]);
const DIPHTHONGS = new Set(["ae", "oe", "au"]);
const CONSONANT_DIGRAPHS = new Set(["ph", "th", "ch", "qu", "sc"]);

/**
 * Permanent pacing invariant for Latin paradigm audio.
 *
 * Eleven v3 can otherwise accelerate through a short paradigm column, while
 * explicit `[short pause]` tags make the spacing between individual forms a
 * little too long for the desired slightly brisk teaching pace. Monolithic
 * fallback input therefore uses ordinary comma punctuation between forms and
 * one explicit longer pause between singular and plural.
 *
 * New production paradigm audio should synthesize each form independently and
 * let the player control inter-form timing. This prevents v3 from compressing
 * repeated stems such as laud-, mon-, mitt-, or aud-. See
 * docs/MEDIEVAL_LATIN_AUDIO_PACING.md.
 */
export const MEDIEVAL_LATIN_FORM_SEPARATOR = ",";
export const MEDIEVAL_LATIN_COLUMN_PAUSE = "[pause]";

type LatinUnit = {
  raw: string;
  vowel: boolean;
  long: boolean;
  diphthong: boolean;
};

/**
 * Remove notation that teaches morphology but is not part of the spoken word.
 * Macrons are retained because they can still help determine inherited stress.
 */
export function stripUnpronouncedLatinNotation(text: string) {
  return text
    .normalize("NFC")
    .replace(/\([^)]*\)/gu, "")
    .replace(/(\p{L})\s*-\s*(?=\p{L})/gu, "$1")
    .replace(/æ/giu, "ae")
    .replace(/œ/giu, "oe")
    .replace(/\s+/gu, " ")
    .trim();
}

function plainVowelCharacter(value: string | undefined) {
  return Boolean(value && SIMPLE_VOWELS.has(value));
}

function consonantalI(chars: readonly string[], index: number) {
  if (chars[index] !== "i") return false;
  const previous = chars[index - 1];
  const next = chars[index + 1];
  if (!plainVowelCharacter(next)) return false;
  return index === 0 || plainVowelCharacter(previous);
}

function unitsForWord(rawWord: string): LatinUnit[] {
  const word = stripUnpronouncedLatinNotation(rawWord).toLocaleLowerCase("la");
  const chars = Array.from(word);
  const units: LatinUnit[] = [];

  for (let index = 0; index < chars.length; index += 1) {
    if (consonantalI(chars, index)) {
      units.push({ raw: "j", vowel: false, long: false, diphthong: false });
      continue;
    }

    const pair = `${chars[index] ?? ""}${chars[index + 1] ?? ""}`;
    if (DIPHTHONGS.has(pair)) {
      units.push({ raw: pair, vowel: true, long: false, diphthong: true });
      index += 1;
      continue;
    }
    if (CONSONANT_DIGRAPHS.has(pair)) {
      units.push({ raw: pair, vowel: false, long: false, diphthong: false });
      index += 1;
      continue;
    }

    const raw = chars[index];
    units.push({
      raw,
      vowel: SIMPLE_VOWELS.has(raw),
      long: raw in LONG_VOWELS,
      diphthong: false,
    });
  }

  return units;
}

function nucleusIndices(units: readonly LatinUnit[]) {
  return units.flatMap((unit, index) => unit.vowel ? [index] : []);
}

function consonantWeight(unit: LatinUnit) {
  if (unit.vowel) return 0;
  return unit.raw === "x" || unit.raw === "z" ? 2 : 1;
}

function stressNucleusPosition(units: readonly LatinUnit[], nuclei: readonly number[]) {
  if (nuclei.length <= 1) return 0;
  if (nuclei.length === 2) return 0;

  const penultPosition = nuclei.length - 2;
  const penultIndex = nuclei[penultPosition];
  const finalIndex = nuclei[penultPosition + 1];
  const penult = units[penultIndex];
  const consonantsAfterPenult = units
    .slice(penultIndex + 1, finalIndex)
    .reduce((sum, unit) => sum + consonantWeight(unit), 0);
  const heavy = penult.long || penult.diphthong || consonantsAfterPenult >= 2;
  return heavy ? penultPosition : penultPosition - 1;
}

function stressStartIndex(units: readonly LatinUnit[], nuclei: readonly number[], stressedNucleusPosition: number) {
  const nucleusIndex = nuclei[stressedNucleusPosition] ?? 0;
  if (stressedNucleusPosition <= 0) return 0;
  const previousNucleusIndex = nuclei[stressedNucleusPosition - 1];
  const interveningConsonants = units
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit, index }) => index > previousNucleusIndex && index < nucleusIndex && !unit.vowel)
    .map(({ index }) => index);
  return interveningConsonants.at(-1) ?? nucleusIndex;
}

function baseVowel(raw: string) {
  return LONG_VOWELS[raw] ?? raw;
}

function vowelIpa(raw: string) {
  if (raw === "ae" || raw === "oe") return "e";
  if (raw === "au") return "au̯";
  const base = baseVowel(raw);
  return base === "y" ? "i" : base;
}

function isFrontVowel(unit: LatinUnit | undefined) {
  if (!unit?.vowel) return false;
  return ["e", "ē", "i", "ī", "y", "ȳ", "ae", "oe"].includes(unit.raw);
}

function unitIpa(units: readonly LatinUnit[], index: number) {
  const unit = units[index];
  if (unit.vowel) return vowelIpa(unit.raw);

  const previous = units[index - 1]?.raw ?? "";
  const next = units[index + 1];
  const afterNext = units[index + 2];

  switch (unit.raw) {
    case "ph": return "f";
    case "th": return "t";
    case "ch": return "k";
    case "qu": return "kw";
    case "sc": return isFrontVowel(next) ? "s" : "sk";
    case "v": return "v";
    case "j": return "j";
    case "h": return "";
    case "x": return "ks";
    case "z": return "dz";
    case "c": return isFrontVowel(next) ? "s" : "k";
    case "g": return "g";
    case "t":
      if (next?.raw === "i" && afterNext?.vowel && !["s", "t", "x"].includes(previous)) return "s";
      return "t";
    default:
      return unit.raw;
  }
}

function wordToIpa(rawWord: string) {
  const units = unitsForWord(rawWord);
  const nuclei = nucleusIndices(units);
  if (!units.length || !nuclei.length) return "";
  const stressedNucleusPosition = stressNucleusPosition(units, nuclei);
  const start = stressStartIndex(units, nuclei, stressedNucleusPosition);
  let ipa = "";
  for (let index = 0; index < units.length; index += 1) {
    if (index === start && nuclei.length > 1) ipa += "ˈ";
    ipa += unitIpa(units, index);
  }
  return ipa;
}

/** Canonical broad Medieval Latin IPA. */
export function latinToMedievalIpa(text: string) {
  const stripped = stripUnpronouncedLatinNotation(text);
  const words = stripped.match(/[\p{L}\p{M}]+/gu) ?? [];
  const ipa = words.map(wordToIpa).filter(Boolean).join(" ");
  return ipa ? `/${ipa}/` : "";
}

/** Eleven v3 native IPA input for one spoken Latin form. */
export function latinToElevenLabsIpa(text: string) {
  return latinToMedievalIpa(text);
}

/**
 * Monolithic fallback only. New paradigm generation should synthesize each
 * form independently so repeated stems cannot be elided by Eleven v3.
 */
export function latinParadigmColumnToElevenLabsIpa(forms: readonly string[]) {
  return forms
    .map(latinToElevenLabsIpa)
    .filter(Boolean)
    .join(`${MEDIEVAL_LATIN_FORM_SEPARATOR} `);
}

/** Monolithic fallback only; see the segmented-generation policy above. */
export function latinParadigmToElevenLabsIpa(columns: readonly (readonly string[])[]) {
  return columns
    .map(latinParadigmColumnToElevenLabsIpa)
    .filter(Boolean)
    .join(` ${MEDIEVAL_LATIN_COLUMN_PAUSE} `);
}

export const MEDIEVAL_LATIN_PROFILE_RULES = {
  frontC: "s",
  frontSc: "s",
  tiBeforeVowel: "s+i",
  h: "silent",
  consonantalV: "v",
  consonantalI: "j",
  frontG: "g (normalized conservative choice)",
  gn: "gn (normalized conservative choice)",
  qu: "kw (normalized conservative choice)",
  vowelQuantity: "not phonemic; macrons retained for inherited stress",
} as const;
