import { FileText, Image, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  latinFallbackUrl,
  loadTranslationDictionary,
  lookupDictionaryWord,
  tokenizeTranslationText,
  type DictionaryMatch,
  type TranslationHelperLanguage,
} from "../features/translation/dictionary-sources";
import { extractTranslationFile } from "../features/translation/file-extraction";
import { lookupWhitakersWord } from "../features/translation/latin-inline-fallback";

const translationHelperCss = `.translation-helper-page{display:grid;gap:1rem}.translation-helper-heading p,.translation-source-policy p,.translation-empty,.translation-source-line,.translation-notice{color:var(--muted-foreground)}.translation-input,.translation-text,.translation-definition,.translation-source-policy{padding:1rem}.translation-input{display:grid;gap:.8rem}.translation-language{display:flex;gap:.35rem}.translation-language button{border:1px solid var(--border);border-radius:999px;padding:.5rem .9rem;background:var(--panel);color:inherit;font:inherit;font-weight:700}.translation-language button.is-active{background:var(--primary);color:var(--primary-foreground)}.translation-upload{display:flex;gap:.75rem;align-items:center;justify-content:space-between;border:1px dashed var(--border);border-radius:var(--radius);padding:.8rem}.translation-upload span{display:inline-flex;gap:.45rem;align-items:center}.translation-upload svg,.translation-file-types svg{width:1rem;height:1rem}.translation-file-types{display:flex;gap:1rem;flex-wrap:wrap}.translation-file-types span{display:inline-flex;gap:.35rem;align-items:center;color:var(--muted-foreground);font-size:.85rem}.translation-input textarea{width:100%;min-height:12rem;resize:vertical;padding:.9rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);color:inherit;font:inherit}.translation-workspace{display:grid;grid-template-columns:2fr 1fr;gap:1rem;align-items:start}.translation-text p{white-space:pre-wrap;line-height:2;margin:0}.translation-word{border:0;background:transparent;color:inherit;font:inherit;padding:0;text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--primary) 45%,transparent);text-underline-offset:.15em;cursor:pointer}.translation-word:hover,.translation-word.is-selected{color:var(--primary)}.translation-definition{position:sticky;top:6rem}.translation-definition-copy{font-size:1.08rem}.translation-headword{font-family:var(--font-serif);font-size:1.2rem}.translation-alternatives div{display:grid;gap:.15rem;padding:.6rem 0;border-top:1px solid var(--border)}.translation-prepare-button{min-height:44px}.translation-helper-heading h1{margin:.1rem 0 .45rem;font-family:var(--font-serif);font-size:clamp(2rem,4vw,3.2rem);font-weight:600;letter-spacing:-.03em}.translation-source-policy h2,.translation-definition h2{margin:.1rem 0 .5rem;font-family:var(--font-serif)}.translation-notice.is-error{color:#b42318}.translation-upload input:disabled{opacity:.55}.translation-fallback-status{color:var(--muted-foreground);font-size:.94rem}.translation-fallback-status.is-error{color:#b42318}@media(max-width:850px){.translation-workspace{grid-template-columns:1fr}.translation-definition{position:static}.translation-upload{align-items:flex-start;flex-direction:column}}`;

type InlineLatinState = "idle" | "loading" | "ready" | "error";

