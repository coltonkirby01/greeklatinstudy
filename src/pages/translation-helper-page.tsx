import { ExternalLink, FileText, Image, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  loadTranslationDictionary,
  lookupDictionaryWord,
  tokenizeTranslationText,
  type DictionaryMatch,
  type TranslationHelperLanguage,
} from "../features/translation/dictionary-sources";
import { extractTranslationFile } from "../features/translation/file-extraction";
import { lookupLatinWords } from "../features/translation/latin-words-lookup";

const translationHelperCss = `.translation-helper-page{display:grid;gap:1rem}.translation-helper-heading p,.translation-source-policy p,.translation-empty,.translation-source-line,.translation-notice{color:var(--muted-foreground)}.translation-input,.translation-text,.translation-definition,.translation-source-policy{padding:1rem}.translation-input{display:grid;gap:.8rem}.translation-language{display:flex;gap:.35rem}.translation-language button{border:1px solid var(--border);border-radius:999px;padding:.5rem .9rem;background:var(--panel);color:inherit;font:inherit;font-weight:700}.translation-language button.is-active{background:var(--primary);color:var(--primary-foreground)}.translation-upload{display:flex;gap:.75rem;align-items:center;justify-content:space-between;border:1px dashed var(--border);border-radius:var(--radius);padding:.8rem}.translation-upload span{display:inline-flex;gap:.45rem;align-items:center}.translation-upload svg,.translation-file-types svg{width:1rem;height:1rem}.translation-file-types{display:flex;gap:1rem;flex-wrap:wrap}.translation-file-types span{display:inline-flex;gap:.35rem;align-items:center;color:var(--muted-foreground);font-size:.85rem}.translation-input textarea{width:100%;min-height:12rem;resize:vertical;padding:.9rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);color:inherit;font:inherit}.translation-workspace{display:grid;grid-template-columns:minmax(0,2fr) minmax(18rem,1fr);gap:1rem;align-items:start}.translation-text p{white-space:pre-wrap;line-height:2;margin:0}.translation-word{border:0;background:transparent;color:inherit;font:inherit;padding:0;text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--primary) 45%,transparent);text-underline-offset:.15em;cursor:pointer}.translation-word:hover,.translation-word.is-selected{color:var(--primary)}.translation-definition{position:sticky;top:6rem;display:grid;gap:.9rem}.translation-definition-header{display:grid;gap:.18rem}.translation-definition-header h2{margin:0;font-family:var(--font-serif);font-size:1.8rem}.translation-headword{margin:0;font-family:var(--font-serif);font-size:1.12rem;color:var(--muted-foreground)}.translation-result-section{display:grid;gap:.4rem;padding-top:.85rem;border-top:1px solid var(--border)}.translation-section-label{font-size:.72rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-foreground)}.translation-definition-copy{font-size:1.06rem;line-height:1.55;margin:0}.translation-form-list{display:grid;gap:.35rem;margin:.1rem 0 0;padding:0;list-style:none}.translation-form-list li{padding:.42rem .55rem;border-radius:calc(var(--radius) - 3px);background:color-mix(in srgb,var(--panel) 82%,var(--foreground) 4%);font-size:.94rem;line-height:1.35}.translation-source-line{display:flex;align-items:center;gap:.35rem;margin:.15rem 0 0;font-size:.82rem}.translation-source-line svg{width:.8rem;height:.8rem}.translation-source-line a{color:inherit}.translation-alternatives{padding-top:.65rem;border-top:1px solid var(--border)}.translation-alternatives summary{cursor:pointer;font-weight:700}.translation-alternative{display:grid;gap:.35rem;padding:.8rem 0;border-top:1px solid var(--border)}.translation-alternative:first-of-type{margin-top:.65rem}.translation-alternative strong{font-family:var(--font-serif);font-size:1.02rem}.translation-alternative p{margin:0;line-height:1.45}.translation-prepare-button{min-height:44px}.translation-helper-heading h1{margin:.1rem 0 .45rem;font-family:var(--font-serif);font-size:clamp(2rem,4vw,3.2rem);font-weight:600;letter-spacing:-.03em}.translation-source-policy h2{margin:.1rem 0 .5rem;font-family:var(--font-serif)}.translation-notice.is-error,.translation-lookup-status.is-error{color:#b42318}.translation-upload input:disabled{opacity:.55}.translation-lookup-status{color:var(--muted-foreground);font-size:.94rem}.translation-source-policy a{color:inherit;font-weight:700}@media(max-width:850px){.translation-workspace{grid-template-columns:1fr}.translation-definition{position:static}.translation-upload{align-items:flex-start;flex-direction:column}}`;

type LatinLookupState = "idle" | "loading" | "ready" | "error";

