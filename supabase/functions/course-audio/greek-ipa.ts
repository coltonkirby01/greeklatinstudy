/**
 * Course pronunciation for Classical Greek.
 *
 * Source hierarchy:
 * 1. Anne H. Groton, From Alpha to Omega, 4th ed., Lessons 1–2. This is
 *    course audio, so Groton's explicit classroom pronunciation choices win
 *    when reasonable scholarly reconstructions differ.
 * 2. W. Sidney Allen, Vox Graeca, 3rd ed. (Cambridge, 1987), for historical
 *    Attic phonology and details Groton leaves implicit.
 * 3. Herbert Weir Smyth, A Greek Grammar for Colleges, especially §§19 and
 *    149–156, plus the Open University's reconstructed fifth-/fourth-century
 *    pronunciation materials as cross-checks.
 *
 * The implementation was historically informed by Jónatan Sólon's MIT-
 * licensed Ancient Greek Dictionary phonology module (itself Allen-led); see
 * docs/THIRD-PARTY-NOTICES.md. The policy here is now explicitly Groton-first.
 *
 * We keep two outputs separate:
 * - canonical IPA preserves the historical pitch-accent distinction;
 * - ElevenLabs IPA substitutes stress on the accented syllable, matching
 *   Groton's stated classroom practice. ElevenLabs v4 cannot deterministically
 *   reproduce Classical Greek pitch accent, so this is a deliberate teaching
 *   approximation rather than a claim that Classical accent was stress.
 */
export const CLASSICAL_GREEK_PRONUNCIATION_SYSTEM =
  "From Alpha to Omega (Groton) course pronunciation — Classical Greek reconstruction; supplemented by Allen, Smyth, and Open University; canonical metadata preserves pitch accent, ElevenLabs uses Groton-style stress approximation";

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

// Groton §1.5 is authoritative for the course-level diphthong values. In
// particular, ει is the "eight" glide, οι the "oily" glide, and ευ/ηυ glide
// toward French u /y/, rather than the more monophthongized values sometimes
// preferred in narrowly dated reconstructions of Attic.
const diphthongs: Record<string, string> = {
  αι: "ai̯",
  αυ: "au̯",
  ει: "ei̯",
  ευ: "ey̯",
  ηυ: "ɛːy̯",
  οι: "oi̯",
  ου: "uː",
  υι: "yi̯",
  // Rare in the course; retained as a scholarly fallback rather than a
  // Groton-specific classroom cue.
  ωυ: "ɔːu̯",
};

const consonants: Record<string, string> = {
  β: "b", γ: "ɡ", δ: "d", ζ: "zd", θ: "tʰ", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "ks",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", φ: "pʰ", χ: "kʰ", ψ: "ps",
};

// Smyth §19: gamma is nasal before κ, γ, χ, ξ. Groton teaches the same
// environment. Do not nasalize γ before μ.
const gammaNasalizers = new Set(["γ", "κ", "χ", "ξ"]);
// Groton's alphabet table explicitly voices sigma before β, γ, δ, μ.
const sigmaVoicers = new Set(["β", "γ", "δ", "μ"]);
const stops = new Set(["π", "β", "φ", "τ", "δ", "θ", "κ", "γ", "χ"]);
const liquidsAndNasals = new Set(["λ", "ρ", "μ", "ν"]);

type Unit = { base: string; marks: Set<string> };
type AccentMode = "canonical" | "tts";
type Nucleus = { start: number; end: number; marks: Set<string>; value: string };
type Syllable = { start: number; end: number; nucleus: Nucleus };

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
  for (const glide of ["i̯", "u̯", "y̯"]) {
    const index = nucleus.indexOf(glide);
    if (index > 0) return [nucleus.slice(0, index), nucleus.slice(index)];
  }
  if (nucleus.endsWith("ː") && nucleus.length > 1) return [nucleus.slice(0, -1), "ː"];
  return null;
}

function markFirstSegment(value: string, mark: string) {
  return value ? `${value[0]}${mark}${value.slice(1)}` : value;
}

function accentNucleus(nucleus: string, marks: Set<string>) {
  const hasAcute = marks.has(acute);
  const hasGrave = marks.has(grave);
  const hasCircumflex = marks.has(circumflex);
  if (!hasAcute && !hasGrave && !hasCircumflex) return nucleus;

  const morae = splitMorae(nucleus);
  if (!morae) return markFirstSegment(nucleus, hasGrave ? grave : acute);
  const [first, second] = morae;
  if (hasCircumflex) return `${markFirstSegment(first, acute)}${markFirstSegment(second, grave)}`;
  return `${first}${markFirstSegment(second, hasGrave ? grave : acute)}`;
}

