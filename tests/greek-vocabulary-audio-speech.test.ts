import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveBuiltinGreekAsset } from "../supabase/functions/course-audio/builtin-greek-assets";
import { greekVocabularySpeech } from "../supabase/functions/course-audio/greek-vocabulary-speech";
import { greekToClassicalIpa, greekToElevenLabsIpa } from "../supabase/functions/course-audio/greek-ipa";

type Vocabulary = { id: string; greek: string; part_of_speech: string };
const all = Array.from({length:18},(_,i)=>i+3)
  .flatMap(n=>JSON.parse(fs.readFileSync("public/data/greek-lesson"+n+"-vocab.json","utf8")) as Vocabulary[]);
const verbs = all.filter(x=>x.part_of_speech==="verb");
const nouns = all.filter(x=>x.part_of_speech==="noun"||x.part_of_speech==="proper noun");
const articles = ["ὁ","ἡ","τό"];

function nounArticles(entry: Vocabulary) {
  return entry.greek.split(",").map(x=>x.trim()).filter(x=>
    articles.some(article=>article.normalize("NFD")===x.normalize("NFD")));
}
function lemma(entry:Vocabulary) {
  return entry.greek.split(",")[0].trim();
}

describe("Greek vocabulary audio pronunciation conventions",()=>{
  it("pronounces every principal part of every verb card, in order, with a pause between slots",()=>{
    expect(verbs).toHaveLength(45);
    for(const card of verbs) {
      const asset=resolveBuiltinGreekAsset(card.id);
      expect(asset,card.id).not.toBeNull();
      const parts=card.greek.split(",").map(x=>x.trim());
      expect(parts.length,card.id).toBeGreaterThanOrEqual(2);
      const expected=parts.map(greekToElevenLabsIpa).join(" [pause] ");
      expect(asset?.ttsText,card.id).toBe(expected);
      expect(asset?.canonicalIpa,card.id).toBe(greekToClassicalIpa(card.greek));
      expect(asset?.ttsText.split(" [pause] ").length,card.id).toBe(parts.length);
      expect(asset?.label,card.id).toBe(card.greek);
    }
  });

  it("does not stop at four parts: reads all six and preserves slash variants within a slot",()=>{
    const sample="λύω, λύσω, ἔλῡσα, λέλῡκα, λέλῡμαι, ἐλύθην";
    const speech=greekVocabularySpeech(sample,"λύω, λύσω, ἔλῡσα","verb");
    expect(speech.kind).toBe("verb");
    expect(speech.parts).toHaveLength(6);
    expect(speech.text).toBe(sample);
    expect(speech.parts[4]).toBe("λέλῡμαι");
    expect(speech.parts[5]).toBe("ἐλύθην");
    const alternate=greekVocabularySpeech("λέγω, ἐρῶ/λέξω, εἶπον/ἔλεξα, εἴρηκα","λέγω","verb");
    expect(alternate.parts).toHaveLength(4);
    expect(greekToElevenLabsIpa(alternate.parts[1]).split(", ")).toHaveLength(2);
    expect(greekToElevenLabsIpa(alternate.parts[2]).split(", ")).toHaveLength(2);
  });

  it("puts the definitive article first for every noun and proper noun without reading shorthand endings",()=>{
    expect(nouns).toHaveLength(73);
    for(const card of nouns){
      const asset=resolveBuiltinGreekAsset(card.id);
      expect(asset,card.id).not.toBeNull();
      const genders=nounArticles(card);
      expect(genders.length,card.id).toBeGreaterThan(0);
      const first=greekToElevenLabsIpa(genders[0]+" "+lemma(card));
      expect(asset?.ttsText.startsWith(first),card.id).toBe(true);
      expect(asset?.canonicalIpa?.startsWith(greekToClassicalIpa(genders[0]+" "+lemma(card))),card.id).toBe(true);
      expect(asset?.ttsText,card.id).not.toContain("/-/");
      expect(asset?.label,card.id).toBeTruthy();
      // A two-gender noun pronounces the article+headword twice, once per gender.
      if(genders.length>1) {
        const second=greekToElevenLabsIpa(genders[1]+" "+lemma(card));
        expect(asset?.ttsText,card.id).toContain(second);
      }
    }
  });

  it("preserves fully written noun inflections, but does not vocalize abbreviated endings",()=>{
    const earth=greekVocabularySpeech("γῆ, γῆς, γῇ, γῆν, ἡ","γῆ","noun");
    expect(earth.text).toBe("ἡ γῆ, γῆς, γῇ, γῆν");
    const tree=greekVocabularySpeech("δένδρον, -ου, τό","δένδρον","noun");
    expect(tree.text).toBe("τό δένδρον");
    const dual=greekVocabularySpeech("Ἕλλην, -ηνος, ὁ, ἡ","Ἕλλην","noun");
    expect(dual.text).toBe("ὁ Ἕλλην, ἡ Ἕλλην");
    const abbreviation=greekVocabularySpeech("ἀλήθεια","ἀλήθεια, ἀληθείᾱς, ἡ");
    expect(abbreviation.text).toBe("ἡ ἀλήθεια, ἀληθείᾱς");
  });

  it("does not add an article or change speech for non-nouns and verb-like adverbs",()=>{
    expect(greekVocabularySpeech("σοφός, -ή, -όν","σοφός").kind).toBe("other");
    expect(greekVocabularySpeech("ὁ μὲν ... ὁ δέ","ὁ μὲν, ὁ δέ").kind).toBe("other");
    expect(greekVocabularySpeech("νῦν","νῦν").text).toBe("νῦν");
    expect(greekVocabularySpeech("οὕτω","οὕτω").kind).toBe("other");
  });

  it("keeps public audio requests for cloud cards overridable and changes the browser cache version",()=>{
    const edge=fs.readFileSync("supabase/functions/course-audio/index.ts","utf8");
    expect(edge).toContain('!overrides.pronunciationText && !Array.isArray(metadata.chartRows)');
    expect(edge).toContain("overrides.ttsIpa ??");
    expect(edge).toContain("spoken.parts.map(greekToElevenLabsIpa)");
    const player=fs.readFileSync("src/features/greek/classical-greek-audio.tsx","utf8");
    expect(player).toContain('storageCacheVersion = "classical-greek-audio-v6"');
  });
});
