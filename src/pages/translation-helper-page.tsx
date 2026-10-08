import { BookOpen, ExternalLink, FileText, Image, Pencil, Upload } from "lucide-react";
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

const translationHelperCss = `.translation-helper-page{display:grid;gap:.9rem}.translation-helper-heading{display:grid;gap:.22rem}.translation-helper-heading h1{margin:.05rem 0 .2rem;font-family:var(--font-serif);font-size:clamp(2rem,4vw,3rem);font-weight:600;letter-spacing:-.03em}.translation-helper-heading>p:last-child{max-width:58rem;margin:0;color:var(--muted-foreground);line-height:1.55}.translation-source-editor{overflow:hidden}.translation-source-editor>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.78rem 1rem}.translation-source-editor>summary::-webkit-details-marker{display:none}.translation-source-summary-main{display:flex;align-items:center;gap:.65rem;min-width:0}.translation-source-summary-main svg{width:1rem;height:1rem;flex:0 0 auto}.translation-source-summary-main strong{font-size:.95rem}.translation-source-summary-status{color:var(--muted-foreground);font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.translation-source-summary-action{color:var(--muted-foreground);font-size:.8rem;font-weight:700}.translation-source-editor[open]>summary{border-bottom:1px solid var(--border)}.translation-input{display:grid;gap:.72rem;padding:.9rem 1rem 1rem}.translation-input-top{display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap}.translation-language{display:flex;gap:.35rem}.translation-language button{border:1px solid var(--border);border-radius:999px;padding:.42rem .78rem;background:var(--panel);color:inherit;font:inherit;font-size:.9rem;font-weight:750}.translation-language button.is-active{background:var(--primary);color:var(--primary-foreground);border-color:var(--primary)}.translation-upload{display:flex;gap:.55rem;align-items:center;border:1px dashed var(--border);border-radius:999px;padding:.42rem .7rem;font-size:.86rem}.translation-upload span{display:inline-flex;gap:.38rem;align-items:center;font-weight:700}.translation-upload svg,.translation-file-types svg{width:.95rem;height:.95rem}.translation-upload input{max-width:15rem;font-size:.78rem}.translation-upload input:disabled{opacity:.55}.translation-file-types{display:flex;gap:.85rem;flex-wrap:wrap}.translation-file-types span{display:inline-flex;gap:.3rem;align-items:center;color:var(--muted-foreground);font-size:.78rem}.translation-file-name,.translation-notice{margin:0;font-size:.86rem}.translation-notice{color:var(--muted-foreground)}.translation-notice.is-error,.translation-lookup-status.is-error{color:#b42318}.translation-textarea-label{font-size:.88rem}.translation-input textarea{width:100%;min-height:8rem;resize:vertical;padding:.8rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);color:inherit;font:inherit;line-height:1.5}.translation-prepare-row{display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap}.translation-prepare-note{margin:0;color:var(--muted-foreground);font-size:.78rem}.translation-prepare-button{min-height:40px}.translation-reader-shell{display:grid;gap:.7rem}.translation-reader-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0 .15rem}.translation-reader-title{display:flex;align-items:center;gap:.55rem;min-width:0}.translation-reader-title svg{width:1rem;height:1rem;color:var(--primary)}.translation-reader-title strong{font-family:var(--font-serif);font-size:1.05rem}.translation-reader-meta{color:var(--muted-foreground);font-size:.8rem}.translation-reader-actions{display:flex;gap:.45rem}.translation-reader-actions button{display:inline-flex;align-items:center;gap:.35rem;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:inherit;padding:.38rem .65rem;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.translation-reader-actions svg{width:.85rem;height:.85rem}.translation-workspace{display:grid;grid-template-columns:minmax(0,1.85fr) minmax(19rem,.8fr);gap:1rem;align-items:start}.translation-text{padding:1.45rem 1.55rem;min-height:56vh}.translation-text p{white-space:pre-wrap;line-height:2.08;margin:0;font-family:var(--font-serif);font-size:clamp(1.08rem,1.4vw,1.24rem)}.translation-word{border:0;background:transparent;color:inherit;font:inherit;padding:.03em .035em;border-radius:.22em;text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--primary) 42%,transparent);text-decoration-thickness:1px;text-underline-offset:.16em;cursor:pointer;transition:background-color .12s ease,color .12s ease}.translation-word:hover{color:var(--primary);background:color-mix(in srgb,var(--primary) 7%,transparent)}.translation-word.is-selected{color:var(--primary);background:color-mix(in srgb,var(--primary) 13%,transparent);text-decoration-color:var(--primary)}.translation-definition{position:sticky;top:5.5rem;display:grid;gap:.85rem;padding:1.05rem 1.1rem;border:1px solid color-mix(in srgb,var(--primary) 20%,var(--border));box-shadow:0 12px 32px color-mix(in srgb,var(--foreground) 6%,transparent)}.translation-lookup-brand{display:flex;align-items:flex-start;justify-content:space-between;gap:.8rem;padding-bottom:.78rem;border-bottom:1px solid var(--border)}.translation-lookup-brand-copy{display:grid;gap:.08rem}.translation-lookup-brand-copy span{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-foreground)}.translation-lookup-brand-copy strong{font-family:var(--font-serif);font-size:1.08rem}.translation-source-link{display:inline-flex;align-items:center;gap:.3rem;color:var(--muted-foreground);font-size:.76rem;font-weight:700;text-decoration:none}.translation-source-link:hover{color:var(--primary)}.translation-source-link svg{width:.78rem;height:.78rem}.translation-empty{display:grid;gap:.45rem;padding:.35rem 0;color:var(--muted-foreground)}.translation-empty strong{color:var(--foreground);font-family:var(--font-serif);font-size:1.08rem}.translation-definition-header{display:grid;gap:.14rem}.translation-definition-header .eyebrow{margin:0}.translation-definition-header h2{margin:0;font-family:var(--font-serif);font-size:2rem;line-height:1.1}.translation-headword{margin:.08rem 0 0;font-family:var(--font-serif);font-size:1.12rem;color:var(--muted-foreground);line-height:1.4}.translation-result-section{display:grid;gap:.42rem;padding-top:.78rem;border-top:1px solid var(--border)}.translation-section-label{font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-foreground)}.translation-definition-copy{font-size:1.05rem;line-height:1.55;margin:0}.translation-form-list{display:grid;gap:.35rem;margin:.05rem 0 0;padding:0;list-style:none}.translation-form-list li{padding:.48rem .58rem;border-radius:calc(var(--radius) - 3px);background:color-mix(in srgb,var(--primary) 6%,var(--panel));font-size:.92rem;line-height:1.4}.translation-lookup-status{margin:0;color:var(--muted-foreground);font-size:.92rem}.translation-source-line{display:flex;align-items:center;gap:.35rem;margin:.1rem 0 0;color:var(--muted-foreground);font-size:.78rem}.translation-source-line svg{width:.78rem;height:.78rem}.translation-source-line a{color:inherit}.translation-alternatives{padding-top:.65rem;border-top:1px solid var(--border)}.translation-alternatives summary{cursor:pointer;font-size:.88rem;font-weight:750}.translation-alternative{display:grid;gap:.35rem;padding:.78rem 0;border-top:1px solid var(--border)}.translation-alternative:first-of-type{margin-top:.6rem}.translation-alternative strong{font-family:var(--font-serif);font-size:1rem}.translation-alternative p{margin:0;line-height:1.45;font-size:.92rem}.translation-greek-source-note{margin:0;color:var(--muted-foreground);font-size:.76rem;line-height:1.4}.inline-alert{margin:0}@media(max-width:900px){.translation-workspace{grid-template-columns:1fr}.translation-definition{position:static}.translation-text{min-height:0}.translation-reader-toolbar{align-items:flex-start;flex-direction:column}.translation-input-top{align-items:flex-start;flex-direction:column}.translation-upload{border-radius:var(--radius);align-items:flex-start;flex-direction:column}.translation-upload input{max-width:100%}}`;

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
  const [inputOpen, setInputOpen] = useState(true);
  const [dictionary, setDictionary] = useState<Map<string, DictionaryMatch[]> | null>(new Map());
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
    setDictionaryError(null);
    if (language === "latin") {
      setDictionary(new Map());
      return () => { cancelled = true; };
    }
    setDictionary(null);
    loadTranslationDictionary(language)
      .then((index) => { if (!cancelled) setDictionary(index); })
      .catch((error) => { if (!cancelled) setDictionaryError(error instanceof Error ? error.message : "The Greek vocabulary sources could not be loaded."); });
    return () => { cancelled = true; };
  }, [language]);

  const parts = useMemo(() => tokenizeTranslationText(preparedText), [preparedText]);
  const wordCount = useMemo(() => parts.filter(isWord).length, [parts]);
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
    const next = draft.trim();
    if (!next) return;
    setPreparedText(next);
    setInputOpen(false);
    resetLookup();
  }

  async function onFile(file: File | null) {
    resetLookup();
    setPreparedText("");
    setFileError(null);
    setInputOpen(true);
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
      setFileNotice("Text extracted locally. Review it below, then create the reading text.");
    } catch (error) {
      setFileNotice(null);
      setFileError(error instanceof Error ? error.message : "The file could not be read. Please try another file or paste the text directly.");
    } finally {
      setIsExtracting(false);
    }
  }

  const sourceSummary = preparedText
    ? `${language === "latin" ? "Latin" : "Greek"} · ${wordCount} clickable ${wordCount === 1 ? "word" : "words"}`
    : "Paste text or upload a document";

  return <main className="page-shell translation-helper-page">
    <style>{translationHelperCss}</style>

    <section className="translation-helper-heading">
      <p className="eyebrow">Reading tool</p>
      <h1>Translation Helper</h1>
      <p>Read directly from your text and click any word for dictionary information. Latin uses Whitaker's Words Online for definitions and forms. This helper does not generate a sentence translation or contextual paraphrase.</p>
    </section>

    <details className="translation-source-editor panel-surface" open={inputOpen} onToggle={(event) => setInputOpen(event.currentTarget.open)}>
      <summary>
        <span className="translation-source-summary-main">
          <FileText aria-hidden="true" />
          <span><strong>Text &amp; upload</strong><br /><span className="translation-source-summary-status">{sourceSummary}</span></span>
        </span>
        <span className="translation-source-summary-action">{inputOpen ? "Collapse" : "Edit or replace"}</span>
      </summary>

      <div className="translation-input" aria-busy={isExtracting}>
        <div className="translation-input-top">
          <div className="translation-language" aria-label="Language">
            <button type="button" className={language === "latin" ? "is-active" : ""} aria-pressed={language === "latin"} onClick={() => changeLanguage("latin")}>Latin</button>
            <button type="button" className={language === "greek" ? "is-active" : ""} aria-pressed={language === "greek"} onClick={() => changeLanguage("greek")}>Greek</button>
          </div>

          <label className="translation-upload">
            <span><Upload aria-hidden="true" /> Upload</span>
            <input type="file" accept=".txt,.text,.md,.doc,.docx,.pdf,image/*" disabled={isExtracting} onChange={(event) => void onFile(event.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div className="translation-file-types" aria-label="Translation Helper inputs">
          <span><FileText aria-hidden="true" /> TXT/MD · DOCX · text-based PDF</span>
          <span><Image aria-hidden="true" /> Image/scanned-PDF OCR later</span>
        </div>
        {selectedFile && <p className="translation-file-name"><strong>{selectedFile}</strong></p>}
        {fileNotice && <p className="translation-notice" role="status">{fileNotice}</p>}
        {fileError && <p className="translation-notice is-error" role="alert">{fileError}</p>}

        <label className="translation-textarea-label" htmlFor="translation-source-text"><strong>Review source text</strong></label>
        <textarea id="translation-source-text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={language === "latin" ? "Paste Latin text here…" : "Paste Greek text here…"} rows={7} />
        <div className="translation-prepare-row">
          <p className="translation-prepare-note">The editor collapses after the reading text is created. You can reopen it at any time.</p>
          <button type="button" className="primary-button translation-prepare-button" onClick={prepare} disabled={isExtracting || !draft.trim()}>{isExtracting ? "Extracting text…" : preparedText ? "Update reading text" : "Create reading text"}</button>
        </div>
      </div>
    </details>

    {dictionaryError && <div className="inline-alert">{dictionaryError}</div>}

    {preparedText && <section className="translation-reader-shell">
      <div className="translation-reader-toolbar">
        <div className="translation-reader-title">
          <BookOpen aria-hidden="true" />
          <span><strong>Reading text</strong><br /><span className="translation-reader-meta">{language === "latin" ? "Click a word for Whitaker's definition and form" : "Click a word for the Groton/Kubo entry"}</span></span>
        </div>
        <div className="translation-reader-actions">
          <button type="button" onClick={() => setInputOpen(true)}><Pencil aria-hidden="true" /> Edit source</button>
        </div>
      </div>

      <div className="translation-workspace">
        <article className="translation-text panel-surface" aria-label={`${language} clickable text`}>
          <p>{parts.map((part, index) => isWord(part)
            ? <button type="button" key={`${part}-${index}`} className={`translation-word ${selectedWord === part ? "is-selected" : ""}`} onClick={() => chooseWord(part)}>{part}</button>
            : <span key={`${index}-${part}`}>{part}</span>)}</p>
        </article>

        <aside className="translation-definition panel-surface" aria-live="polite">
          <div className="translation-lookup-brand">
            <div className="translation-lookup-brand-copy">
              <span>{language === "latin" ? "Latin word lookup" : "Greek vocabulary lookup"}</span>
              <strong>{language === "latin" ? "Whitaker's Words Online" : "Groton + Kubo"}</strong>
            </div>
            {language === "latin" && <a className="translation-source-link" href="https://latin-words.com/" target="_blank" rel="noreferrer">Source <ExternalLink aria-hidden="true" /></a>}
          </div>

          {!selectedWord && <div className="translation-empty">
            <strong>Select a word from the reading text.</strong>
            <span>{language === "latin" ? "Its dictionary meaning and grammatical form will appear here." : "Its available source entry will appear here."}</span>
            {language === "greek" && <p className="translation-greek-source-note">Greek remains limited to Groton's <em>From Alpha to Omega</em> and Kubo's New Testament vocabulary.</p>}
          </div>}

          {selectedWord && language === "latin" && latinLookupState === "loading" && <>
            <div className="translation-definition-header"><p className="eyebrow">Looking up</p><h2>{selectedWord}</h2></div>
            <p className="translation-lookup-status">Checking Whitaker's Words Online…</p>
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
              <p className="eyebrow">{language === "latin" ? "Selected word" : "Dictionary entry"}</p>
              <h2>{selectedWord}</h2>
              <p className="translation-headword">{primaryMatch.headword}</p>
            </div>
            <section className="translation-result-section">
              <span className="translation-section-label">Meaning</span>
              <p className="translation-definition-copy">{primaryMatch.definition}</p>
            </section>
            <MorphologyList forms={primaryMatch.morphology} />
            {language === "latin" && <p className="translation-source-line"><ExternalLink aria-hidden="true" /><a href={latinWordsUrl(selectedWord)} target="_blank" rel="noreferrer">View this entry at latin-words.com</a></p>}
            {language === "greek" && <p className="translation-source-line">{primaryMatch.sourceRef || primaryMatch.source}</p>}
            {displayedMatches.length > 1 && <details className="translation-alternatives">
              <summary>{language === "latin" ? `Other possible analyses (${displayedMatches.length - 1})` : `Other source entries (${displayedMatches.length - 1})`}</summary>
              {displayedMatches.slice(1).map((match) => <div className="translation-alternative" key={`${match.source}-${match.headword}-${match.definition}`}>
                <strong>{match.headword}</strong>
                <p>{match.definition}</p>
                <MorphologyList forms={match.morphology} />
              </div>)}
            </details>}
          </>}

          {selectedWord && language === "greek" && !dictionary && !dictionaryError && <p className="translation-lookup-status">Loading Groton/Kubo vocabulary…</p>}
          {selectedWord && language === "greek" && dictionary && !primaryMatch && <>
            <div className="translation-definition-header"><p className="eyebrow">No source match yet</p><h2>{selectedWord}</h2></div>
            <p>No definition from the currently connected Groton/Kubo sources matches this form yet.</p>
          </>}
        </aside>
      </div>
    </section>}
  </main>;
}