function isWord(part: string) {
  return /^[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*$/u.test(part);
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
  const [inlineLatinMatches, setInlineLatinMatches] = useState<DictionaryMatch[]>([]);
  const [inlineLatinState, setInlineLatinState] = useState<InlineLatinState>("idle");
  const [inlineLatinError, setInlineLatinError] = useState<string | null>(null);

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
  const localMatches = selectedWord && dictionary ? lookupDictionaryWord(dictionary, selectedWord) : [];
  const displayedMatches = localMatches.length > 0 ? localMatches : inlineLatinMatches;
  const primaryMatch = displayedMatches[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    setInlineLatinMatches([]);
    setInlineLatinError(null);
    setInlineLatinState("idle");

    if (!selectedWord || language !== "latin" || !dictionary) return;
    if (lookupDictionaryWord(dictionary, selectedWord).length > 0) return;

    setInlineLatinState("loading");
    lookupWhitakersWord(selectedWord)
      .then((matches) => {
        if (cancelled) return;
        setInlineLatinMatches(matches);
        setInlineLatinState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setInlineLatinError(error instanceof Error ? error.message : "The Latin dictionary lookup could not be reached.");
        setInlineLatinState("error");
      });

    return () => { cancelled = true; };
  }, [selectedWord, language, dictionary]);

  function changeLanguage(next: TranslationHelperLanguage) {
    setLanguage(next);
    setSelectedWord(null);
    setInlineLatinMatches([]);
    setInlineLatinState("idle");
    setInlineLatinError(null);
  }

  function chooseWord(word: string) {
    setSelectedWord(word);
    setInlineLatinMatches([]);
    setInlineLatinState("idle");
    setInlineLatinError(null);
  }

  function prepare() {
    setPreparedText(draft.trim());
    setSelectedWord(null);
    setInlineLatinMatches([]);
    setInlineLatinState("idle");
  }

  async function onFile(file: File | null) {
    setSelectedWord(null);
    setPreparedText("");
    setFileError(null);
    setInlineLatinMatches([]);
    setInlineLatinState("idle");
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
      <p>Paste Greek or Latin text, or upload TXT/MD, DOCX, or a text-based PDF. The source text is extracted into the review box before you create the clickable reading view. The helper does not generate a sentence translation or contextual paraphrase.</p>
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
      <h2>Dictionary sources</h2>
      {language === "greek"
        ? <p>Greek definitions are limited to Groton's <em>From Alpha to Omega</em> and Kubo's New Testament vocabulary already loaded into the site.</p>
        : <p>Latin checks the site's Dickinson Latin Core Vocabulary first. If the clicked form is not a direct Dickinson headword, the helper uses a server-backed Whitaker's Words lookup so inflected forms can resolve to dictionary entries without loading a large dictionary engine into your browser or sending you to another website. Henle and Moreland &amp; Fleischer will be added ahead of these fallbacks as course-source priorities. Online Latin Dictionary remains an optional external reference.</p>}
    </section>

    {dictionaryError && <div className="inline-alert">{dictionaryError}</div>}

    {preparedText && <section className="translation-workspace">
      <article className="translation-text panel-surface" aria-label={`${language} clickable text`}>
        <p>{parts.map((part, index) => isWord(part)
          ? <button type="button" key={`${part}-${index}`} className={`translation-word ${selectedWord === part ? "is-selected" : ""}`} onClick={() => chooseWord(part)}>{part}</button>
          : <span key={`${index}-${part}`}>{part}</span>)}</p>
      </article>

      <aside className="translation-definition panel-surface" aria-live="polite">
        {!selectedWord && <p className="translation-empty">Click a word to see its dictionary definition.</p>}
        {selectedWord && !dictionary && !dictionaryError && <p>Loading dictionary sources…</p>}
        {selectedWord && dictionary && primaryMatch && <>
          <p className="eyebrow">Dictionary definition</p>
          <h2>{selectedWord}</h2>
          <p className="translation-headword">{primaryMatch.headword}</p>
          <p className="translation-definition-copy">{primaryMatch.definition}</p>
          <p className="translation-source-line">{primaryMatch.sourceRef || primaryMatch.source}</p>
          {displayedMatches.length > 1 && <details className="translation-alternatives"><summary>Other source entries ({displayedMatches.length - 1})</summary>{displayedMatches.slice(1).map((match) => <div key={`${match.source}-${match.headword}-${match.definition}`}><strong>{match.headword}</strong><span>{match.definition}</span><small>{match.sourceRef || match.source}</small></div>)}</details>}
        </>}
        {selectedWord && dictionary && !primaryMatch && language === "latin" && <>
          <p className="eyebrow">Latin dictionary lookup</p>
          <h2>{selectedWord}</h2>
          {(inlineLatinState === "idle" || inlineLatinState === "loading") && <p className="translation-fallback-status">Checking Whitaker's Words for this form…</p>}
          {inlineLatinState === "error" && <p className="translation-fallback-status is-error">{inlineLatinError || "The Latin dictionary lookup could not be reached."}</p>}
          {inlineLatinState === "ready" && <p>No Dickinson or Whitaker's Words entry matched this form.</p>}
          {(inlineLatinState === "ready" || inlineLatinState === "error") && <a className="button-link small-outline-button" href={latinFallbackUrl(selectedWord)} target="_blank" rel="noreferrer">Optional: check Online Latin Dictionary</a>}
        </>}
        {selectedWord && dictionary && !primaryMatch && language === "greek" && <>
          <p className="eyebrow">No source match yet</p>
          <h2>{selectedWord}</h2>
          <p>No definition from the currently connected Groton/Kubo sources matches this form yet.</p>
        </>}
      </aside>
    </section>}
  </main>;
}
