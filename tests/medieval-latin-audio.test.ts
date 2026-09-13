import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveBuiltinLatinAsset } from "../supabase/functions/course-audio/builtin-latin-assets";
import { latinParadigmToElevenLabsIpa } from "../supabase/functions/course-audio/medieval-latin-ipa";

type SourceCard = {
  id: string;
  prompt: string;
  rows: Array<{ cells: [string, string] }>;
};

function sourceCards() {
  const paths = [
    "public/data/latin-active-indicative-paradigms.json",
    "public/data/latin-passive-indicative-paradigms.json",
  ];
  return paths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")) as SourceCard[]);
}

describe("Medieval Latin paradigm audio integration", () => {
  it("defines one stable cached-audio asset for all 36 current paradigm cards", () => {
    const cards = sourceCards();
    expect(cards).toHaveLength(36);
    for (const card of cards) {
      const asset = resolveBuiltinLatinAsset(card.id);
      expect(asset, card.id).not.toBeNull();
      expect(asset?.id).toBe(card.id);
      expect(asset?.label).toBe(card.prompt);
      expect(asset?.pronunciationSystem).toContain("Medieval Latin");
    }
  });

  it("derives each spoken paradigm from the authoritative displayed forms", () => {
    for (const card of sourceCards()) {
      const singular = card.rows.map((row) => row.cells[0]);
      const plural = card.rows.map((row) => row.cells[1]);
      const asset = resolveBuiltinLatinAsset(card.id);
      expect(asset?.ttsText, card.id).toBe(latinParadigmToElevenLabsIpa([singular, plural]));
      expect(asset?.ttsText.match(/\[pause\]/gu), card.id).toHaveLength(1);
      expect(asset?.ttsText, card.id).not.toContain("-");
      expect(asset?.canonicalIpa, card.id).toMatch(/^\/.*\/$/u);
    }
  });

  it("keeps the learner player cache-only until paid generation is explicitly approved", () => {
    const player = fs.readFileSync("src/features/latin/medieval-latin-audio.tsx", "utf8");
    expect(player).toContain("course_audio_assets");
    expect(player).toContain("course-audio/${encodedPath}");
    expect(player).not.toContain("/functions/v1/course-audio");

    const table = fs.readFileSync("src/features/latin/latin-paradigm-table.tsx", "utf8");
    expect(table).toContain("MedievalLatinAudio");
    expect(table).toContain("assetId={card.id}");
  });

  it("requires an explicit Latin-generation opt-in and a dedicated Latin voice on the server", () => {
    const edge = fs.readFileSync("supabase/functions/course-audio/index.ts", "utf8");
    expect(edge).toContain("resolveBuiltinLatinAsset");
    expect(edge).toContain("ELEVENLABS_MEDIEVAL_LATIN_VOICE_ID");
    expect(edge).toContain("allowGeneration?: boolean");
    expect(edge).toContain("body.allowGeneration === true");
    expect(edge).toContain('status: "generation-disabled"');
  });

  it("does not add Latin to the automatic Greek prewarm workflow", () => {
    const workflow = fs.readFileSync(".github/workflows/prewarm-greek-audio.yml", "utf8");
    expect(workflow).not.toContain("latin-active-indicative");
    expect(workflow).not.toContain("latin-passive-indicative");
  });
});
