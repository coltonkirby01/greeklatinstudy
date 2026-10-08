export type TranslationFileKind = "text" | "docx" | "pdf" | "image" | "legacy-doc" | "unsupported";

type MammothBrowser = {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages?: unknown[] }>;
};

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: PdfTextItem[] }>;
  }>;
};

type PdfJsBrowser = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(input: { data: Uint8Array }): { promise: Promise<PdfDocumentProxy> };
};

const MAMMOTH_SCRIPT = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
const PDFJS_SCRIPT = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const scriptPromises = new Map<string, Promise<void>>();

function extension(name: string) {
  return name.toLocaleLowerCase().split(".").at(-1) ?? "";
}

export function translationFileKind(fileName: string, mimeType = ""): TranslationFileKind {
  const suffix = extension(fileName);
  if (["txt", "text", "md"].includes(suffix) || mimeType.startsWith("text/")) return "text";
  if (suffix === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (suffix === "pdf" || mimeType === "application/pdf") return "pdf";
  if (suffix === "doc" || mimeType === "application/msword") return "legacy-doc";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff", "bmp", "heic", "heif"].includes(suffix)) return "image";
  return "unsupported";
}

function loadScript(src: string) {
  const existing = scriptPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const loaded = [...document.scripts].find((script) => script.src === src);
    if (loaded?.dataset.translationExtractorLoaded === "true") {
      resolve();
      return;
    }

    const script = loaded ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => {
      script.dataset.translationExtractorLoaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Could not load the file-extraction library from ${src}.`)), { once: true });
    if (!loaded) document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

function browserLibraries() {
  return window as typeof window & {
    mammoth?: MammothBrowser;
    pdfjsLib?: PdfJsBrowser;
  };
}

async function extractDocx(file: File) {
  await loadScript(MAMMOTH_SCRIPT);
  const mammoth = browserLibraries().mammoth;
  if (!mammoth) throw new Error("The DOCX extraction library loaded incorrectly. Please reload the page and try again.");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text) throw new Error("No readable text was found in this DOCX file.");
  return text;
}

function needsSpaceBefore(next: string, output: string) {
  if (!output || /\s$/.test(output)) return false;
  if (/^[,.;:!?…%)\]}»”’]/u.test(next)) return false;
  if (/[([{«“‘]$/u.test(output)) return false;
  return true;
}

export function pdfTextItemsToString(items: PdfTextItem[]) {
  let output = "";
  for (const item of items) {
    const text = typeof item.str === "string" ? item.str : "";
    if (!text) {
      if (item.hasEOL && output && !output.endsWith("\n")) output += "\n";
      continue;
    }
    if (needsSpaceBefore(text, output)) output += " ";
    output += text;
    if (item.hasEOL && !output.endsWith("\n")) output += "\n";
  }
  return output.trim();
}

async function extractPdf(file: File) {
  await loadScript(PDFJS_SCRIPT);
  const pdfjs = browserLibraries().pdfjsLib;
  if (!pdfjs) throw new Error("The PDF extraction library loaded incorrectly. Please reload the page and try again.");
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = pdfTextItemsToString(content.items);
    if (pageText) pages.push(pageText);
  }
  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error("No embedded text was found in this PDF. It may be a scanned/image-only PDF; image OCR is not connected yet.");
  }
  return text;
}

export async function extractTranslationFile(file: File) {
  const kind = translationFileKind(file.name, file.type);
  if (kind === "text") return file.text();
  if (kind === "docx") return extractDocx(file);
  if (kind === "pdf") return extractPdf(file);
  if (kind === "legacy-doc") throw new Error("Older .doc files are not supported yet. Save the document as .docx or PDF and upload that version.");
  if (kind === "image") throw new Error("Image OCR is not connected yet. PDF files with embedded text and DOCX files now extract automatically.");
  throw new Error("This file type is not supported. Use TXT, MD, DOCX, or a text-based PDF.");
}
