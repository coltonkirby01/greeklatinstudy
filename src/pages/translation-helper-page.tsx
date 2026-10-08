import { BookOpen, Cloud, CloudOff, ExternalLink, FileText, Image, Pencil, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import {
  deleteCloudTranslationText,
  listCloudTranslationTexts,
  saveCloudTranslationText,
  type CloudTranslationText,
} from "../features/translation/cloud-texts";
import {
  loadTranslationDictionary,
  lookupDictionaryWord,
  tokenizeTranslationText,
  type DictionaryMatch,
  type TranslationHelperLanguage,
} from "../features/translation/dictionary-sources";
import { extractTranslationFile } from "../features/translation/file-extraction";
import { lookupLatinWords } from "../features/translation/latin-words-lookup";

const translationHelperCss = `.translation-helper-page{display:grid;gap:.9rem}.translation-helper-heading{display:grid;gap:.22rem}.translation-helper-heading h1{margin:.05rem 0 .2rem;font-family:var(--font-serif);font-size:clamp(2rem,4vw,3rem);font-weight:600;letter-spacing:-.03em}.translation-helper-heading>p:last-child{max-width:58rem;margin:0;color:var(--muted-foreground);line-height:1.55}.translation-source-editor{overflow:hidden}.translation-source-editor>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.78rem 1rem}.translation-source-editor>summary::-webkit-details-marker{display:none}.translation-source-summary-main{display:flex;align-items:center;gap:.65rem;min-width:0}.translation-source-summary-main svg{width:1rem;height:1rem;flex:0 0 auto}.translation-source-summary-main strong{font-size:.95rem}.translation-source-summary-status{color:var(--muted-foreground);font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.translation-source-summary-action{color:var(--muted-foreground);font-size:.8rem;font-weight:700}.translation-source-editor[open]>summary{border-bottom:1px solid var(--border)}.translation-input{display:grid;gap:.72rem;padding:.9rem 1rem 1rem}.translation-input-top{display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap}.translation-language{display:flex;gap:.35rem}.translation-language button{border:1px solid var(--border);border-radius:999px;padding:.42rem .78rem;background:var(--panel);color:inherit;font:inherit;font-size:.9rem;font-weight:750}.translation-language button.is-active{background:var(--primary);color:var(--primary-foreground);border-color:var(--primary)}.translation-upload{display:flex;gap:.55rem;align-items:center;border:1px dashed var(--border);border-radius:999px;padding:.42rem .7rem;font-size:.86rem}.translation-upload span{display:inline-flex;gap:.38rem;align-items:center;font-weight:700}.translation-upload svg,.translation-file-types svg{width:.95rem;height:.95rem}.translation-upload input{max-width:15rem;font-size:.78rem}.translation-upload input:disabled{opacity:.55}.translation-file-types{display:flex;gap:.85rem;flex-wrap:wrap}.translation-file-types span{display:inline-flex;gap:.3rem;align-items:center;color:var(--muted-foreground);font-size:.78rem}.translation-file-name,.translation-notice{margin:0;font-size:.86rem}.translation-notice{color:var(--muted-foreground)}.translation-notice.is-error,.translation-lookup-status.is-error,.translation-cloud-status.is-error{color:#b42318}.translation-title-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.7rem;align-items:end}.translation-title-field{display:grid;gap:.3rem}.translation-title-field label,.translation-textarea-label{font-size:.82rem;font-weight:750}.translation-title-field input,.translation-input textarea{width:100%;padding:.72rem .8rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);color:inherit;font:inherit}.translation-input textarea{min-height:8rem;resize:vertical;line-height:1.5}.translation-prepare-row{display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap}.translation-prepare-note{margin:0;color:var(--muted-foreground);font-size:.78rem}.translation-prepare-button{min-height:40px}.translation-cloud-strip{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.65rem .75rem;border:1px solid var(--border);border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 4%,var(--panel))}.translation-cloud-copy{display:flex;align-items:center;gap:.5rem;min-width:0}.translation-cloud-copy svg{width:1rem;height:1rem;color:var(--primary);flex:0 0 auto}.translation-cloud-copy span{font-size:.8rem;color:var(--muted-foreground)}.translation-cloud-copy strong{display:block;color:var(--foreground);font-size:.84rem}.translation-cloud-copy a{color:var(--primary);font-weight:750}.translation-cloud-status{font-size:.78rem;color:var(--muted-foreground);white-space:nowrap}.translation-cloud-library{border-top:1px solid var(--border);padding-top:.65rem}.translation-cloud-library>summary{cursor:pointer;font-size:.84rem;font-weight:750}.translation-cloud-list{display:grid;gap:.35rem;margin-top:.55rem}.translation-cloud-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem;align-items:center;padding:.5rem .55rem;border:1px solid var(--border);border-radius:calc(var(--radius) - 2px)}.translation-cloud-open{border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;padding:0;font:inherit;min-width:0}.translation-cloud-open strong,.translation-cloud-open span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.translation-cloud-open strong{font-size:.84rem}.translation-cloud-open span{font-size:.74rem;color:var(--muted-foreground);margin-top:.12rem}.translation-cloud-delete{border:0;background:transparent;color:var(--muted-foreground);padding:.28rem;cursor:pointer;border-radius:.35rem}.translation-cloud-delete:hover{color:#b42318;background:color-mix(in srgb,#b42318 7%,transparent)}.translation-cloud-delete svg{width:.9rem;height:.9rem}.translation-reader-shell{display:grid;gap:.7rem}.translation-reader-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0 .15rem}.translation-reader-title{display:flex;align-items:center;gap:.55rem;min-width:0}.translation-reader-title svg{width:1rem;height:1rem;color:var(--primary)}.translation-reader-title strong{font-family:var(--font-serif);font-size:1.05rem}.translation-reader-meta{color:var(--muted-foreground);font-size:.8rem}.translation-reader-actions{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}.translation-reader-cloud{display:inline-flex;align-items:center;gap:.3rem;color:var(--muted-foreground);font-size:.76rem}.translation-reader-cloud.is-saved{color:var(--primary)}.translation-reader-cloud svg{width:.8rem;height:.8rem}.translation-reader-actions button{display:inline-flex;align-items:center;gap:.35rem;border:1px solid var(--border);border-radius:999px;background:var(--panel);color:inherit;padding:.38rem .65rem;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.translation-reader-actions svg{width:.85rem;height:.85rem}.translation-workspace{display:grid;grid-template-columns:minmax(0,1.85fr) minmax(19rem,.8fr);gap:1rem;align-items:start}.translation-text{padding:1.45rem 1.55rem;min-height:56vh}.translation-text p{white-space:pre-wrap;line-height:2.08;margin:0;font-family:var(--font-serif);font-size:clamp(1.08rem,1.4vw,1.24rem)}.translation-word{border:0;background:transparent;color:inherit;font:inherit;padding:.03em .035em;border-radius:.22em;text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--primary) 42%,transparent);text-decoration-thickness:1px;text-underline-offset:.16em;cursor:pointer;transition:background-color .12s ease,color .12s ease}.translation-word:hover{color:var(--primary);background:color-mix(in srgb,var(--primary) 7%,transparent)}.translation-word.is-selected{color:var(--primary);background:color-mix(in srgb,var(--primary) 13%,transparent);text-decoration-color:var(--primary)}.translation-definition{position:sticky;top:5.5rem;display:grid;gap:.85rem;padding:1.05rem 1.1rem;border:1px solid color-mix(in srgb,var(--primary) 20%,var(--border));box-shadow:0 12px 32px color-mix(in srgb,var(--foreground) 6%,transparent)}.translation-lookup-brand{display:flex;align-items:flex-start;justify-content:space-between;gap:.8rem;padding-bottom:.78rem;border-bottom:1px solid var(--border)}.translation-lookup-brand-copy{display:grid;gap:.08rem}.translation-lookup-brand-copy span{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted-foreground)}.translation-lookup-brand-copy strong{font-family:var(--font-serif);font-size:1.08rem}.translation-source-link{display:inline-flex;align-items:center;gap:.3rem;color:var(--muted-foreground);font-size:.76rem;font-weight:700;text-decoration:none}.translation-source-link:hover{color:var(--primary)}.translation-source-link svg{width:.78rem;height:.78rem}.translation-empty{display:grid;gap:.45rem;padding:.35rem 0;color:var(--muted-foreground)}.translation-empty strong{color:var(--foreground);font-family:var(--font-serif);font-size:1.08rem}.translation-definition-header{display:grid;gap:.14rem}.translation-definition-header .eyebrow{margin:0}.translation-definition-header h2{margin:0;font-family:var(--font-serif);font-size:2rem;line-height:1.1}.translation-headword{margin:.08rem 0 0;font-family:var(--font-serif);font-size:1.12rem;color:var(--muted-foreground);line-height:1.4}.translation-result-section{display:grid;gap:.42rem;padding-top:.78rem;border-top:1px solid var(--border)}.translation-section-label{font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-foreground)}.translation-definition-copy{font-size:1.05rem;line-height:1.55;margin:0}.translation-form-list{display:grid;gap:.35rem;margin:.05rem 0 0;padding:0;list-style:none}.translation-form-list li{padding:.48rem .58rem;border-radius:calc(var(--radius) - 3px);background:color-mix(in srgb,var(--primary) 6%,var(--panel));font-size:.92rem;line-height:1.4}.translation-lookup-status{margin:0;color:var(--muted-foreground);font-size:.92rem}.translation-source-line{display:flex;align-items:center;gap:.35rem;margin:.1rem 0 0;color:var(--muted-foreground);font-size:.78rem}.translation-source-line svg{width:.78rem;height:.78rem}.translation-source-line a{color:inherit}.translation-alternatives{padding-top:.65rem;border-top:1px solid var(--border)}.translation-alternatives summary{cursor:pointer;font-size:.88rem;font-weight:750}.translation-alternative{display:grid;gap:.35rem;padding:.78rem 0;border-top:1px solid var(--border)}.translation-alternative:first-of-type{margin-top:.6rem}.translation-alternative strong{font-family:var(--font-serif);font-size:1rem}.translation-alternative p{margin:0;line-height:1.45;font-size:.92rem}.translation-greek-source-note{margin:0;color:var(--muted-foreground);font-size:.76rem;line-height:1.4}.inline-alert{margin:0}@media(max-width:900px){.translation-workspace{grid-template-columns:1fr}.translation-definition{position:static}.translation-text{min-height:0}.translation-reader-toolbar{align-items:flex-start;flex-direction:column}.translation-input-top{align-items:flex-start;flex-direction:column}.translation-upload{border-radius:var(--radius);align-items:flex-start;flex-direction:column}.translation-upload input{max-width:100%}.translation-title-row{grid-template-columns:1fr}.translation-cloud-strip{align-items:flex-start;flex-direction:column}}`;

type LatinLookupState = "idle" | "loading" | "ready" | "error";
type CloudSaveState = "idle" | "saving" | "saved" | "error";

function isWord(part: string) {
  return /^[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*$/u.test(part);
}

function latinWordsUrl(word: string) {
  return `https://latin-words.com/word/latin/${encodeURIComponent(word)}`;
}

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/u, "").replace(/[_-]+/g, " ").trim() || "Untitled reading";
}

