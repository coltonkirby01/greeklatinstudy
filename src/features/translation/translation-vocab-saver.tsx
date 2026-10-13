import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DictionaryMatch, TranslationHelperLanguage } from "./dictionary-sources";
import { deleteTranslationVocabEntry, listTranslationVocabEntries, saveTranslationVocabEntry } from "./translation-vocab-repository";
import { dictionaryChoiceKey, distinctDictionaryChoices, vocabEntryKey, type TranslationVocabEntry } from "./translation-vocab-model";

const vocabSaverCss = `.translation-vocab-saver{display:grid;gap:.8rem}.translation-definition:has(> .translation-vocab-saver)>.translation-definition-header,.translation-definition:has(> .translation-vocab-saver)>.translation-result-section,.translation-definition:has(> .translation-vocab-saver)>.translation-source-line,.translation-definition:has(> .translation-vocab-saver)>.translation-alternatives{display:none}.translation-vocab-selected{display:grid;gap:.14rem}.translation-vocab-selected span{font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-selected h2{margin:0;font-family:var(--font-serif);font-size:2rem;line-height:1.1}.translation-vocab-definition{border:1px solid var(--border);border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 2%,var(--panel));overflow:hidden}.translation-vocab-definition>summary{list-style:none;cursor:pointer;display:flex;align-items:flex-start;justify-content:space-between;gap:.7rem;padding:.72rem .78rem;background:color-mix(in srgb,var(--primary) 5%,var(--panel));font-size:.91rem;line-height:1.42}.translation-vocab-definition>summary::-webkit-details-marker{display:none}.translation-vocab-definition>summary::after{content:"▸";flex:0 0 auto;color:var(--muted-foreground);font-size:.9rem;line-height:1.35;transition:transform .12s ease}.translation-vocab-definition[open]>summary::after{transform:rotate(90deg)}.translation-vocab-definition[open]>summary{border-bottom:1px solid var(--border)}.translation-vocab-summary-copy{display:flex;align-items:baseline;gap:.5rem;min-width:0;flex-wrap:wrap}.translation-vocab-summary-meaning{font-weight:750;color:var(--foreground)}.translation-vocab-summary-pos,.translation-vocab-summary-grammar{flex:0 0 auto;color:var(--muted-foreground);font-size:.78rem;font-weight:850;white-space:nowrap}.translation-vocab-summary-grammar{color:color-mix(in srgb,var(--primary) 72%,var(--muted-foreground))}.translation-vocab-definition-body{display:grid;gap:0}.translation-vocab-definition-head{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.72rem .78rem;background:color-mix(in srgb,var(--primary) 2%,var(--panel));border-bottom:1px solid var(--border)}.translation-vocab-analysis-label{font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-save{display:inline-flex;align-items:center;gap:.42rem;cursor:pointer;font-size:.8rem;font-weight:800;white-space:nowrap}.translation-vocab-save input{margin:0}.translation-vocab-save:has(input:disabled){cursor:not-allowed;opacity:.62}.translation-vocab-save:has(input:checked){color:var(--primary)}.translation-vocab-info{display:grid;gap:.3rem;padding:.68rem .78rem;border-top:1px solid var(--border)}.translation-vocab-definition-head+.translation-vocab-info{border-top:0}.translation-vocab-info-label{font-size:.67rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-foreground)}.translation-vocab-info p{margin:0;line-height:1.48;font-size:.91rem}.translation-vocab-headword{font-family:var(--font-serif);font-size:1.08rem;line-height:1.35}.translation-vocab-form-list,.translation-vocab-raw-list{display:grid;gap:.32rem;margin:0;padding:0;list-style:none}.translation-vocab-form-list li{padding:.42rem .5rem;border-radius:calc(var(--radius) - 4px);background:color-mix(in srgb,var(--primary) 6%,var(--panel));font-size:.86rem;line-height:1.4}.translation-vocab-raw,.translation-vocab-raw-list code{display:block;max-width:100%;padding:.42rem .5rem;border-radius:calc(var(--radius) - 4px);background:color-mix(in srgb,var(--foreground) 5%,var(--panel));font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.72rem;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.translation-vocab-message{margin:0;font-size:.76rem;color:var(--muted-foreground)}.translation-vocab-message a{font-weight:750;color:var(--primary)}.translation-vocab-message.is-error{color:#b42318}`;

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
const genderLabels = ["masculine", "feminine", "neuter", "common gender", "gender unspecified"] as const;

