import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../../lib/supabase-config";

type CourseAudioAsset = {
  id: string;
  mime_type: string;
  storage_path: string | null;
};

type RememberedPath = { path: string; checkedAt: number };
type MemoryAsset = { promise: Promise<CourseAudioAsset | null>; checkedAt: number };

const assetCache = new Map<string, MemoryAsset>();
const storageCacheVersion = "medieval-latin-audio-v1";
const persistentPathMaxAgeMs = 5 * 60 * 1_000;

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
  } catch {
    return null;
  }
}

function writePersistentPath(assetId: string, path: string) {
  try {
    window.localStorage.setItem(persistentCacheKey(assetId), JSON.stringify({ path, checkedAt: Date.now() } satisfies RememberedPath));
  } catch {
    // Storage can be disabled; the in-memory cache still avoids repeated lookups.
  }
}

function publicAudioUrl(asset: CourseAudioAsset) {
  if (!supabaseUrl || !asset.storage_path) return "";
  const encodedPath = asset.storage_path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/course-audio/${encodedPath}`;
}

async function fetchCachedAsset(assetId: string) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  const remembered = readPersistentPath(assetId);
  if (remembered) return { id: assetId, mime_type: "audio/mpeg", storage_path: remembered.path } satisfies CourseAudioAsset;

  const url = new URL(`${supabaseUrl}/rest/v1/course_audio_assets`);
  url.searchParams.set("id", `eq.${assetId}`);
  url.searchParams.set("select", "id,mime_type,storage_path");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { apikey: supabaseAnonKey, Accept: "application/json" } });
  if (!response.ok) return null;
  const asset = ((await response.json()) as CourseAudioAsset[])[0];
  if (!asset?.storage_path) return null;
  writePersistentPath(assetId, asset.storage_path);
  return asset;
}

function loadCachedAsset(assetId: string) {
  const cached = assetCache.get(assetId);
  if (cached && Date.now() - cached.checkedAt <= persistentPathMaxAgeMs) return cached.promise;
  if (cached) assetCache.delete(assetId);

  const promise = fetchCachedAsset(assetId).catch(() => null).then((asset) => {
    if (!asset) assetCache.delete(assetId);
    return asset;
  });
  assetCache.set(assetId, { promise, checkedAt: Date.now() });
  return promise;
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], [role='listbox']"));
}

/**
 * Cached-only player for the normalized Medieval Latin paradigm recordings.
 *
 * This component intentionally never calls the course-audio Edge Function.
 * Until the user explicitly approves ElevenLabs generation, studying a Latin
 * card can read an already-cached MP3 but can never create a paid recording.
 */
export function MedievalLatinAudio({ assetId, label }: { assetId: string; label: string }) {
  const [asset, setAsset] = useState<CourseAudioAsset | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setAsset(undefined);
    setPlaying(false);
    void loadCachedAsset(assetId).then((loaded) => { if (active) setAsset(loaded); });
    return () => { active = false; };
  }, [assetId]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
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

  if (!asset) return null;
  const src = publicAudioUrl(asset);
  if (!src) return null;

  const preventReservedStudyKeys = (event: { key: string; preventDefault: () => void }) => {
    if (event.key === " " || event.key === "Enter") event.preventDefault();
  };

  return <div
    ref={controlRef}
    data-study-control="audio"
    role="group"
    aria-label={`Medieval Latin audio for ${label}`}
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
      aria-label={`${playing ? "Pause" : "Play"} Medieval Latin audio. Keyboard shortcut A.`}
      onClick={togglePlayback}
    >
      {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      A · {playing ? "Pause" : "Play"}
    </button>
  </div>;
}
