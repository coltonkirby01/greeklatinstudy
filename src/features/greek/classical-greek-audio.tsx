import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../../lib/supabase-config";

type CourseAudioAsset = {
  id: string;
  mime_type: string;
  storage_path: string | null;
};

type AudioRequest = { assetId: string; cloudCardId?: string };
const assetCache = new Map<string, Promise<CourseAudioAsset | null>>();
const generationRequests = new Map<string, Promise<boolean>>();
const storageCacheVersion = "classical-greek-audio-v2";

function cacheKey(request: AudioRequest) {
  return request.cloudCardId ? `cloud:${request.cloudCardId}` : `builtin:${request.assetId}`;
}

function persistentCacheKey(assetId: string) {
  return `${storageCacheVersion}:${assetId}`;
}

function readPersistentPath(assetId: string) {
  try { return window.localStorage.getItem(persistentCacheKey(assetId)); }
  catch { return null; }
}

function writePersistentPath(assetId: string, path: string) {
  try { window.localStorage.setItem(persistentCacheKey(assetId), path); }
  catch { /* storage may be disabled; in-memory caching still works */ }
}

export function courseAudioPublicUrl(asset: Pick<CourseAudioAsset, "storage_path">) {
  if (!supabaseUrl || !asset.storage_path) return "";
  const encodedPath = asset.storage_path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/course-audio/${encodedPath}`;
}

async function fetchCourseAudioAsset(assetId: string) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  const remembered = readPersistentPath(assetId);
  if (remembered) return { id: assetId, mime_type: "audio/mpeg", storage_path: remembered };

  const url = new URL(`${supabaseUrl}/rest/v1/course_audio_assets`);
  url.searchParams.set("id", `eq.${assetId}`);
  url.searchParams.set("select", "id,mime_type,storage_path");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { apikey: supabaseAnonKey, Accept: "application/json" } });
  if (!response.ok) return null;
  const rows = (await response.json()) as CourseAudioAsset[];
  const asset = rows[0];
  if (!asset?.storage_path) return null;
  writePersistentPath(assetId, asset.storage_path);
  return asset;
}

async function generateCourseAudio(request: AudioRequest) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return false;
  const key = cacheKey(request);
  let pending = generationRequests.get(key);
  if (!pending) {
    pending = fetch(`${supabaseUrl}/functions/v1/course-audio`, {
      method: "POST",
      headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: request.assetId, cloudCardId: request.cloudCardId }),
    }).then((response) => response.ok).catch(() => false).finally(() => generationRequests.delete(key));
    generationRequests.set(key, pending);
  }
  return pending;
}

export function loadCourseAudioAsset(request: AudioRequest) {
  const key = cacheKey(request);
  const cached = assetCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const existing = await fetchCourseAudioAsset(request.assetId);
    if (existing) return existing;
    if (!await generateCourseAudio(request)) return null;
    return fetchCourseAudioAsset(request.assetId);
  })().catch(() => null).then((asset) => {
    if (!asset) assetCache.delete(key);
    return asset;
  });

  assetCache.set(key, pending);
  return pending;
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], [role='listbox']"));
}

export function ClassicalGreekAudio({ assetId, label, cloudCardId }: { assetId: string; label: string; cloudCardId?: string }) {
  const [asset, setAsset] = useState<CourseAudioAsset | null | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setAsset(undefined);
    void loadCourseAudioAsset({ assetId, cloudCardId }).then((loaded) => { if (active) setAsset(loaded); });
    return () => { active = false; };
  }, [assetId, cloudCardId]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "a" || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      const control = controlRef.current;
      const audio = audioRef.current;
      const face = control?.closest(".flashcard-face");
      if (!control || !audio || face?.getAttribute("aria-hidden") === "true") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (audio.paused) void audio.play().catch(() => undefined);
      else audio.pause();
    }
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  }, []);

  // The hidden answer face mounts while the learner is still viewing the
  // question, so preload="auto" starts fetching before Reveal is pressed.
  if (!asset) return null;
  const src = courseAudioPublicUrl(asset);
  if (!src) return null;

  return <div
    ref={controlRef}
    data-study-control="audio"
    onClick={(event) => event.stopPropagation()}
    onKeyDownCapture={(event) => {
      // Native audio players normally bind Space to play/pause after receiving
      // focus. Prevent only that default action and let the study-session Space
      // shortcut continue bubbling to Reveal or Save & Next.
      if (event.key === " ") event.preventDefault();
    }}
    style={{ width: "100%", marginTop: "0.75rem", display: "grid", justifyItems: "center" }}
  >
    <audio
      ref={audioRef}
      controls
      preload="auto"
      src={src}
      aria-label={`Audio for ${label}. Press A to play or pause.`}
      style={{ width: "min(100%, 32rem)" }}
    >
      Your browser does not support HTML audio.
    </audio>
  </div>;
}
