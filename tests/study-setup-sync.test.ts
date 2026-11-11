import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalSettingsJson,
  loadLocalStudyReviewSetup,
  normalizeStudyReviewSetup,
  restoreCardExclusions,
  saveLocalStudyReviewSetup,
  validStringList,
} from "../src/features/study/synced-study-settings";

function storage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
  };
}

describe("Account-linked Greek and Latin study setup", () => {
  it("survives a hard reload in Shuffle instead of resetting to Adaptive", () => {
    const browser = storage();
    expect(loadLocalStudyReviewSetup("greek", browser).reviewMode).toBe("adaptive");
    saveLocalStudyReviewSetup("greek", {
      direction: "reverse", reviewMode: "shuffle", adaptiveStrength: 3,
    }, browser);
    expect(loadLocalStudyReviewSetup("greek", browser)).toEqual({
      direction: "reverse", reviewMode: "shuffle", adaptiveStrength: 3,
    });
    // Each language keeps its own locally cached mode.
    expect(loadLocalStudyReviewSetup("latin", browser)).toEqual({
      direction: "forward", reviewMode: "adaptive", adaptiveStrength: 2,
    });
  });

  it("retains Sequential and Confusables and validates corrupted preferences", () => {
    for (const reviewMode of ["sequential", "confusables"] as const) {
      expect(normalizeStudyReviewSetup({ direction: "forward", reviewMode, adaptiveStrength: 1 }).reviewMode).toBe(reviewMode);
    }
    expect(normalizeStudyReviewSetup({ direction: "other", reviewMode: "invalid", adaptiveStrength: 8 })).toEqual({
      direction: "forward", reviewMode: "adaptive", adaptiveStrength: 2,
    });
    expect(loadLocalStudyReviewSetup("greek", { getItem: () => "not json" }).reviewMode).toBe("adaptive");
  });

  it("keeps an exact card selection, including exclusions, without duplicates", () => {
    expect(validStringList(["lesson15-contractions", "lesson15-contractions", "lesson18-vocabulary"]))
      .toEqual(["lesson15-contractions", "lesson18-vocabulary"]);
    expect(validStringList(null)).toBeNull();
    expect(validStringList([1, "some group"])).toBeNull();
    expect(restoreCardExclusions(["alpha-omega-lesson15-contractions\u001flesson15-contraction-ai", "invalid", "alpha-omega-lesson15-contractions\u001flesson15-contraction-ai"]))
      .toEqual([{ deckId: "alpha-omega-lesson15-contractions", cardId: "lesson15-contraction-ai" }]);
  });

  it("avoids cloud save loops when database JSONB reorders object keys", () => {
    const first = { version: 1, selectedKeys: ["a", "b"], reviewMode: "shuffle", nested: { z: 2, a: 1 } };
    const cloud = { nested: { a: 1, z: 2 }, reviewMode: "shuffle", selectedKeys: ["a", "b"], version: 1 };
    expect(canonicalSettingsJson(first)).toBe(canonicalSettingsJson(cloud));
    expect(canonicalSettingsJson({ selectedKeys: ["a", "b"] })).not.toBe(canonicalSettingsJson({ selectedKeys: ["b", "a"] }));
  });

  it("wires both study pages to cloud hydration, local persistence and controlled review order", () => {
    const paths = ["src/pages/greek-page-v2.tsx", "src/pages/latin-page.tsx"];
    for (const path of paths) {
      const source = fs.readFileSync(path, "utf8");
      expect(source).toContain("useSyncedStudySettings(");
      expect(source).toContain("loadLocalStudyReviewSetup(");
      expect(source).toContain("saveLocalStudyReviewSetup(");
      expect(source).toContain("cloudSettings.ready");
      expect(source).toContain("excludedCardRefs:");
      expect(source).toContain("onReviewModeChange={setReviewMode}");
      expect(source).toContain("onReviewAdaptiveStrengthChange={setAdaptiveStrength}");
    }
    const session = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");
    expect(session).toContain("const selectionMode = reviewMode ?? localReviewMode;");
    expect(session).toContain("const adaptiveStrength = reviewAdaptiveStrength ?? localAdaptiveStrength;");
    const sync = fs.readFileSync("src/features/study/synced-study-settings.ts", "utf8");
    expect(sync).toContain('"account-study-settings:" + language');
    expect(sync).toContain('onConflict: "user_id,deck_id"');
    expect(sync).toContain("if (!userId || !ready || error");
  });
});