function hasAccent(marks: Set<string>) {
  return marks.has(acute) || marks.has(grave) || marks.has(circumflex);
}

function findNuclei(input: Unit[]) {
  const out: Nucleus[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    if (!vowels.has(current.base)) continue;

    if (current.marks.has(iotaSubscript)) {
      out.push({ start: index, end: index, marks: current.marks, value: vowelValue(current) });
      continue;
    }

    const next = input[index + 1];
    const pair = next && vowels.has(next.base) && !next.marks.has(diaeresis)
      ? `${current.base}${next.base}`
      : "";
    if (pair && diphthongs[pair]) {
      out.push({
        start: index,
        end: index + 1,
        marks: unionMarks(current.marks, next.marks),
        value: diphthongs[pair],
      });
      index += 1;
      continue;
    }

    out.push({ start: index, end: index, marks: current.marks, value: vowelValue(current) });
  }
  return out;
}

// Groton §1.8: a single consonant normally begins the following syllable;
// stops followed by a different stop/liquid/nasal are normally kept together;
// a liquid/nasal followed by another liquid/nasal or a stop is split; repeated
// consonants are split; sigma + consonant is explicitly allowed either way.
// We use the together/maximal-onset option for sigma clusters so the stress
// marker supplied to ElevenLabs is deterministic.
function onsetStart(input: Unit[], clusterStart: number, clusterEnd: number) {
  if (clusterStart > clusterEnd) return clusterEnd + 1;
  if (clusterStart === clusterEnd) return clusterStart;

  const first = input[clusterStart].base;
  const second = input[clusterStart + 1].base;
  if (first === second) return clusterStart + 1;
  if (liquidsAndNasals.has(first) && (liquidsAndNasals.has(second) || stops.has(second))) return clusterStart + 1;
  if (stops.has(first) && (stops.has(second) || liquidsAndNasals.has(second))) return clusterStart;
  if (first === "σ" || first === "ς") return clusterStart;
  return clusterEnd;
}

function syllabify(input: Unit[], nuclei: Nucleus[]) {
  if (!nuclei.length) return [] as Syllable[];
  const starts = [0];
  for (let index = 1; index < nuclei.length; index += 1) {
    const previous = nuclei[index - 1];
    const current = nuclei[index];
    const clusterStart = previous.end + 1;
    const clusterEnd = current.start - 1;
    starts.push(clusterStart > clusterEnd ? current.start : onsetStart(input, clusterStart, clusterEnd));
  }
  return nuclei.map((nucleus, index) => ({
    start: starts[index],
    end: index + 1 < starts.length ? starts[index + 1] - 1 : input.length - 1,
    nucleus,
  }));
}

function transcribeSyllable(input: Unit[], syllable: Syllable, mode: AccentMode) {
  let output = "";
  for (let index = syllable.start; index <= syllable.end; index += 1) {
    const current = input[index];
    const next = input[index + 1];
    const previous = input[index - 1];
    const wordStart = index === 0;

    if (index === syllable.nucleus.start) {
      if (wordStart && syllable.nucleus.marks.has(rough)) output += "h";
      output += mode === "canonical"
        ? accentNucleus(syllable.nucleus.value, syllable.nucleus.marks)
        : syllable.nucleus.value;
      index = syllable.nucleus.end;
      continue;
    }

    if (vowels.has(current.base)) continue;
    if (!consonants[current.base]) continue;
    if (current.base === "γ" && next && gammaNasalizers.has(next.base)) output += "ŋ";
    else if ((current.base === "σ" || current.base === "ς") && next && sigmaVoicers.has(next.base)) output += "z";
    else if (current.base === "ρ" && (wordStart || previous?.base === "ρ" || current.marks.has(rough))) output += "r̥";
    else output += consonants[current.base];
  }
  return output;
}

function transcribeWord(word: string, mode: AccentMode) {
  const input = units(word);
  const nuclei = findNuclei(input);
  const syllables = syllabify(input, nuclei);
  if (!syllables.length) return "";

  return syllables.map((syllable) => {
    const spoken = transcribeSyllable(input, syllable, mode);
    // Groton explicitly tells learners to stress accented syllables even though
    // Lesson 2 explains that the historical accents marked pitch. For isolated
    // course audio, apply that classroom convention to acute, grave, and
    // circumflex alike. Monosyllables do not need an audible stress contrast.
    if (mode === "tts" && syllables.length > 1 && hasAccent(syllable.nucleus.marks)) return `ˈ${spoken}`;
    return spoken;
  }).join("");
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
