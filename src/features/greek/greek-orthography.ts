const monotonicTonosToPolytonicOxia: Record<string, string> = {
  "ά": "ά",
  "έ": "έ",
  "ή": "ή",
  "ί": "ί",
  "ό": "ό",
  "ύ": "ύ",
  "ώ": "ώ",
  "Ά": "Ά",
  "Έ": "Έ",
  "Ή": "Ή",
  "Ί": "Ί",
  "Ό": "Ό",
  "Ύ": "Ύ",
  "Ώ": "Ώ",
  "ΐ": "ΐ",
  "ΰ": "ΰ",
  "΄": "´",
  "\u0341": "\u0301",
};

/**
 * Keep Greek study text visibly polytonic.
 *
 * Modern Greek tonos code points are canonically acute, but several common
 * serif fonts render them as an upright/unspecified wedge at flashcard sizes.
 * Converting them to the corresponding polytonic oxia form preserves the
 * intended acute while allowing grave (varia) to remain visibly distinct.
 *
 * This function does not infer accent rules. If Groton/source text requires a
 * grave, the source must contain a grave. It only removes visually ambiguous
 * tonos encodings from Greek card text.
 */
export function normalizeGreekDisplayAccents(text: string) {
  return Array.from(text, (char) => monotonicTonosToPolytonicOxia[char] ?? char).join("");
}

export function hasAmbiguousGreekTonos(text: string) {
  return Array.from(text).some((char) => Object.hasOwn(monotonicTonosToPolytonicOxia, char));
}

/** Recursively normalizes Greek strings inside imported card metadata/charts. */
export function normalizeGreekCardValue<T>(value: T): T {
  if (typeof value === "string") return normalizeGreekDisplayAccents(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeGreekCardValue(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeGreekCardValue(item)]),
    ) as T;
  }
  return value;
}
