/**
 * Reconstructed Classical Attic pronunciation for course audio.
 *
 * Policy: Josolon's MIT-licensed Ancient Greek Dictionary phonology module,
 * which follows W. Sidney Allen's Vox Graeca, is the dominant implementation
 * reference. The resulting choices are cross-checked against Smyth's account
 * of pitch accent, the Open University's fifth-century Athenian reconstruction,
 * and the University of Victoria open textbook. From Alpha to Omega remains the
 * course-level pronunciation guide where it makes an explicit pedagogical choice.
 * See docs/THIRD-PARTY-NOTICES.md for the upstream attribution and license notice.
 *
 * We keep two outputs separate:
 * - canonical IPA preserves the reconstructed pitch-accent information;
 * - ElevenLabs IPA uses stress only as a synthesis approximation because the
 *   provider does not expose deterministic Ancient-Greek pitch-accent control.
 */
export const CLASSICAL_GREEK_PRONUNCIATION_SYSTEM =
  "Classical Attic c. 400 BCE — Josolon/Vox Graeca-led; cross-checked with Smyth, Open University, University of Victoria, and aligned with From Alpha to Omega; ElevenLabs approximates pitch accent";

const greekLetter = /[\u0370-\u03ff\u1f00-\u1fff]/u;
const combining = /[\u0300-\u036f]/u;
const rough = "\u0314";
const acute = "\u0301";
const grave = "\u0300";
const circumflex = "\u0342";
const macron = "\u0304";
const diaeresis = "\u0308";
const iotaSubscript = "\u0345";

const vowels = new Set(["α", "ε", "η", "ι", "ο", "υ", "ω"]);
const diphthongs: Record<string, string> = {
  αι: "ai̯",
  αυ: "au̯",
  ει: "eː",
  ευ: "eu̯",
  ηυ: "ɛːu̯",
  οι: "œi̯",
  ου: "uː",
  υι: "yi̯",
  ωυ: "ɔːu̯",
};
const hiatusLengthened = new Set(["αι", "αυ", "ευ", "οι", "υι"]);

const consonants: Record<string, string> = {
  β: "b", γ: "ɡ", δ: "d", ζ: "zd", θ: "tʰ", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "ks",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", φ: "pʰ", χ: "kʰ", ψ: "ps",
};

const gammaNasalizers = new Set(["γ", "κ", "χ", "ξ", "μ"]);
const sigmaVoicers = new Set(["β", "γ", "δ", "μ"]);

type Unit = { base: string; marks: Set<string> };
type AccentMode = "canonical" | "tts";

function units(word: string): Unit[] {
  const out: Unit[] = [];
  for (const char of word.normalize("NFD")) {
    if (combining.test(char) && out.length) {
      out[out.length - 1].marks.add(char);
      continue;
    }
    if (!greekLetter.test(char)) continue;
    out.push({ base: char.toLowerCase(), marks: new Set<string>() });
  }
  return out;
}

function unionMarks(first: Set<string>, second?: Set<string>) {
  return new Set(second ? [...first, ...second] : first);
}

function vowelValue(unit: Unit) {
  const long = unit.marks.has(macron) || unit.marks.has(circumflex);
  if (unit.marks.has(iotaSubscript)) {
    if (unit.base === "α") return "aːi̯";
    if (unit.base === "η") return "ɛːi̯";
    if (unit.base === "ω") return "ɔːi̯";
  }
  if (unit.base === "α") return long ? "aː" : "a";
  if (unit.base === "ε") return "e";
  if (unit.base === "η") return "ɛː";
  if (unit.base === "ι") return long ? "iː" : "i";
  if (unit.base === "ο") return "o";
  if (unit.base === "υ") return long ? "yː" : "y";
  if (unit.base === "ω") return "ɔː";
  return "";
}

function splitMorae(nucleus: string): [string, string] | null {
  for (const glide of ["i̯", "u̯"]) {
    const index = nucleus.indexOf(glide);
    if (index > 0) return [nucleus.slice(0, index), nucleus.slice(index)];
  }
  if (nucleus.endsWith("ː") && nucleus.length > 1) return [nucleus.slice(0, -1), "ː"];
  return null;
}