function titleFromText(text: string, language: TranslationHelperLanguage) {
  const firstLine = text.split(/\r?\n/u).map((line) => line.trim()).find(Boolean) ?? "";
  if (!firstLine) return language === "latin" ? "Latin reading" : "Greek reading";
  return firstLine.length > 54 ? `${firstLine.slice(0, 51).trimEnd()}…` : firstLine;
}

function MorphologyList({ forms }: { forms?: string[] }) {
  if (!forms?.length) return null;
  return <section className="translation-result-section">
    <span className="translation-section-label">{forms.length > 1 ? "Possible forms" : "Form"}</span>
    <ul className="translation-form-list">{forms.map((form) => <li key={form}>{form}</li>)}</ul>
  </section>;
}

export function TranslationHelperPage() {
  const { user, configured: cloudConfigured, loading: authLoading } = useAuth();
  const [language, setLanguage] = useState<TranslationHelperLanguage>("latin");
  const [title, setTitle] = useState("");
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
  const [cloudTexts, setCloudTexts] = useState<CloudTranslationText[]>([]);
  const [cloudTextId, setCloudTextId] = useState<string | null>(null);
  const [cloudSaveState, setCloudSaveState] = useState<CloudSaveState>("idle");
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);

  const refreshCloudTexts = useCallback(async () => {
    if (!user) {
      setCloudTexts([]);
      return;
    }
    setCloudLoading(true);
    try {
      setCloudTexts(await listCloudTranslationTexts(user));
      setCloudError(null);
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Saved texts could not be loaded.");
    } finally {
      setCloudLoading(false);
    }
  }, [user]);

  useEffect(() => { void refreshCloudTexts(); }, [refreshCloudTexts]);

  useEffect(() => {
    if (!user) {
      setCloudTextId(null);
      setCloudSaveState("idle");
    }
  }, [user]);

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
    setCloudSaveState("idle");
    resetLookup();
  }

  function chooseWord(word: string) {
    setSelectedWord(word);
    setLatinMatches([]);
    setLatinLookupState("idle");
    setLatinLookupError(null);
  }

  async function persistText(content: string, options?: { forceNew?: boolean; sourceFilename?: string | null; preferredTitle?: string }) {
    if (!user) return null;
    const nextTitle = (options?.preferredTitle ?? title).trim() || titleFromText(content, language);
    setTitle(nextTitle);
    setCloudSaveState("saving");
    setCloudError(null);
    try {
      const saved = await saveCloudTranslationText(user, {
        id: options?.forceNew ? null : cloudTextId,
        title: nextTitle,
        language,
        content,
        sourceFilename: options?.sourceFilename === undefined ? selectedFile : options.sourceFilename,
      });
      setCloudTextId(saved.id);
      setCloudSaveState("saved");
      await refreshCloudTexts();
      return saved;
    } catch (error) {
      setCloudSaveState("error");
      setCloudError(error instanceof Error ? error.message : "The text could not be saved to your cloud account.");
      return null;
    }
  }

  async function prepare() {
    const next = draft.trim();
    if (!next) return;
    setPreparedText(next);
    setInputOpen(false);
    resetLookup();
    if (user) await persistText(next);
  }

  async function onFile(file: File | null) {
    resetLookup();
    setPreparedText("");
    setFileError(null);
    setCloudTextId(null);
    setCloudSaveState("idle");
    setCloudError(null);
    setInputOpen(true);
    if (!file) {
      setSelectedFile(null);
      setFileNotice(null);
      setIsExtracting(false);
      return;
    }

    const fileTitle = titleFromFilename(file.name);
    setSelectedFile(file.name);
    setTitle(fileTitle);
    setFileNotice(`Extracting text from ${file.name}…`);
    setIsExtracting(true);
    try {
      const text = (await extractTranslationFile(file)).replace(/\r\n?/g, "\n");
      setDraft(text);
      if (user) {
        setFileNotice("Text extracted locally. Saving it to your cloud account…");
        const saved = await persistText(text, { forceNew: true, sourceFilename: file.name, preferredTitle: fileTitle });
        setFileNotice(saved ? "Text extracted and saved to your cloud account. Review it below, then create the reading text." : "Text extracted locally. Cloud save failed; you can still use the text below.");
      } else {
        setFileNotice("Text extracted locally. Sign in if you want uploaded texts saved across devices.");
      }
    } catch (error) {
      setFileNotice(null);
      setFileError(error instanceof Error ? error.message : "The file could not be read. Please try another file or paste the text directly.");
    } finally {
      setIsExtracting(false);
    }
  }

  function openCloudText(item: CloudTranslationText) {
    setCloudTextId(item.id);
    setTitle(item.title);
    setLanguage(item.language);
    setDraft(item.content);
    setPreparedText(item.content);
    setSelectedFile(item.sourceFilename);
    setInputOpen(false);
    setCloudSaveState("saved");
    setCloudError(null);
    setFileNotice(null);
    setFileError(null);
    resetLookup();
  }

  async function removeCloudText(item: CloudTranslationText) {
    if (!user) return;
    try {
      await deleteCloudTranslationText(user, item.id);
      if (cloudTextId === item.id) {
        setCloudTextId(null);
        setCloudSaveState("idle");
      }
      await refreshCloudTexts();
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "The saved text could not be deleted.");
    }
  }

  const sourceSummary = preparedText
    ? `${language === "latin" ? "Latin" : "Greek"} · ${wordCount} clickable ${wordCount === 1 ? "word" : "words"}`
    : "Paste text or upload a document";
  const cloudStatusLabel = cloudSaveState === "saving" ? "Saving…" : cloudSaveState === "saved" ? "Saved to cloud" : cloudSaveState === "error" ? "Cloud save failed" : "";

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

        {!authLoading && <div className="translation-cloud-strip">
          <div className="translation-cloud-copy">
            {user ? <Cloud aria-hidden="true" /> : <CloudOff aria-hidden="true" />}
            <span>{user
              ? <><strong>Cloud texts</strong>Uploaded texts save automatically to this account and can be reopened on another device.</>
              : <><strong>Cloud saving is off</strong>{cloudConfigured ? <><Link to="/account">Sign in</Link> to save uploaded texts across devices.</> : "Cloud accounts are not configured."}</>}</span>
          </div>
          {cloudStatusLabel && <span className={`translation-cloud-status ${cloudSaveState === "error" ? "is-error" : ""}`}>{cloudStatusLabel}</span>}
        </div>}

        {user && <details className="translation-cloud-library">
          <summary>{cloudLoading ? "Loading saved texts…" : `Saved texts (${cloudTexts.length})`}</summary>
          <div className="translation-cloud-list">
            {!cloudLoading && cloudTexts.length === 0 && <p className="translation-prepare-note">No cloud texts yet. Upload a document or create a reading text to save one.</p>}
            {cloudTexts.map((item) => <div className="translation-cloud-item" key={item.id}>
              <button type="button" className="translation-cloud-open" onClick={() => openCloudText(item)}>
                <strong>{item.title}</strong>
                <span>{item.language === "latin" ? "Latin" : "Greek"}{item.sourceFilename ? ` · ${item.sourceFilename}` : ""} · {new Date(item.updatedAt).toLocaleDateString()}</span>
              </button>
              <button type="button" className="translation-cloud-delete" aria-label={`Delete ${item.title}`} title="Delete saved text" onClick={() => void removeCloudText(item)}><Trash2 aria-hidden="true" /></button>
            </div>)}
          </div>
        </details>}
        {cloudError && <p className="translation-notice is-error" role="alert">{cloudError}</p>}
        {selectedFile && <p className="translation-file-name"><strong>{selectedFile}</strong></p>}
        {fileNotice && <p className="translation-notice" role="status">{fileNotice}</p>}
        {fileError && <p className="translation-notice is-error" role="alert">{fileError}</p>}

        <div className="translation-title-row">
          <div className="translation-title-field">
            <label htmlFor="translation-title">Text title</label>
            <input id="translation-title" value={title} onChange={(event) => { setTitle(event.target.value); setCloudSaveState("idle"); }} placeholder={language === "latin" ? "Latin reading" : "Greek reading"} />
          </div>
        </div>
        <label className="translation-textarea-label" htmlFor="translation-source-text">Review source text</label>
        <textarea id="translation-source-text" value={draft} onChange={(event) => { setDraft(event.target.value); setCloudSaveState("idle"); }} placeholder={language === "latin" ? "Paste Latin text here…" : "Paste Greek text here…"} rows={7} />
        <div className="translation-prepare-row">
          <p className="translation-prepare-note">The editor collapses after the reading text is created. Signed-in texts are saved to the account when created or updated.</p>
          <button type="button" className="primary-button translation-prepare-button" onClick={() => void prepare()} disabled={isExtracting || !draft.trim()}>{isExtracting ? "Extracting text…" : preparedText ? "Update reading text" : "Create reading text"}</button>
        </div>
      </div>
    </details>

    {dictionaryError && <div className="inline-alert">{dictionaryError}</div>}

    {preparedText && <section className="translation-reader-shell">
      <div className="translation-reader-toolbar">
        <div className="translation-reader-title">
          <BookOpen aria-hidden="true" />
          <span><strong>{title.trim() || "Reading text"}</strong><br /><span className="translation-reader-meta">{language === "latin" ? "Click a word for Whitaker's definition and form" : "Click a word for the Groton/Kubo entry"}</span></span>
        </div>
        <div className="translation-reader-actions">
          {user && <span className={`translation-reader-cloud ${cloudSaveState === "saved" ? "is-saved" : ""}`}><Cloud aria-hidden="true" />{cloudStatusLabel || (cloudTextId ? "Cloud copy" : "Not saved yet")}</span>}
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
