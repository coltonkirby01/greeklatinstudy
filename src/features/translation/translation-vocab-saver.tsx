import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { DictionaryMatch, TranslationHelperLanguage } from "./dictionary-sources";
import { deleteTranslationVocabEntry, listTranslationVocabEntries, saveTranslationVocabEntry } from "./translation-vocab-repository";
import { dictionaryChoiceKey, distinctDictionaryChoices, vocabEntryKey, type TranslationVocabEntry } from "./translation-vocab-model";

const vocabSaverCss = `.translation-vocab-saver{display:grid;gap:.55rem;padding-top:.78rem;border-top:1px solid var(--border)}.translation-vocab-saver-head{display:grid;gap:.22rem}.translation-vocab-saver-head strong{font-size:.88rem}.translation-vocab-saver-head span{font-size:.76rem;line-height:1.4;color:var(--muted-foreground)}.translation-vocab-choices{display:grid;gap:.38rem}.translation-vocab-choice{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.55rem;align-items:start;padding:.55rem .6rem;border:1px solid var(--border);border-radius:calc(var(--radius) - 2px);cursor:pointer;background:color-mix(in srgb,var(--primary) 3%,var(--panel))}.translation-vocab-choice:has(input:checked){border-color:color-mix(in srgb,var(--primary) 52%,var(--border));background:color-mix(in srgb,var(--primary) 8%,var(--panel))}.translation-vocab-choice input{margin-top:.18rem}.translation-vocab-choice-copy{display:grid;gap:.12rem}.translation-vocab-choice-copy strong{font-family:var(--font-serif);font-size:.98rem}.translation-vocab-choice-copy span{font-size:.82rem;line-height:1.35}.translation-vocab-choice-copy small{font-size:.7rem;color:var(--muted-foreground)}.translation-vocab-message{margin:0;font-size:.76rem;color:var(--muted-foreground)}.translation-vocab-message a{font-weight:750;color:var(--primary)}.translation-vocab-message.is-error{color:#b42318}`;

type Props = {
  language: TranslationHelperLanguage;
  surfaceWord: string | null;
  matches: readonly DictionaryMatch[];
  user: User | null;
};

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

  return <section className="translation-vocab-saver" aria-label="Save word to vocabulary flash cards">
    <style>{vocabSaverCss}</style>
    <div className="translation-vocab-saver-head">
      <strong>Save to vocab flash cards</strong>
      <span>Choose the dictionary entry or sense you want to study. Different grammatical analyses of the same dictionary entry are combined, so declension or conjugation forms do not create separate choices.</span>
    </div>
    <div className="translation-vocab-choices">
      {choices.map((choice) => {
        const key = dictionaryChoiceKey(choice);
        const saved = entryByKey.has(key);
        return <label className="translation-vocab-choice" key={key}>
          <input
            type="checkbox"
            checked={saved}
            disabled={!user || loading || pending.has(key)}
            onChange={(event) => void toggleChoice(choice, event.target.checked)}
          />
          <span className="translation-vocab-choice-copy">
            <strong>{choice.headword}</strong>
            <span>{choice.definition}</span>
            <small>{choice.sourceRef ? `${choice.source} · ${choice.sourceRef}` : choice.source}</small>
          </span>
        </label>;
      })}
    </div>
    {!user && <p className="translation-vocab-message"><Link to="/account">Sign in</Link> to keep these vocabulary cards in your cloud account and study them in the Greek or Latin app.</p>}
    {user && loading && <p className="translation-vocab-message">Checking your saved vocabulary…</p>}
    {error && <p className="translation-vocab-message is-error" role="alert">{error}</p>}
  </section>;
}
