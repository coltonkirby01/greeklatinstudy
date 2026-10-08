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
import "./translation-helper-page.css";

const plainTextExtensions = new Set(["txt", "text", "md"]);

function extension(name: string) {
  return name.toLocaleLowerCase().split(".").at(-1) ?? "";
}

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
  const matches = selectedWord && dictionary ? lookupDictionaryWord(dictionary, selectedWord) : [];
  const primaryMatch = matches[0] ?? null;

  function prepare() {
    setPreparedText(draft.trim());
    setSelectedWord(null);
  }

  async function onFile(file: File | null) {
    setSelectedWord(null);
    setPreparedText("");
    if (!file) {
      setSelectedFile(null);
      setFileNotice(null);
      return;
    }
    setSelectedFile(file.name);
    const suffix = extension(file.name);
    if (plainTextExtensions.has(suffix) || file.type.startsWith("text/")) {
      const text = await file.text();
      setDraft(text);
      setPreparedText(text.trim());
      setFileNotice("Text extracted locally. Review it below before using the helper.");
      return;
    }
    setFileNotice("This file type is part of the Translation Helper build, but DOC/DOCX, PDF, and image extraction is not connected in this first foundation step. The file has not been uploaded anywhere. Paste its text below for now.");
  }

  return <main className="page-shell translation-helper-page">
    <section className="translation-helper-heading">
      <div>
        <p className="eyebrow">Reading tool</p>
        <h1>Translation Helper</h1>
        <p>Paste or upload Greek or Latin text, then click a word to see a source-backed dictionary definition. This tool does not generate a sentence translation or an AI explanation.</p>
      </div>
    </section>

    <section className="translation-input panel-surface">
      <div className="translation-language" aria-label="Language">
        <button type="button" className={language === "latin" ? "is-active" : ""} aria-pressed={language === "latin"} onClick={() => { setLanguage("latin"); setSelectedWord(null); }}>Latin</button>
        <button type="button" className={language === "greek" ? "is-active" : ""} aria-pressed={language === "greek"} onClick={() => { setLanguage("greek"); setSelectedWord(null); }}>Greek</button>
      </div>

      <label className="translation-upload">
        <span><Upload aria-hidden="true" /> Upload a file</span>
        <input type="file" accept=".txt,.text,.md,.doc,.docx,.pdf,image/*" onChange={(event) => void onFile(event.target.files?.[0] ?? null)} />
      </label>
      <div className="translation-file-types" aria-label="Supported input plan">
        <span><FileText aria-hidden="true" /> Text · DOC/DOCX · PDF</span>
        <span><Image aria-hidden="true" /> Image</span>
      </div>
      {selectedFile && <p className="translation-file-name"><strong>{selectedFile}</strong></p>}
      {fileNotice && <p className="translation-notice">{fileNotice}</p>}

      <label className="translation-textarea-label" htmlFor="translation-source-text">Review source text</label>
      <textarea id="translation-source-text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={language === "latin" ? "Paste Latin text here…" : "Paste Greek text here…"} rows={10} />
      <button type="button" className="primary-button translation-prepare-button" onClick={prepare} disabled={!draft.trim()}>Create clickable text</button>
    </section>

    <section className="translation-source-policy panel-surface">
      <h2>Dictionary sources</h2>
      {language === "greek"
        ? <p>Greek definitions are limited to Groton's <em>From Alpha to Omega</em> and Kubo's New Testament vocabulary currently loaded into the site.</p>
        : <p>Latin currently uses the site's Dickinson Latin Core Vocabulary as the working dictionary layer. Henle and Moreland &amp; Fleischer are being added ahead of it as course-source priorities; Olivetti's Online Latin Dictionary is the external fallback for words not yet resolved locally.</p>}
    </section>

    {dictionaryError && <div className="inline-alert">{dictionaryError}</div>}

    {preparedText && <section className="translation-workspace">
      <article className="translation-text panel-surface" aria-label={`${language} clickable text`}>
        <p>{parts.map((part, index) => isWord(part)
          ? <button type="button" key={`${part}-${index}`} className={`translation-word ${selectedWord === part ? "is-selected" : ""}`} onClick={() => setSelectedWord(part)}>{part}</button>
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
          {matches.length > 1 && <details className="translation-alternatives"><summary>Other source entries ({matches.length - 1})</summary>{matches.slice(1).map((match) => <div key={`${match.source}-${match.headword}-${match.definition}`}><strong>{match.headword}</strong><span>{match.definition}</span><small>{match.sourceRef || match.source}</small></div>)}</details>}
        </>}
        {selectedWord && dictionary && !primaryMatch && <>
          <p className="eyebrow">No local match yet</p>
          <h2>{selectedWord}</h2>
          <p>No definition from the currently connected {language === "greek" ? "Groton/Kubo" : "course/Dickinson"} sources matches this form yet.</p>
          {language === "latin" && <a className="button-link small-outline-button" href={latinFallbackUrl(selectedWord)} target="_blank" rel="noreferrer">Check Online Latin Dictionary</a>}
        </>}
      </aside>
    </section>}
  </main>;
}