function markFirstSegment(value: string, mark: string) {
  return value ? `${value[0]}${mark}${value.slice(1)}` : value;
}

function accentNucleus(nucleus: string, marks: Set<string>, mode: AccentMode, syllables: number) {
  const accented = marks.has(acute) || marks.has(circumflex);
  if (!accented) return nucleus;
  if (mode === "tts") return syllables > 1 ? `ˈ${nucleus}` : nucleus;

  const morae = splitMorae(nucleus);
  if (!morae) return markFirstSegment(nucleus, acute);
  const [first, second] = morae;
  if (marks.has(circumflex)) return `${markFirstSegment(first, acute)}${markFirstSegment(second, grave)}`;
  return `${first}${markFirstSegment(second, acute)}`;
}

function countSyllables(input: Unit[]) {
  let count = 0;
  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    if (!vowels.has(current.base)) continue;
    count += 1;
    const next = input[index + 1];
    if (!next || !vowels.has(next.base) || next.marks.has(diaeresis) || current.marks.has(iotaSubscript)) continue;
    if (diphthongs[`${current.base}${next.base}`]) index += 1;
  }
  return count;
}

function lengthenOffglide(value: string) {
  return value.endsWith("i̯") || value.endsWith("u̯") ? `${value}ː` : value;
}

function transcribeWord(word: string, mode: AccentMode) {
  const input = units(word);
  const syllables = countSyllables(input);
  let output = "";

  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    const next = input[index + 1];
    const previous = input[index - 1];
    const wordStart = index === 0;

    if (vowels.has(current.base)) {
      if (current.marks.has(iotaSubscript)) {
        if (wordStart && current.marks.has(rough)) output += "h";
        output += accentNucleus(vowelValue(current), current.marks, mode, syllables);
        continue;
      }

      const pair = next && vowels.has(next.base) && !next.marks.has(diaeresis)
        ? `${current.base}${next.base}`
        : "";
      if (pair && diphthongs[pair]) {
        const pairMarks = unionMarks(current.marks, next?.marks);
        if (wordStart && pairMarks.has(rough)) output += "h";
        const after = input[index + 2];
        const hiatus = Boolean(after && vowels.has(after.base));
        let nucleus = diphthongs[pair];
        if (pair === "ει" && hiatus) nucleus = "ei̯ː";
        else if (hiatus && hiatusLengthened.has(pair)) nucleus = lengthenOffglide(nucleus);
        output += accentNucleus(nucleus, pairMarks, mode, syllables);
        index += 1;
        continue;
      }

      if (wordStart && current.marks.has(rough)) output += "h";
      output += accentNucleus(vowelValue(current), current.marks, mode, syllables);
      continue;
    }

    if (!consonants[current.base]) continue;
    if (current.base === "γ" && next && gammaNasalizers.has(next.base)) output += "ŋ";
    else if ((current.base === "σ" || current.base === "ς") && next && sigmaVoicers.has(next.base)) output += "z";
    else if (current.base === "ρ" && (wordStart || previous?.base === "ρ" || current.marks.has(rough))) output += "r̥";
    else output += consonants[current.base];
  }

  return output;
}

function transcribeText(text: string, mode: AccentMode) {
  const cleaned = stripUnpronouncedGreekNotation(text);
  const words = cleaned.match(/[\u0370-\u03ff\u1f00-\u1fff\u0300-\u036f]+/gu) ?? [];
  return words.map((word) => transcribeWord(word, mode)).filter(Boolean).map((word) => `/${word}/`).join(", ");
}

export function stripUnpronouncedGreekNotation(text: string) {
  return text.replace(/\([^)]*\)/g, "").replace(/-/g, "").replace(/\s+/g, " ").trim();
}

export function greekToClassicalIpa(text: string) {
  return transcribeText(text, "canonical");
}

export function greekToElevenLabsIpa(text: string) {
  return transcribeText(text, "tts");
}

export function containsGreek(text: string) {
  return greekLetter.test(text.normalize("NFD"));
}
