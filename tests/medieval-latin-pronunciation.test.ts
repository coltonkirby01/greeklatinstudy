import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,
  MEDIEVAL_LATIN_PROVISIONAL_RULES,
  latinParadigmToElevenLabsIpa,
  latinToElevenLabsIpa,
  latinToMedievalIpa,
  stripUnpronouncedLatinNotation,
} from "../supabase/functions/course-audio/medieval-latin-ipa";

describe("normalized Medieval Latin pronunciation foundation", () => {
  it("documents a broad scholastic source policy instead of a narrow national accent", () => {
    const policy = fs.readFileSync("docs/MEDIEVAL_LATIN_PRONUNCIATION.md", "utf8");
    expect(MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM).toContain("Medieval Latin");
    expect(MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM).toContain("Rigg/Stotz");
    expect(policy).toContain("A. G. Rigg");
    expect(policy).toContain("Peter Stotz");
    expect(policy).toContain("Singing Early Music");
    expect(policy).toContain("Vox Latina");
    expect(policy).toContain("not “the exact accent of a Paris master in 1270.”");
  });

  it("removes instructional morphology without erasing quantity marks needed for stress", () => {
    expect(stripUnpronouncedLatinNotation("laud-āmus")).toBe("laudāmus");
    expect(stripUnpronouncedLatinNotation("mon-ēminī")).toBe("monēminī");
    expect(stripUnpronouncedLatinNotation("puellæ")).toBe("puellae");
  });

  it("collapses Classical vowel quantity in sound while retaining inherited stress", () => {
    expect(latinToMedievalIpa("laud-ō")).toBe("/ˈlau̯do/");
    expect(latinToMedievalIpa("laud-āmus")).toBe("/lau̯ˈdamus/");
    expect(latinToMedievalIpa("mon-ēmus")).toBe("/moˈnemus/");
    expect(latinToMedievalIpa("mitt-imus")).toBe("/ˈmittimus/");
    expect(latinToMedievalIpa("aud-ītis")).toBe("/au̯ˈditis/");
  });

  it("implements the broad high-confidence medieval changes before regional refinements", () => {
    expect(latinToMedievalIpa("caelum")).toBe("/ˈkelum/");
    expect(latinToMedievalIpa("poena")).toBe("/ˈpena/");
    expect(latinToMedievalIpa("lyra")).toBe("/ˈlira/");
    expect(latinToMedievalIpa("gratia")).toBe("/ˈgratsia/");
    expect(latinToMedievalIpa("ratio")).toBe("/ˈratsio/");
    expect(latinToMedievalIpa("mixtio")).toBe("/ˈmikstio/");
    expect(latinToMedievalIpa("philosophia")).toBe("/filoˈsofia/");
  });

  it("keeps region-sensitive consonants explicitly provisional until the comparative audit", () => {
    expect(MEDIEVAL_LATIN_PROVISIONAL_RULES).toEqual({
      frontC: "k",
      frontG: "g",
      h: "h",
      gn: "gn",
    });
    const policy = fs.readFileSync("docs/MEDIEVAL_LATIN_PRONUNCIATION.md", "utf8");
    expect(policy).toContain("Rules that require a comparative audit before production generation");
    expect(policy).toContain("exact realization of `c` before front vowels");
    expect(policy).toContain("exact realization of `g` before front vowels");
    expect(policy).toContain("`gn`");
  });

  it("keeps canonical IPA and ElevenLabs input separate even while they currently agree", () => {
    expect(latinToElevenLabsIpa("laud-āmus")).toBe(latinToMedievalIpa("laud-āmus"));
    expect(latinToElevenLabsIpa("laud-āmus")).toMatch(/^\/.*\/$/u);
    expect(latinToElevenLabsIpa("laud-āmus")).not.toContain("-");
  });

  it("reads paradigm columns vertically with one pause between singular and plural", () => {
    const tts = latinParadigmToElevenLabsIpa([
      ["laud-ō", "laud-ās", "laud-at"],
      ["laud-āmus", "laud-ātis", "laud-ant"],
    ]);
    expect(tts.match(/\[pause\]/gu)).toHaveLength(1);
    expect(tts.split(" [pause] ")).toEqual([
      "/ˈlau̯do/ /ˈlau̯das/ /ˈlau̯dat/",
      "/lau̯ˈdamus/ /lau̯ˈdatis/ /ˈlau̯dant/",
    ]);
  });
});
