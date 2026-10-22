import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DictionaryMatch, TranslationHelperLanguage } from "./dictionary-sources";
import { latinInflectionClass } from "./latin-grammar-display";
import { deleteTranslationVocabEntry, listTranslationVocabEntries, saveTranslationVocabEntry } from "./translation-vocab-repository";
import { dictionaryChoiceKey, distinctDictionaryChoices, vocabEntryKey, type TranslationVocabEntry } from "./translation-vocab-model";

const vocabSaverCss = `.translation-vocab-saver{display:grid;gap:.8rem}.translation-definition:has(> .translation-vocab-saver)>.translation-definition-header,.translation-definition:has(> .translation-vocab-saver)>.translation-result-section,.translation-definition:has(> .translation-vocab-saver)>.translation-source-line,.translation-definition:has(> .translation-vocab-saver)>.translation-alternatives{display:none}.translation-vocab-selected{display:grid;gap:.14rem}.translation-vocab-selected span{font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-selected h2{margin:0;font-family:var(--font-serif);font-size:2rem;line-height:1.1}.translation-vocab-definition{border:1px solid var(--border);border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 2%,var(--panel));overflow:hidden}.translation-vocab-definition>summary{list-style:none;cursor:pointer;display:flex;align-items:flex-start;justify-content:space-between;gap:.7rem;padding:.72rem .78rem;background:color-mix(in srgb,var(--primary) 5%,var(--panel));font-size:.91rem;line-height:1.42}.translation-vocab-definition>summary::-webkit-details-marker{display:none}.translation-vocab-definition>summary::after{content:"▸";flex:0 0 auto;color:var(--muted-foreground);font-size:.9rem;line-height:1.35;transition:transform .12s ease}.translation-vocab-definition[open]>summary::after{transform:rotate(90deg)}.translation-vocab-definition[open]>summary{border-bottom:1px solid var(--border)}.translation-vocab-summary-copy{display:flex;align-items:baseline;gap:.5rem;min-width:0;flex-wrap:wrap}.translation-vocab-summary-meaning{font-weight:750;color:var(--foreground)}.translation-vocab-summary-pos,.translation-vocab-summary-grammar{flex:0 0 auto;color:var(--muted-foreground);font-size:.78rem;font-weight:850;white-space:nowrap}.translation-vocab-summary-grammar{color:color-mix(in srgb,var(--primary) 72%,var(--muted-foreground))}.translation-vocab-summary-class{padding:.12rem .4rem;border:1px solid color-mix(in srgb,var(--primary) 18%,var(--border));border-radius:999px;color:var(--primary);font-size:.76rem;font-weight:800;white-space:nowrap}.translation-vocab-summary-degree{padding:.12rem .4rem;border-radius:999px;background:color-mix(in srgb,var(--primary) 12%,var(--panel));color:var(--primary);font-size:.76rem;font-weight:850;white-space:nowrap}.translation-vocab-definition-body{display:grid;gap:0}.translation-vocab-definition-head{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.72rem .78rem;background:color-mix(in srgb,var(--primary) 2%,var(--panel));border-bottom:1px solid var(--border)}.translation-vocab-analysis-label{font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-save{display:inline-flex;align-items:center;gap:.42rem;cursor:pointer;font-size:.8rem;font-weight:800;white-space:nowrap}.translation-vocab-save input{margin:0}.translation-vocab-save:has(input:disabled){cursor:not-allowed;opacity:.62}.translation-vocab-save:has(input:checked){color:var(--primary)}.translation-vocab-info{display:grid;gap:.3rem;padding:.68rem .78rem;border-top:1px solid var(--border)}.translation-vocab-definition-head+.translation-vocab-info{border-top:0}.translation-vocab-info-label{font-size:.67rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-info p{margin:0;line-height:1.48;font-size:.91rem}.translation-vocab-headword{font-family:var(--font-serif);font-size:1.08rem;line-height:1.35}.translation-vocab-form-list{display:grid;gap:.32rem;margin:0;padding:0;list-style:none}.translation-vocab-form-list li{padding:.42rem .5rem;border-radius:calc(var(--radius) - 4px);background:color-mix(in srgb,var(--primary) 6%,var(--panel));font-size:.86rem;line-height:1.4}.translation-vocab-message{margin:0;font-size:.76rem;color:var(--muted-foreground)}.translation-vocab-message a{font-weight:750;color:var(--primary)}.translation-vocab-message.is-error{color:#b42318}`;

