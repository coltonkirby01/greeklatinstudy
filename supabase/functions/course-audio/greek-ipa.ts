const greekLetter = /[\u0370-\u03ff\u1f00-\u1fff]/u;
const combining = /[\u0300-\u036f]/u;
const roughBreathing = "\u0314";
const acute = "\u0301";
const grave = "\u0300";
const circumflex = "\u0342";
const macron = "\u0304";
const diaeresis = "\u0308";
const iotaSubscript = "\u0345";

const vowels = new Set(["α", "ε", "η", "ι", "ο", "υ", "ω", "Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω"]);
const diphthongs: Record<string, string> = {
  αι: "ai̯", αυ: "au̯", ει: "ei̯", ευ: "ey̯", ηυ: "ɛːy̯", οι: "oi̯", ου: "uː", υι: "yi̯",
  ΑΙ: "ai̯", ΑΥ: "au̯", ΕΙ: "ei̯", ΕΥ: "ey̯", ΗΥ: "ɛːy̯", ΟΙ: "oi̯", ΟΥ: "uː", ΥΙ: "yi̯",
};

const consonants: Record<string, string> = {
  β: "b", γ: "g", δ: "d", ζ: "z", θ: "tʰ", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "ks",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", φ: "pʰ", χ: "kʰ", ψ: "ps",
  Β: "b", Γ: "g", Δ: "d", Ζ: "z", Θ: "tʰ", Κ: "k", Λ: "l", Μ: "m", Ν: "n", Ξ: "ks",
  Π: "p", Ρ: "r", Σ: "s", Τ: "t", Φ: "pʰ", Χ: "kʰ", Ψ: "ps",
};

type Cluster = { base: string; marks: string[] };

function clusters(word: string) {
  const normalized = word.normalize("NFD");
  const out: Cluster[] = [];
  for (let index = 0; index < normalized.length;) {
    const base = normalized[index];
    if (!greekLetter.test(base)) { index += 1; continue; }
    const marks: string[] = [];
    let cursor = index + 1;
    while (cursor < normalized.length && combining.test(normalized[cursor])) { marks.push(normalized[cursor]); cursor += 1; }
    out.push({ base, marks });
    index = cursor;
  }
  return out;
}

function accentPrefix(marks: string[]) {
  // The book describes Classical accents as pitch, not stress. ElevenLabs does
  // not expose reliable pitch-accent control, so acute/circumflex are marked as
  // stress only as a TTS approximation; grave is left un-stressed.
  return marks.includes(acute) || marks.includes(circumflex) ? "ˈ" : marks.includes(grave) ? "" : "";
}

function vowelSound(cluster: Cluster) {
  const lower = cluster.base.toLowerCase();
  const long = cluster.marks.includes(macron);
  if (cluster.marks.includes(iotaSubscript)) {
    if (lower === "α") return "aːi̯";
    if (lower === "η") return "ɛːi̯";
    if (lower === "ω") return "ɔːi̯";
  }
  if (lower === "α") return long ? "aː" : "a";
  if (lower === "ε") return "e";
  if (lower === "η") return "ɛː";
  if (lower === "ι") return long ? "iː" : "i";
  if (lower === "ο") return "o";
  if (lower === "υ") return long ? "yː" : "y";
  if (lower === "ω") return "ɔː";
  return "";
}

export function stripUnpronouncedGreekNotation(text: string) {
  // Parenthetical letters in paradigms are optional written forms; by course
  // convention they are not pronounced in the default recording.
  return text.replace(/\([^)]*\)/g, "").replace(/-/g, "").replace(/\s+/g, " ").trim();
}

export function greekToClassicalIpa(text: string) {
  const cleaned = stripUnpronouncedGreekNotation(text);
  const words = cleaned.match(/[\u0370-\u03ff\u1f00-\u1fff\u0300-\u036f]+/gu) ?? [];
  return words.map((word) => {
    const units = clusters(word);
    let result = "";
    for (let index = 0; index < units.length; index += 1) {
      const current = units[index];
      const lower = current.base.toLowerCase();
      const next = units[index + 1];
      const nextLower = next?.base.toLowerCase();
      const initialRough = index === 0 && (current.marks.includes(roughBreathing) || Boolean(next?.marks.includes(roughBreathing) && vowels.has(current.base)));
      if (initialRough && lower !== "ρ") result += "h";

      if (vowels.has(current.base)) {
        if (next && vowels.has(next.base) && !next.marks.includes(diaeresis) && !current.marks.includes(iotaSubscript)) {
          const pair = `${lower}${nextLower}`;
          const sound = diphthongs[pair];
          if (sound) {
            result += `${accentPrefix([...current.marks, ...next.marks])}${sound}`;
            index += 1;
            continue;
          }
        }
        result += `${accentPrefix(current.marks)}${vowelSound(current)}`;
        continue;
      }

      let sound = consonants[current.base] ?? "";
      if (lower === "γ" && nextLower && ["γ", "κ", "ξ", "χ"].includes(nextLower)) sound = "ŋ";
      if (lower === "σ" && nextLower && ["β", "γ", "δ", "μ"].includes(nextLower)) sound = "z";
      result += sound;
    }
    return result;
  }).filter(Boolean).map((word) => `/${word}/`).join(", ");
}

export function containsGreek(text: string) {
  return greekLetter.test(text.normalize("NFD"));
}
