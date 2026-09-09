import { greekToClassicalIpa } from "./greek-ipa.ts";
import { lesson3CourseAudioAssets, type Lesson3CourseAudioAsset } from "./lesson3-assets.ts";

export type GreekCourseAudioAsset = Lesson3CourseAudioAsset;

const lesson3Vocabulary: Record<string, { label: string; greek: string }> = {
  "lesson3-v1": { label: "γράφω", greek: "γράφω" },
  "lesson3-v2": { label: "ἐθέλω", greek: "ἐθέλω" },
  "lesson3-v3": { label: "θῡ́ω", greek: "θῡ́ω" },
  "lesson3-v4": { label: "κλέπτω", greek: "κλέπτω" },
  "lesson3-v5": { label: "παιδεύω", greek: "παιδεύω" },
  "lesson3-v6": { label: "σπεύδω", greek: "σπεύδω" },
  "lesson3-v7": { label: "φυλάττω", greek: "φυλάττω" },
  "lesson3-v8": { label: "μή", greek: "μή" },
  "lesson3-v9": { label: "οὐ, οὐκ, οὐχ", greek: "οὐ, οὐκ, οὐχ" },
  "lesson3-v10": { label: "καί", greek: "καί" },
  "lesson3-v11": { label: "καὶ … καί", greek: "καὶ … καί" },
};

// These are sound demonstrations for the alphabet cards, following the
// pronunciation choices stated in From Alpha to Omega rather than Modern Greek.
const alphabetSounds: Record<string, { label: string; ipa: string }> = {
  alpha: { label: "Alpha sound", ipa: "/a/" },
  beta: { label: "Beta sound", ipa: "/b/" },
  gamma: { label: "Gamma sound", ipa: "/g/" },
  delta: { label: "Delta sound", ipa: "/d/" },
  epsilon: { label: "Epsilon sound", ipa: "/e/" },
  zeta: { label: "Zeta sound", ipa: "/z/" },
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

export function resolveBuiltinGreekAsset(assetId: string): GreekCourseAudioAsset | null {
  const paradigm = lesson3CourseAudioAssets.find((asset) => asset.id === assetId);
  if (paradigm) return paradigm;

  const vocabulary = lesson3Vocabulary[assetId];
  if (vocabulary) {
    const ttsText = greekToClassicalIpa(vocabulary.greek);
    return ttsText ? { id: assetId, label: vocabulary.label, ttsText } : null;
  }

  const alphabetMatch = /^(?:cap|low)-(.+)$/u.exec(assetId);
  const alphabet = alphabetMatch ? alphabetSounds[alphabetMatch[1]] : null;
  return alphabet ? { id: assetId, label: alphabet.label, ttsText: alphabet.ipa } : null;
}