type Props = {
  language: TranslationHelperLanguage;
  surfaceWord: string | null;
  matches: readonly DictionaryMatch[];
  user: User | null;
};

const partOfSpeechLabels: Record<string, string> = {
  noun: "Noun",
  verb: "Verb",
  participle: "Participle",
  adjective: "Adjective",
  adverb: "Adverb",
  preposition: "Preposition",
  conjunction: "Conjunction",
  interjection: "Interjection",
  pronoun: "Pronoun",
  numeral: "Numeral",
  supine: "Supine",
  enclitic: "Enclitic",
  prefix: "Prefix",
  suffix: "Suffix",
};

const caseLabels = ["nominative", "genitive", "dative", "accusative", "ablative", "vocative", "locative"] as const;
const numberLabels = ["singular", "plural"] as const;
const genderLabels = ["masculine", "feminine", "neuter", "common gender", "gender unspecified"] as const;

function displayPartOfSpeech(partOfSpeech?: string) {
  const trimmed = partOfSpeech?.trim();
  if (!trimmed) return null;
  return partOfSpeechLabels[trimmed.toLocaleLowerCase()] ?? `${trimmed.charAt(0).toLocaleUpperCase()}${trimmed.slice(1)}`;
}

function titleCase(value: string) {
  return `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}`;
}

function isNounAnalysis(normalizedForms: readonly string[], partOfSpeech?: string) {
  if (partOfSpeech?.trim().toLocaleLowerCase() === "noun") return true;
  if (normalizedForms.some((form) => /(?:^| · )noun(?: · |$)/u.test(form))) return true;
  return normalizedForms.some((form) => form.includes("declension") && !form.includes("adjective"));
}

export function grammaticalPreview(forms?: readonly string[], partOfSpeech?: string) {
  if (!forms?.length) return null;
  const normalized = forms.map((form) => form.toLocaleLowerCase());
  const cases = caseLabels.filter((label) => normalized.some((form) => form.includes(label)));
  const caseText = cases.map(titleCase).join(" / ");

  if (isNounAnalysis(normalized, partOfSpeech)) {
    const numbers = numberLabels.filter((label) => normalized.some((form) => form.includes(label)));
    const numberText = numbers.map(titleCase).join(" / ");
    if (!cases.length && !numbers.length) return null;
    return [caseText, numberText].filter(Boolean).join(" · ");
  }

  const genders = genderLabels.filter((label) => normalized.some((form) => form.includes(label)));
  if (!cases.length && !genders.length) return null;
  const genderText = genders.map(titleCase).join(" / ");
  return [caseText, genderText].filter(Boolean).join(" · ");
}

/** Preserve the degree given by Whitaker's parsed forms, including uncommon
 * comparative or superlative readings. Use its raw output only as a fallback
 * when normalized morphology contains no comparison degree. */
export function comparisonPreview(forms?: readonly string[], rawAnalyses?: readonly string[]): string | null {
  const degrees = new Set<string>();
  for (const form of forms ?? []) {
    for (const degree of ["positive", "comparative", "superlative"]) {
      if (new RegExp(`\\b${degree}\\b`, "iu").test(form)) degrees.add(degree);
    }
  }
  if (!degrees.size) {
    for (const line of rawAnalyses ?? []) {
      const match = line.match(/\b(?:ADJ|ADV)\b[^\r\n]*\b(POS|COMP|SUPER)\s*$/u);
      if (match) degrees.add({ POS: "positive", COMP: "comparative", SUPER: "superlative" }[match[1]] ?? "");
    }
  }
  const ordered = ["positive", "comparative", "superlative"].filter((degree) => degrees.has(degree));
  return ordered.length ? ordered.map(titleCase).join(" / ") : null;
}

export function definitionPreview(definition: string, maxWords = 3) {
  const words = definition.trim().replace(/\s+/gu, " ").split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ").replace(/[;,.:]+$/u, "")}…`;
}

