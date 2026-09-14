import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MEDIEVAL_LATIN_COLUMN_PAUSE,
  MEDIEVAL_LATIN_FORM_PAUSE,
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

  it("uses conservative normalized values where medieval regional evidence diverges", () => {
    expect(MEDIEVAL_LATIN_PROFILE_RULES).toEqual({
      frontC: "s",
      frontSc: "s",
      tiBeforeVowel: "s+i",
      h: "silent",
      consonantalV: "v",
      consonantalI: "j",
      frontG: "g (normalized conservative choice)",
      gn: "gn (normalized conservative choice)",
      qu: "kw (normalized conservative choice)",
      vowelQuantity: "not phonemic; macrons retained for inherited stress",
    });
    expect(latinToMedievalIpa("iudicium")).toBe("/juˈdisium/");
    expect(latinToMedievalIpa("maior")).toBe("/ˈmajor/");
    expect(latinToMedievalIpa("generatio")).toBe("/geneˈrasio/");
    expect(latinToMedievalIpa("agnus")).toBe("/ˈagnus/");
    expect(latinToMedievalIpa("quaestio")).toContain("kw");
  });

  it("keeps canonical IPA and ElevenLabs input separate even while they currently agree", () => {
    expect(latinToElevenLabsIpa("laud-āmus")).toBe(latinToMedievalIpa("laud-āmus"));
    expect(latinToElevenLabsIpa("laud-āmus")).toMatch(/^\/.*\/$/u);
    expect(latinToElevenLabsIpa("laud-āmus")).not.toContain("-");
  });

  it("keeps paradigm pacing even within columns and longer between singular and plural", () => {
    const pacingPolicy = fs.readFileSync("docs/MEDIEVAL_LATIN_AUDIO_PACING.md", "utf8");
    expect(pacingPolicy).toContain("slightly brisk");
    expect(pacingPolicy).toContain("future Latin paradigm cards");
    expect(MEDIEVAL_LATIN_FORM_PAUSE).toBe("[short pause]");
    expect(MEDIEVAL_LATIN_COLUMN_PAUSE).toBe("[pause]");

    const tts = latinParadigmToElevenLabsIpa([
      ["laud-ō", "laud-ās", "laud-at"],
      ["laud-āmus", "laud-ātis", "laud-ant"],
    ]);
    expect(tts.match(/\[short pause\]/gu)).toHaveLength(4);
    expect(tts.match(/(?<!short )\[pause\]/gu)).toHaveLength(1);
    expect(tts.split(" [pause] ")).toEqual([
      "/ˈlau̯do/ [short pause] /ˈlau̯das/ [short pause] /ˈlau̯dat/",
      "/lau̯ˈdamus/ [short pause] /lau̯ˈdatis/ [short pause] /ˈlau̯dant/",
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
