import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../../lib/supabase-config";

type CourseAudioAsset = {
  id: string;
  mime_type: string;
  storage_path: string | null;
};

type AudioRequest = { assetId: string; cloudCardId?: string };
type RememberedPath = { path: string; checkedAt: number };
type MemoryAsset = { promise: Promise<CourseAudioAsset | null>; checkedAt: number };
const assetCache = new Map<string, MemoryAsset>();
const generationRequests = new Map<string, Promise<boolean>>();
const storageCacheVersion = "classical-greek-audio-v3";
const persistentPathMaxAgeMs = 5 * 60 * 1_000;

function cacheKey(request: AudioRequest) {
  return request.cloudCardId ? `cloud:${request.cloudCardId}` : `builtin:${request.assetId}`;
}

function persistentCacheKey(assetId: string) {
  return `${storageCacheVersion}:${assetId}`;
}

function readPersistentPath(assetId: string): RememberedPath | null {
  try {
    const raw = window.localStorage.getItem(persistentCacheKey(assetId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedPath>;
    if (typeof parsed.path !== "string" || typeof parsed.checkedAt !== "number") return null;
    if (Date.now() - parsed.checkedAt > persistentPathMaxAgeMs) return null;
    return { path: parsed.path, checkedAt: parsed.checkedAt };
  } catch { return null; }
}

function writePersistentPath(assetId: string, path: string) {
  try { window.localStorage.setItem(persistentCacheKey(assetId), JSON.stringify({ path, checkedAt: Date.now() } satisfies RememberedPath)); }
  catch { /* storage may be disabled; in-memory caching still works */ }
}

export function courseAudioPublicUrl(asset: Pick<CourseAudioAsset, "storage_path">) {
  if (!supabaseUrl || !asset.storage_path) return "";
  const encodedPath = asset.storage_path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/course-audio/${encodedPath}`;
}

async function fetchCourseAudioAsset(assetId: string, bypassPersistentCache = false) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  if (!bypassPersistentCache) {
    const remembered = readPersistentPath(assetId);
    if (remembered) return { id: assetId, mime_type: "audio/mpeg", storage_path: remembered.path };
  }

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
  if (cached && Date.now() - cached.checkedAt <= persistentPathMaxAgeMs) return cached.promise;
  if (cached) assetCache.delete(key);

  const pending = (async () => {
    const remembered = readPersistentPath(request.assetId);
    if (remembered) return { id: request.assetId, mime_type: "audio/mpeg", storage_path: remembered.path };

    if (request.cloudCardId) {
      // Uploaded Greek cards can be edited after audio was first generated. On
      // a cache miss/expiry, ask the Edge Function to validate source_note
      // before reading the path. If the pronunciation metadata changed, it
      // regenerates once; if not, this is a cheap metadata check with no TTS cost.
      if (!await generateCourseAudio(request)) return fetchCourseAudioAsset(request.assetId, true);
      return fetchCourseAudioAsset(request.assetId, true);
    }

    const existing = await fetchCourseAudioAsset(request.assetId, true);
    if (existing) return existing;
    if (!await generateCourseAudio(request)) return null;
    return fetchCourseAudioAsset(request.assetId, true);
  })().catch(() => null).then((asset) => {
    if (!asset) assetCache.delete(key);
    return asset;
  });

  assetCache.set(key, { promise: pending, checkedAt: Date.now() });
  return pending;
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], [role='listbox']"));
}

export function ClassicalGreekAudio({ assetId, label, cloudCardId }: { assetId: string; label: string; cloudCardId?: string }) {
  const [asset, setAsset] = useState<CourseAudioAsset | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setAsset(undefined);
    setPlaying(false);
    void loadCourseAudioAsset({ assetId, cloudCardId }).then((loaded) => { if (active) setAsset(loaded); });
    return () => { active = false; };
  }, [assetId, cloudCardId]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    if (audio.ended) audio.currentTime = 0;
    void audio.play().catch(() => setPlaying(false));
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "a" || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      const control = controlRef.current;
      const face = control?.closest(".flashcard-face");
      if (!control || !audioRef.current || face?.getAttribute("aria-hidden") === "true") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      togglePlayback();
    }
    window.addEventListener("keydown", keydown, true);
    return () => window.removeEventListener("keydown", keydown, true);
  });

  // The hidden answer face mounts while the learner is still viewing the
  // question, so preload="auto" starts fetching before Reveal is pressed.
  if (!asset) return null;
  const src = courseAudioPublicUrl(asset);
  if (!src) return null;

  const preventReservedStudyKeys = (event: { key: string; preventDefault: () => void }) => {
    // Buttons normally turn Space or Enter into a click. Suppressing those
    // defaults keeps Space assigned to the study flow and Enter assigned only
    // to Right/Wrong. A remains the sole keyboard shortcut for this audio.
    if (event.key === " " || event.key === "Enter") event.preventDefault();
  };

  return <div
    ref={controlRef}
    data-study-control="audio"
    role="group"
    aria-label={`Classical Greek audio for ${label}`}
    onClick={(event) => event.stopPropagation()}
    onKeyDownCapture={preventReservedStudyKeys}
    onKeyUpCapture={preventReservedStudyKeys}
    style={{ width: "100%", marginTop: "0.75rem", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}
  >
    <audio
      ref={audioRef}
      preload="auto"
      src={src}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      aria-hidden="true"
      tabIndex={-1}
      style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
    />
    <button
      type="button"
      className="small-outline-button"
      aria-keyshortcuts="A"
      aria-label={`${playing ? "Pause" : "Play"} Classical Greek audio. Keyboard shortcut A.`}
      onClick={togglePlayback}
    >
      {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      A · {playing ? "Pause" : "Play"}
    </button>
  </div>;
}