import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MEDIEVAL_LATIN_PRONUNCIATION_SYSTEM,
  MEDIEVAL_LATIN_PROFILE_RULES,
  latinParadigmToElevenLabsIpa,
  latinToElevenLabsIpa,
  latinToMedievalIpa,
  stripUnpronouncedLatinNotation,
} from "../supabase/functions/course-audio/medieval-latin-ipa";

type ParadigmFile = Array<{ rows: Array<{ cells: string[] }> }>;

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

  it("implements the broad high-confidence medieval changes drawn from Rigg", () => {
    expect(latinToMedievalIpa("caelum")).toBe("/ˈselum/");
    expect(latinToMedievalIpa("poena")).toBe("/ˈpena/");
    expect(latinToMedievalIpa("lyra")).toBe("/ˈlira/");
    expect(latinToMedievalIpa("gratia")).toBe("/ˈgrasia/");
    expect(latinToMedievalIpa("ratio")).toBe("/ˈrasio/");
    expect(latinToMedievalIpa("mixtio")).toBe("/ˈmikstio/");
    expect(latinToMedievalIpa("scilicet")).toBe("/ˈsiliset/");
    expect(latinToMedievalIpa("habet")).toBe("/ˈabet/");
    expect(latinToMedievalIpa("philosophia")).toBe("/filoˈsofia/");
  });

  it("keeps genuinely region-sensitive consonants explicitly provisional", () => {
    expect(MEDIEVAL_LATIN_PROFILE_RULES).toEqual({
      frontC: "s",
      frontSc: "s",
      tiBeforeVowel: "s+i",
      h: "silent",
      frontG: "g (provisional)",
      gn: "gn (provisional)",
      qu: "kw (provisional)",
    });
    const policy = fs.readFileSync("docs/MEDIEVAL_LATIN_PRONUNCIATION.md", "utf8");
    expect(policy).toContain("Rules that still require a comparative audit before production generation");
    expect(policy).toContain("exact realization of `g` before front vowels");
    expect(policy).toContain("`gn`");
    expect(policy).toContain("`qu`");
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

  it("can convert every current Latin active/passive paradigm cell without speaking morphology dashes", () => {
    const files = [
      "public/data/latin-active-indicative-paradigms.json",
      "public/data/latin-passive-indicative-paradigms.json",
    ];
    for (const path of files) {
      const paradigms = JSON.parse(fs.readFileSync(path, "utf8")) as ParadigmFile;
      for (const form of paradigms.flatMap((card) => card.rows.flatMap((row) => row.cells))) {
        const ipa = latinToMedievalIpa(form);
        expect(ipa, form).toMatch(/^\/.*\/$/u);
        expect(ipa, form).not.toContain("-");
      }
    }
  });
});