function isWord(part: string) {
  return /^[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*$/u.test(part);
}

function latinWordsUrl(word: string) {
  return `https://latin-words.com/word/latin/${encodeURIComponent(word)}`;
}

function MorphologyList({ forms }: { forms?: string[] }) {
  if (!forms?.length) return null;
  return <section className="translation-result-section">
    <span className="translation-section-label">{forms.length > 1 ? "Possible forms" : "Form"}</span>
    <ul className="translation-form-list">{forms.map((form) => <li key={form}>{form}</li>)}</ul>
  </section>;
}

export function TranslationHelperPage() {
  const [language, setLanguage] = useState<TranslationHelperLanguage>("latin");
  const [draft, setDraft] = useState("");
  const [preparedText, setPreparedText] = useState("");
  const [dictionary, setDictionary] = useState<Map<string, DictionaryMatch[]> | null>(null);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [latinMatches, setLatinMatches] = useState<DictionaryMatch[]>([]);
  const [latinLookupState, setLatinLookupState] = useState<LatinLookupState>("idle");
  const [latinLookupError, setLatinLookupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDictionary(null);
    setDictionaryError(null);
    loadTranslationDictionary(language)
      .then((index) => { if (!cancelled) setDictionary(index); })
      .catch((error) => { if (!cancelled) setDictionaryError(error instanceof Error ? error.message : "The dictionary sources could not be loaded."); });
    return () => { cancelled = true; };
  }, [language]);

  const parts = useMemo(() => tokenizeTranslationText(preparedText), [preparedText]);
  const greekMatches = selectedWord && dictionary && language === "greek" ? lookupDictionaryWord(dictionary, selectedWord) : [];
  const displayedMatches = language === "latin" ? latinMatches : greekMatches;
  const primaryMatch = displayedMatches[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    setLatinMatches([]);
    setLatinLookupError(null);
    setLatinLookupState("idle");

    if (!selectedWord || language !== "latin") return;

    setLatinLookupState("loading");
    lookupLatinWords(selectedWord)
      .then((matches) => {
        if (cancelled) return;
        setLatinMatches(matches);
        setLatinLookupState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setLatinLookupError(error instanceof Error ? error.message : "Whitaker's Words Online could not be reached.");
        setLatinLookupState("error");
      });

    return () => { cancelled = true; };
  }, [selectedWord, language]);

  function resetLookup() {
    setSelectedWord(null);
    setLatinMatches([]);
    setLatinLookupState("idle");
    setLatinLookupError(null);
  }

  function changeLanguage(next: TranslationHelperLanguage) {
    setLanguage(next);
    resetLookup();
  }

  function chooseWord(word: string) {
    setSelectedWord(word);
    setLatinMatches([]);
    setLatinLookupState("idle");
    setLatinLookupError(null);
  }

  function prepare() {
    setPreparedText(draft.trim());
    resetLookup();
  }

  async function onFile(file: File | null) {
    resetLookup();
    setPreparedText("");
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      setFileNotice(null);
      setIsExtracting(false);
      return;
    }

    setSelectedFile(file.name);
    setFileNotice(`Extracting text from ${file.name}…`);
    setIsExtracting(true);
    try {
      const text = await extractTranslationFile(file);
      setDraft(text.replace(/\r\n?/g, "\n"));
      setFileNotice("Text extracted locally in your browser. Review or correct it below, then create the clickable text.");
    } catch (error) {
      setFileNotice(null);
      setFileError(error instanceof Error ? error.message : "The file could not be read. Please try another file or paste the text directly.");
    } finally {
      setIsExtracting(false);
    }
  }

  return <main className="page-shell translation-helper-page">
    <style>{translationHelperCss}</style>
    <section className="translation-helper-heading">
      <p className="eyebrow">Reading tool</p>
      <h1>Translation Helper</h1>
      <p>Paste Greek or Latin text, or upload TXT/MD, DOCX, or a text-based PDF. Review the extracted text, then click individual words for dictionary and form information. The helper does not generate a sentence translation or contextual paraphrase.</p>
    </section>

    <section className="translation-input panel-surface" aria-busy={isExtracting}>
      <div className="translation-language" aria-label="Language">
        <button type="button" className={language === "latin" ? "is-active" : ""} aria-pressed={language === "latin"} onClick={() => changeLanguage("latin")}>Latin</button>
        <button type="button" className={language === "greek" ? "is-active" : ""} aria-pressed={language === "greek"} onClick={() => changeLanguage("greek")}>Greek</button>
      </div>

      <label className="translation-upload">
        <span><Upload aria-hidden="true" /> Upload a file</span>
        <input type="file" accept=".txt,.text,.md,.doc,.docx,.pdf,image/*" disabled={isExtracting} onChange={(event) => void onFile(event.target.files?.[0] ?? null)} />
      </label>
      <div className="translation-file-types" aria-label="Translation Helper inputs">
        <span><FileText aria-hidden="true" /> TXT/MD · DOCX · text-based PDF</span>
        <span><Image aria-hidden="true" /> Image/scanned-PDF OCR later</span>
      </div>
      {selectedFile && <p className="translation-file-name"><strong>{selectedFile}</strong></p>}
      {fileNotice && <p className="translation-notice" role="status">{fileNotice}</p>}
      {fileError && <p className="translation-notice is-error" role="alert">{fileError}</p>}

      <label className="translation-textarea-label" htmlFor="translation-source-text"><strong>Review source text</strong></label>
      <textarea id="translation-source-text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={language === "latin" ? "Paste Latin text here…" : "Paste Greek text here…"} rows={10} />
      <button type="button" className="primary-button translation-prepare-button" onClick={prepare} disabled={isExtracting || !draft.trim()}>{isExtracting ? "Extracting text…" : "Create clickable text"}</button>
    </section>

    <section className="translation-source-policy panel-surface">
      <h2>Source</h2>
      {language === "greek"
        ? <p>Greek definitions remain limited to Groton's <em>From Alpha to Omega</em> and Kubo's New Testament vocabulary already loaded into the site.</p>
        : <p>Latin definitions and grammatical analyses on this page come only from <a href="https://latin-words.com/" target="_blank" rel="noreferrer">Whitaker's Words Online</a>. Other Latin dictionaries and the site's flashcard vocabulary are not used by the Translation Helper.</p>}
    </section>

    {dictionaryError && <div className="inline-alert">{dictionaryError}</div>}

    {preparedText && <section className="translation-workspace">
      <article className="translation-text panel-surface" aria-label={`${language} clickable text`}>
        <p>{parts.map((part, index) => isWord(part)
          ? <button type="button" key={`${part}-${index}`} className={`translation-word ${selectedWord === part ? "is-selected" : ""}`} onClick={() => chooseWord(part)}>{part}</button>
          : <span key={`${index}-${part}`}>{part}</span>)}</p>
      </article>

      <aside className="translation-definition panel-surface" aria-live="polite">
        {!selectedWord && <p className="translation-empty">Click a word to see its dictionary entry{language === "latin" ? " and grammatical form" : ""}.</p>}

        {selectedWord && language === "latin" && latinLookupState === "loading" && <>
          <div className="translation-definition-header"><p className="eyebrow">Whitaker's Words Online</p><h2>{selectedWord}</h2></div>
          <p className="translation-lookup-status">Looking up this form…</p>
        </>}

        {selectedWord && language === "latin" && latinLookupState === "error" && <>
          <div className="translation-definition-header"><p className="eyebrow">Lookup unavailable</p><h2>{selectedWord}</h2></div>
          <p className="translation-lookup-status is-error">{latinLookupError || "Whitaker's Words Online could not be reached."}</p>
          <p className="translation-source-line"><ExternalLink aria-hidden="true" /><a href={latinWordsUrl(selectedWord)} target="_blank" rel="noreferrer">Open this word at latin-words.com</a></p>
        </>}

        {selectedWord && language === "latin" && latinLookupState === "ready" && !primaryMatch && <>
          <div className="translation-definition-header"><p className="eyebrow">No match</p><h2>{selectedWord}</h2></div>
          <p>No Whitaker's Words Online entry matched this form.</p>
          <p className="translation-source-line"><ExternalLink aria-hidden="true" /><a href={latinWordsUrl(selectedWord)} target="_blank" rel="noreferrer">Check the source directly</a></p>
        </>}

        {selectedWord && primaryMatch && <>
          <div className="translation-definition-header">
            <p className="eyebrow">{language === "latin" ? "Whitaker's Words Online" : "Dictionary entry"}</p>
            <h2>{selectedWord}</h2>
            <p className="translation-headword">{primaryMatch.headword}</p>
          </div>
          <section className="translation-result-section">
            <span className="translation-section-label">Meaning</span>
            <p className="translation-definition-copy">{primaryMatch.definition}</p>
          </section>
          <MorphologyList forms={primaryMatch.morphology} />
          <p className="translation-source-line">{language === "latin" && <ExternalLink aria-hidden="true" />}{language === "latin"
            ? <a href={latinWordsUrl(selectedWord)} target="_blank" rel="noreferrer">latin-words.com</a>
            : (primaryMatch.sourceRef || primaryMatch.source)}</p>
          {displayedMatches.length > 1 && <details className="translation-alternatives">
            <summary>{language === "latin" ? `Other possible analyses (${displayedMatches.length - 1})` : `Other source entries (${displayedMatches.length - 1})`}</summary>
            {displayedMatches.slice(1).map((match) => <div className="translation-alternative" key={`${match.source}-${match.headword}-${match.definition}`}>
              <strong>{match.headword}</strong>
              <p>{match.definition}</p>
              <MorphologyList forms={match.morphology} />
            </div>)}
          </details>}
        </>}

        {selectedWord && language === "greek" && dictionary && !primaryMatch && <>
          <div className="translation-definition-header"><p className="eyebrow">No source match yet</p><h2>{selectedWord}</h2></div>
          <p>No definition from the currently connected Groton/Kubo sources matches this form yet.</p>
        </>}
      </aside>
    </section>}
  </main>;
}
