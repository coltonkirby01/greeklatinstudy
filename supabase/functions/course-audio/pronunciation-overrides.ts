export type PronunciationOverrides = {
  canonicalIpa?: string;
  ttsIpa?: string;
  pronunciationSystem?: string;
  pronunciationText?: string;
};

function firstString(metadata: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeIpa(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Multiple forms may be supplied as `/.../, /.../`; preserve those explicit
  // delimiters. A single bare transcription is wrapped for ElevenLabs v3.
  if (trimmed.startsWith("/") && trimmed.endsWith("/")) return trimmed;
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

/**
 * Optional metadata hooks for human-reviewed exceptions. The automatic engine
 * remains the default, but orthography alone cannot always recover dichronon
 * length or every historical genuine/spurious ει distinction. Imported Greek
 * cards can therefore preserve a reviewed canonical IPA and, separately, an
 * ElevenLabs-compatible IPA without changing the visible card text.
 */
export function pronunciationOverridesFromMetadata(metadata: Record<string, unknown> | null | undefined): PronunciationOverrides {
  const source = metadata ?? {};
  return {
    canonicalIpa: normalizeIpa(firstString(source, ["canonicalIpa", "pronunciationIpa"])),
    ttsIpa: normalizeIpa(firstString(source, ["elevenLabsIpa", "ttsIpa", "pronunciationTtsIpa"])),
    pronunciationSystem: firstString(source, ["pronunciationSystem", "audioPronunciationSystem"]),
    pronunciationText: firstString(source, ["pronunciationText", "audioText", "greekAudioText"]),
  };
}
