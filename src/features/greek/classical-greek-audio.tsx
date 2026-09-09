import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "../../lib/supabase-config";

type CourseAudioAsset = {
  id: string;
  mime_type: string;
  audio_base64: string;
  pronunciation_system: string;
  engine: string;
  source_note: string | null;
};

const assetCache = new Map<string, Promise<CourseAudioAsset | null>>();
let generationRequest: Promise<boolean> | null = null;

export function courseAudioDataUrl(asset: Pick<CourseAudioAsset, "mime_type" | "audio_base64">) {
  return `data:${asset.mime_type};base64,${asset.audio_base64}`;
}

async function fetchCourseAudioAsset(assetId: string) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  const url = new URL(`${supabaseUrl}/rest/v1/course_audio_assets`);
  url.searchParams.set("id", `eq.${assetId}`);
  url.searchParams.set("select", "id,mime_type,audio_base64,pronunciation_system,engine,source_note");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as CourseAudioAsset[];
  const asset = rows[0];
  return asset?.audio_base64 ? asset : null;
}

async function generateLesson3CourseAudio() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return false;
  if (!generationRequest) {
    generationRequest = fetch(`${supabaseUrl}/functions/v1/course-audio`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    }).then((response) => response.ok).catch(() => false);
  }
  return generationRequest;
}

export function loadCourseAudioAsset(assetId: string) {
  const cached = assetCache.get(assetId);
  if (cached) return cached;

  const request = (async () => {
    const existing = await fetchCourseAudioAsset(assetId);
    if (existing) return existing;

    const generated = await generateLesson3CourseAudio();
    if (!generated) return null;
    return fetchCourseAudioAsset(assetId);
  })().catch(() => null);

  assetCache.set(assetId, request);
  return request;
}

export function ClassicalGreekAudio({ assetId, label }: { assetId: string; label: string }) {
  const [asset, setAsset] = useState<CourseAudioAsset | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    setAsset(undefined);
    void loadCourseAudioAsset(assetId).then((loaded) => { if (active) setAsset(loaded); });
    return () => { active = false; };
  }, [assetId]);

  if (asset === undefined) {
    return <span className="answer-notes" data-study-control="audio">Loading Classical Greek audio…</span>;
  }
  if (!asset) {
    return <span className="answer-notes" data-study-control="audio">Classical Greek audio is not available yet.</span>;
  }

  return <div
    data-study-control="audio"
    onClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => event.stopPropagation()}
    style={{ width: "100%", marginTop: "0.75rem", display: "grid", justifyItems: "center" }}
  >
    <audio
      controls
      preload="none"
      src={courseAudioDataUrl(asset)}
      aria-label={`Classical Greek pronunciation for ${label}`}
      style={{ width: "min(100%, 32rem)" }}
    >
      Your browser does not support HTML audio.
    </audio>
    <span className="answer-notes">{asset.pronunciation_system} · {asset.engine}</span>
  </div>;
}
