import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import { lesson3CourseAudioAssets, type Lesson3CourseAudioAsset } from "./lesson3-assets.ts";
import { lesson4CourseAudioAssets, lesson4VocabularyAudio } from "./lesson4-assets.ts";
import { lesson5CourseAudioAssets, lesson5VocabularyAudio } from "./lesson5-assets.ts";

export type GreekCourseAudioAsset = Lesson3CourseAudioAsset & { pronunciationSystem?: string };

const lesson3Vocabulary: Record<string, { label: string; greek: string }> = {
  "lesson3-v1": { label: "γράφω", greek: "γράφω" },
  "lesson3-v2": { label: "ἐθέλω", greek: "ἐθέλω" },
  "lesson3-v3": { label: "θῡ́ω", greek: "θῡ́ω" },
  "lesson3-v4": { label: "κλέπτω", greek: "κλέπτω" },
  "lesson3-v5": { label: "παιδεύω", greek: "παιδεύω" },
  "lesson3-v6": { label: "σπεύδω", greek: "σπεύδω" },
  "lesson3-v7": { label: "φυλάττω", greek: "φυλάττω" },
  "lesson3-v8": { label: "μή", greek: "μή" },
  "lesson3-v9": { label: "οὐ (οὐκ, οὐχ)", greek: "οὐ, οὐκ, οὐχ" },
  "lesson3-v10": { label: "καί", greek: "καί" },
  "lesson3-v11": { label: "καὶ...καί", greek: "καὶ...καί" },
};

// Isolated sound demonstrations use the same segmental choices as the course's
// Classical Attic engine. Josolon/Vox Graeca is dominant where open references
// differ; notably ζ is /zd/ here (UVic presents /dz/ as an alternative reconstruction).
const alphabetSounds: Record<string, { label: string; ipa: string }> = {
  alpha: { label: "Alpha sound", ipa: "/a/" },
  beta: { label: "Beta sound", ipa: "/b/" },
  gamma: { label: "Gamma sound", ipa: "/ɡ/" },
  delta: { label: "Delta sound", ipa: "/d/" },
  epsilon: { label: "Epsilon sound", ipa: "/e/" },
  zeta: { label: "Zeta sound", ipa: "/zd/" },
  eta: { label: "Eta sound", ipa: "/ɛː/" },
  theta: { label: "Theta sound", ipa: "/tʰ/" },
  iota: { label: "Iota sound", ipa: "/i/" },
  kappa: { label: "Kappa sound", ipa: "/k/" },
  lambda: { label: "Lambda sound", ipa: "/l/" },
  mu: { label: "Mu sound", ipa: "/m/" },
  nu: { label: "Nu sound", ipa: "/n/" },
  xi: { label: "Xi sound", ipa: "/ks/" },
  omicron: { label: "Omicron sound", ipa: "/o/" },
  pi: { label: "Pi sound", ipa: "/p/" },
  rho: { label: "Rho sound", ipa: "/r/" },
  sigma: { label: "Sigma sound", ipa: "/s/" },
  tau: { label: "Tau sound", ipa: "/t/" },
  upsilon: { label: "Upsilon sound", ipa: "/y/" },
  phi: { label: "Phi sound", ipa: "/pʰ/" },
  chi: { label: "Chi sound", ipa: "/kʰ/" },
  psi: { label: "Psi sound", ipa: "/ps/" },
  omega: { label: "Omega sound", ipa: "/ɔː/" },
};

const symbolLabels: Record<string, { label: string; text: string }> = {
  "punct-1": { label: "Comma", text: "Comma" },
  "punct-2": { label: "Period", text: "Period" },
  "punct-3": { label: "Colon or high dot", text: "Colon, or high dot" },
  "punct-4": { label: "Greek question mark", text: "Greek question mark" },
  "accent-1": { label: "Acute accent", text: "Acute accent" },
  "accent-2": { label: "Grave accent", text: "Grave accent" },
  "accent-3": { label: "Circumflex accent", text: "Circumflex accent" },
};

export function resolveBuiltinGreekAsset(assetId: string): GreekCourseAudioAsset | null {
  const paradigm = [...lesson3CourseAudioAssets, ...lesson4CourseAudioAssets, ...lesson5CourseAudioAssets].find((asset) => asset.id === assetId);
  if (paradigm) return paradigm;

  const vocabulary = lesson3Vocabulary[assetId] ?? lesson4VocabularyAudio[assetId] ?? lesson5VocabularyAudio[assetId];
  if (vocabulary) {
    const canonicalIpa = greekToClassicalIpa(vocabulary.greek);
    const ttsText = greekToElevenLabsIpa(vocabulary.greek);
    return ttsText ? { id: assetId, label: vocabulary.label, canonicalIpa, ttsText } : null;
  }

  const alphabetMatch = /^(?:cap|low)-(.+)$/u.exec(assetId);
  const alphabet = alphabetMatch ? alphabetSounds[alphabetMatch[1]] : null;
  if (alphabet) return { id: assetId, label: alphabet.label, canonicalIpa: alphabet.ipa, ttsText: alphabet.ipa };

  const symbol = symbolLabels[assetId];
  return symbol ? {
    id: assetId,
    label: symbol.label,
    ttsText: symbol.text,
    pronunciationSystem: "From Alpha to Omega — instructional symbol name (non-phonetic card)",
  } : null;
}