function InfoSection({ label, children }: { label: string; children?: ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return <section className="translation-vocab-info">
    <span className="translation-vocab-info-label">{label}</span>
    {typeof children === "string" ? <p>{children}</p> : children}
  </section>;
}

function ListSection({ label, values }: { label: string; values?: readonly string[] }) {
  if (!values?.length) return null;
  return <InfoSection label={label}>
    <ul className="translation-vocab-form-list">
      {values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}
    </ul>
  </InfoSection>;
}

export function TranslationVocabSaver({ language, surfaceWord, matches, user }: Props) {
  const [entries, setEntries] = useState<TranslationVocabEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const choices = useMemo(() => distinctDictionaryChoices(matches), [matches]);
  const entryByKey = useMemo(() => new Map(entries.map((entry) => [vocabEntryKey(entry), entry])), [entries]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return () => { cancelled = true; };
    }
    setLoading(true);
    listTranslationVocabEntries(user, language)
      .then((next) => {
        if (cancelled) return;
        setEntries(next);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Saved vocabulary could not be loaded.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [language, user?.id]);

  async function toggleChoice(choice: DictionaryMatch, checked: boolean) {
    if (!user || !surfaceWord) return;
    const key = dictionaryChoiceKey(choice);
    setPending((current) => new Set(current).add(key));
    setError(null);
    try {
      if (checked) {
        const saved = await saveTranslationVocabEntry(user, language, surfaceWord, choice);
        setEntries((current) => [saved, ...current.filter((entry) => vocabEntryKey(entry) !== key)]);
      } else {
        const existing = entryByKey.get(key);
        if (existing) await deleteTranslationVocabEntry(user, existing.id);
        setEntries((current) => current.filter((entry) => vocabEntryKey(entry) !== key));
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The vocabulary choice could not be saved.");
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  if (!surfaceWord || choices.length === 0) return null;

  return <section className="translation-vocab-saver" aria-label="Dictionary definitions and vocabulary saving">
    <style>{vocabSaverCss}</style>
    <div className="translation-vocab-selected">
      <span>{language === "latin" ? "Selected word" : "Dictionary entry"}</span>
      <h2>{surfaceWord}</h2>
    </div>

    {choices.map((choice, index) => {
      const key = dictionaryChoiceKey(choice);
      const saved = entryByKey.has(key);
      const whitaker = choice.whitaker;
      const partOfSpeechLabel = displayPartOfSpeech(whitaker?.partOfSpeech);
      const grammarPreview = grammaticalPreview(choice.morphology, whitaker?.partOfSpeech);
      const degreePreview = language === "latin" ? comparisonPreview(choice.morphology, whitaker?.rawAnalyses) : null;
      const inflectionClass = language === "latin" ? latinInflectionClass(choice) : null;
      const meaningPreview = definitionPreview(choice.definition);
      return <details className="translation-vocab-definition" key={key}>
        <summary>
          <span className="translation-vocab-summary-copy">
            <span className="translation-vocab-summary-meaning">{meaningPreview}</span>
            {partOfSpeechLabel && <span className="translation-vocab-summary-pos">{partOfSpeechLabel}</span>}
            {inflectionClass && <span className="translation-vocab-summary-class">{inflectionClass.value}</span>}
            {degreePreview && <span className="translation-vocab-summary-degree">{degreePreview}</span>}
            {grammarPreview && <span className="translation-vocab-summary-grammar">{grammarPreview}</span>}
          </span>
        </summary>

        <div className="translation-vocab-definition-body">
          <div className="translation-vocab-definition-head">
            <span className="translation-vocab-analysis-label">{index === 0 ? "Primary interpretation" : `Alternative interpretation ${index + 1}`}</span>
            <label className="translation-vocab-save">
              <input
                type="checkbox"
                checked={saved}
                disabled={!user || loading || pending.has(key)}
                onChange={(event) => void toggleChoice(choice, event.target.checked)}
              />
              <span>{saved ? "Saved" : "Save word"}</span>
            </label>
          </div>

          <InfoSection label="Headword"><div className="translation-vocab-headword">{choice.headword}</div></InfoSection>
          <InfoSection label="Part of speech">{whitaker?.partOfSpeech}</InfoSection>
          {inflectionClass && <InfoSection label={inflectionClass.label}>{inflectionClass.value}</InfoSection>}
          {degreePreview && <InfoSection label="Degree of comparison">{degreePreview}</InfoSection>}
          <InfoSection label="Meaning"><p>{choice.definition}</p></InfoSection>
          <ListSection label={(choice.morphology?.length ?? 0) > 1 ? "Possible forms" : "Form"} values={choice.morphology} />
          {language === "greek" && <InfoSection label="Source">{choice.sourceRef || choice.source}</InfoSection>}
        </div>
      </details>;
    })}

    {!user && <p className="translation-vocab-message"><Link to="/account">Sign in</Link> to enable the Save word checkboxes and keep the selected definitions in your cloud vocabulary deck.</p>}
    {user && loading && <p className="translation-vocab-message">Checking your saved vocabulary…</p>}
    {error && <p className="translation-vocab-message is-error" role="alert">{error}</p>}
  </section>;
}