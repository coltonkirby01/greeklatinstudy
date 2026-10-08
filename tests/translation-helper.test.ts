import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeDictionaryKey, tokenizeTranslationText } from "../src/features/translation/dictionary-sources";

describe("Translation Helper foundation", () => {
  it("normalizes Greek accents and Latin macrons for tolerant source lookup", () => {
    expect(normalizeDictionaryKey("λόγος")).toBe(normalizeDictionaryKey("λογος"));
    expect(normalizeDictionaryKey("rēs")).toBe(normalizeDictionaryKey("res"));
    expect(normalizeDictionaryKey("λόγος")).toBe("λογοσ");
  });

  it("tokenizes words without losing punctuation or whitespace", () => {
    const source = "Arma virumque cano.\nἘν ἀρχῇ.";
    expect(tokenizeTranslationText(source).join("")).toBe(source);
    expect(tokenizeTranslationText(source)).toContain("virumque");
    expect(tokenizeTranslationText(source)).toContain("ἀρχῇ");
  });

  it("registers the new route and limits learner-facing output to dictionary definitions", () => {
    const app = fs.readFileSync("src/app.tsx", "utf8");
    const route = fs.readFileSync("src/route-preload.ts", "utf8");
    const nav = fs.readFileSync("src/config/site.ts", "utf8");
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");

    expect(app).toContain('path="translation-helper"');
    expect(route).toContain('"/translation-helper"');
    expect(nav).toContain('label: "Translation Helper"');
    expect(page).toContain("dictionary definition");
    expect(page).not.toContain("AI tutor");
    expect(page).toContain("does not generate a sentence translation");
  });

  it("keeps Greek and Latin source boundaries explicit", () => {
    const sources = fs.readFileSync("src/features/translation/dictionary-sources.ts", "utf8");
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");

    expect(sources).toContain("loadGreekNewTestamentVocabularyDeck");
    expect(sources).toContain("loadGreekLesson10VocabularyDeck");
    expect(sources).toContain("loadLatinDeck");
    expect(page).toContain("Groton");
    expect(page).toContain("Kubo");
    expect(page).toContain("Dickinson Latin Core Vocabulary");
    expect(page).toContain("Online Latin Dictionary");
  });
});
