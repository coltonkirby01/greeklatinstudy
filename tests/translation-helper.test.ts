import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeDictionaryKey, tokenizeTranslationText } from "../src/features/translation/dictionary-sources";
import { pdfTextItemsToString, translationFileKind } from "../src/features/translation/file-extraction";

describe("Translation Helper", () => {
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

  it("recognizes locally extractable text, DOCX, and PDF inputs", () => {
    expect(translationFileKind("notes.txt")).toBe("text");
    expect(translationFileKind("lesson.docx")).toBe("docx");
    expect(translationFileKind("reader.pdf")).toBe("pdf");
    expect(translationFileKind("legacy.doc")).toBe("legacy-doc");
    expect(translationFileKind("scan.png", "image/png")).toBe("image");
  });

  it("reassembles PDF text items with spaces, punctuation, and line breaks", () => {
    expect(pdfTextItemsToString([
      { str: "Arma" },
      { str: "virumque" },
      { str: "cano", hasEOL: true },
      { str: "Troiae" },
      { str: "," },
      { str: "qui" },
    ])).toBe("Arma virumque cano\nTroiae, qui");
  });

  it("registers the route and keeps the helper non-translational", () => {
    const app = fs.readFileSync("src/app.tsx", "utf8");
    const route = fs.readFileSync("src/route-preload.ts", "utf8");
    const nav = fs.readFileSync("src/config/site.ts", "utf8");
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");

    expect(app).toContain('path="translation-helper"');
    expect(route).toContain('"/translation-helper"');
    expect(nav).toContain('label: "Translation Helper"');
    expect(page).toContain("does not generate a sentence translation");
    expect(page).not.toContain("contextual meaning");
    expect(page).not.toContain("grammar explanation");
  });

  it("extracts DOCX/PDF uploads into the review step while keeping image OCR deferred", () => {
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");
    const extraction = fs.readFileSync("src/features/translation/file-extraction.ts", "utf8");

    expect(page).toContain("extractTranslationFile");
    expect(page).toContain("TXT/MD · DOCX · text-based PDF");
    expect(extraction).toContain("mammoth.browser.min.js");
    expect(extraction).toContain("pdf.min.js");
    expect(extraction).toContain("scanned/image-only PDF");
    expect(page).toContain("Image/scanned-PDF OCR later");
  });

  it("uses latin-words.com as the sole Latin helper source and preserves morphology", () => {
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");
    const lookup = fs.readFileSync("src/features/translation/latin-words-lookup.ts", "utf8");
    const edge = fs.readFileSync("supabase/functions/latin-lookup/index.ts", "utf8");
    const sources = fs.readFileSync("src/features/translation/dictionary-sources.ts", "utf8");
    const supabaseConfig = fs.readFileSync("supabase/config.toml", "utf8");

    expect(page).toContain("lookupLatinWords");
    expect(page).toContain("Whitaker's Words Online");
    expect(page).toContain("Possible forms");
    expect(page).toContain("Other possible analyses");
    expect(lookup).toContain("/functions/v1/latin-lookup?word=");
    expect(lookup).toContain("localStorage");
    expect(edge).toContain('const LATIN_WORDS_BASE = "https://latin-words.com"');
    expect(edge).toContain("/word/latin/");
    expect(edge).toContain("humanizeAnalysis");
    expect(edge).not.toContain("latin.30twelve.org");
    expect(edge).not.toContain("latin.71m.us");
    expect(sources).not.toContain("loadLatinDeck");
    expect(page).not.toContain("Dickinson");
    expect(page).not.toContain("Online Latin Dictionary");
    expect(page).not.toContain("Henle");
    expect(page).not.toContain("Moreland");
    expect(supabaseConfig).toContain("[functions.latin-lookup]");
    expect(supabaseConfig).toContain("verify_jwt = false");
  });

  it("keeps the clickable passage and lookup as the primary reader workspace", () => {
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");
    expect(page).toContain("translation-source-editor");
    expect(page).toContain("translation-reader-shell");
    expect(page).toContain("translation-lookup-brand");
    expect(page).toContain("Whitaker's Words Online");
    expect(page).toContain("Edit source");
    expect(page).toContain("setInputOpen(false)");
    expect(page).toContain("Click a word for Whitaker's definition and form");
    expect(page).toContain("grid-template-columns:minmax(0,1.85fr)");
  });

  it("saves authenticated Translation Helper texts to private cloud rows and restores them", () => {
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");
    const cloud = fs.readFileSync("src/features/translation/cloud-texts.ts", "utf8");
    const migration = fs.readFileSync("supabase/migrations/0008_translation_helper_cloud_texts.sql", "utf8");
    const privacy = fs.readFileSync("public/privacy/index.html", "utf8");

    expect(page).toContain("useAuth");
    expect(page).toContain("listCloudTranslationTexts");
    expect(page).toContain("saveCloudTranslationText");
    expect(page).toContain("deleteCloudTranslationText");
    expect(page).toContain("Saved texts");
    expect(page).toContain("Saved to cloud");
    expect(page).toContain('to="/account"');
    expect(page).toContain("forceNew: true");
    expect(cloud).toContain('.from("translation_texts")');
    expect(cloud).toContain('.eq("user_id", user.id)');
    expect(migration).toContain("create table public.translation_texts");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("users read their own translation texts");
    expect(migration).toContain("users create their own translation texts");
    expect(migration).toContain("users update their own translation texts");
    expect(migration).toContain("users delete their own translation texts");
    expect(privacy).toContain("Translation Helper texts");
  });

  it("keeps Greek restricted to Groton and Kubo", () => {
    const sources = fs.readFileSync("src/features/translation/dictionary-sources.ts", "utf8");
    const page = fs.readFileSync("src/pages/translation-helper-page.tsx", "utf8");

    expect(sources).toContain("loadGreekNewTestamentVocabularyDeck");
    expect(sources).toContain("loadGreekLesson10VocabularyDeck");
    expect(page).toContain("Groton");
    expect(page).toContain("Kubo");
  });
});