function displayPartOfSpeech(partOfSpeech?: string) {
  const trimmed = partOfSpeech?.trim();
  if (!trimmed) return null;
  return partOfSpeechLabels[trimmed.toLocaleLowerCase()] ?? `${trimmed.charAt(0).toLocaleUpperCase()}${trimmed.slice(1)}`;
}

function titleCase(value: string) {
  return `${value.charAt(0).toLocaleUpperCase()}${value.slice(1)}`;
}

export function grammaticalPreview(forms?: readonly string[]) {
  if (!forms?.length) return null;
  const normalized = forms.map((form) => form.toLocaleLowerCase());
  const cases = caseLabels.filter((label) => normalized.some((form) => form.includes(label)));
  const genders = genderLabels.filter((label) => normalized.some((form) => form.includes(label)));
  if (!cases.length && !genders.length) return null;
  const caseText = cases.map(titleCase).join(" / ");
  const genderText = genders.map(titleCase).join(" / ");
  return [caseText, genderText].filter(Boolean).join(" · ");
}

function InfoSection({ label, children }: { label: string; children?: ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return <section className="translation-vocab-info">
    <span className="translation-vocab-info-label">{label}</span>
    {typeof children === "string" ? <p>{children}</p> : children}
  </section>;
}

function ListSection({ label, values, raw = false }: { label: string; values?: readonly string[]; raw?: boolean }) {
  if (!values?.length) return null;
  return <InfoSection label={label}>
    <ul className={raw ? "translation-vocab-raw-list" : "translation-vocab-form-list"}>
      {values.map((value, index) => <li key={`${value}-${index}`}>{raw ? <code>{value}</code> : value}</li>)}
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
      const grammarPreview = grammaticalPreview(choice.morphology);
      return <details className="translation-vocab-definition" key={key}>
        <summary>
          <span className="translation-vocab-summary-copy">
            <span className="translation-vocab-summary-meaning">{choice.definition}</span>
            {partOfSpeechLabel && <span className="translation-vocab-summary-pos">{partOfSpeechLabel}</span>}
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
          <InfoSection label="Meaning"><p>{choice.definition}</p></InfoSection>
          <ListSection label={(choice.morphology?.length ?? 0) > 1 ? "Possible forms" : "Form"} values={choice.morphology} />
          <InfoSection label="Dictionary details">{whitaker?.dictionaryDetails}</InfoSection>
          <InfoSection label="Age">{whitaker?.age}</InfoSection>
          <InfoSection label="Subject area">{whitaker?.area}</InfoSection>
          <InfoSection label="Geography">{whitaker?.geography}</InfoSection>
          <InfoSection label="Frequency">{whitaker?.frequency}</InfoSection>
          <InfoSection label="Dictionary source">{whitaker?.dictionarySource}</InfoSection>
          <InfoSection label="Whitaker code">{whitaker?.code ? <code className="translation-vocab-raw">[{whitaker.code}]</code> : null}</InfoSection>
          <InfoSection label="Raw dictionary entry">{whitaker?.rawEntry ? <code className="translation-vocab-raw">{whitaker.rawEntry}</code> : null}</InfoSection>
          <ListSection label="Raw Whitaker analysis" values={whitaker?.rawAnalyses} raw />
          <InfoSection label={language === "latin" ? "Lookup source" : "Source"}>{choice.sourceRef || choice.source}</InfoSection>
        </div>
      </details>;
    })}

    {!user && <p className="translation-vocab-message"><Link to="/account">Sign in</Link> to enable the Save word checkboxes and keep the selected definitions in your cloud vocabulary deck.</p>}
    {user && loading && <p className="translation-vocab-message">Checking your saved vocabulary…</p>}
    {error && <p className="translation-vocab-message is-error" role="alert">{error}</p>}
  </section>;
}