import { resolveBuiltinGreekAsset, type GreekCourseAudioAsset } from "./builtin-greek-assets.ts";
import { containsGreek, greekToClassicalIpa, stripUnpronouncedGreekNotation } from "./greek-ipa.ts";
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  LESSON3_AUDIO_MODEL,
  LESSON3_PRONUNCIATION_SYSTEM,
  lesson3CourseAudioAssets,
} from "./lesson3-assets.ts";

const AUDIO_BUCKET = "course-audio";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseNamedKeys(raw: string | undefined) {
  if (!raw) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

function isAllowedPublicCaller(request: Request) {
  const suppliedKey = request.headers.get("apikey")?.trim();
  if (!suppliedKey) return false;
  const publishableKeys = Object.values(parseNamedKeys(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")));
  const legacyAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  return publishableKeys.includes(suppliedKey) || Boolean(legacyAnonKey && suppliedKey === legacyAnonKey);
}

function adminApiKey() {
  const secretKeys = parseNamedKeys(Deno.env.get("SUPABASE_SECRET_KEYS"));
  return secretKeys.default?.trim() || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || "";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sha256(bytes: Uint8Array) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function storageHeaders(serviceKey: string) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
}

async function ensureAudioBucket(supabaseUrl: string, serviceKey: string) {
  const headers = storageHeaders(serviceKey);
  const existing = await fetch(`${supabaseUrl}/storage/v1/bucket/${AUDIO_BUCKET}`, { headers });
  if (existing.ok) return;
  const created = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: AUDIO_BUCKET, name: AUDIO_BUCKET, public: true, allowed_mime_types: ["audio/mpeg"] }),
  });
  if (!created.ok) {
    const message = await created.text();
    if (!/already exists/i.test(message)) throw new Error(`Could not create audio bucket: ${message}`);
  }
}

async function uploadAudio(supabaseUrl: string, serviceKey: string, assetId: string, bytes: Uint8Array, mimeType: string) {
  await ensureAudioBucket(supabaseUrl, serviceKey);
  const digest = await sha256(bytes);
  const path = `${assetId}/${digest}.mp3`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${AUDIO_BUCKET}/${encodedPath}`, {
    method: "POST",
    headers: {
      ...storageHeaders(serviceKey),
      "Content-Type": mimeType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!response.ok) throw new Error(`Could not upload audio: ${await response.text()}`);
  return { path, digest };
}

type ExistingAudio = {
  id: string;
  mime_type: string;
  audio_base64: string;
  storage_path: string | null;
  source_note: string | null;
  sha256: string | null;
};

type CloudCardRow = {
  id: string;
  front: string;
  back: string;
  reverse_prompt: string | null;
  metadata: Record<string, unknown> | null;
  decks: { title: string; language: string; published: boolean } | Array<{ title: string; language: string; published: boolean }>;
};

function chartSpeechText(metadata: Record<string, unknown>) {
  const rows = metadata.chartRows;
  if (!Array.isArray(rows)) return "";
  const parsed = rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const cells = (row as { cells?: unknown }).cells;
    return Array.isArray(cells) && cells.every((cell) => typeof cell === "string") ? [cells as string[]] : [];
  });
  const width = parsed.reduce((max, cells) => Math.max(max, cells.length), 0);
  const ordered: string[] = [];
  for (let column = 0; column < width; column += 1) {
    for (const cells of parsed) if (cells[column]) ordered.push(stripUnpronouncedGreekNotation(cells[column]));
  }
  return ordered.filter(Boolean).join(", ");
}

function greekTextFromCloudCard(card: CloudCardRow) {
  const metadata = card.metadata ?? {};
  for (const key of ["pronunciationText", "audioText", "greekAudioText"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && containsGreek(value)) return stripUnpronouncedGreekNotation(value);
  }
  const chart = chartSpeechText(metadata);
  if (chart) return chart;
  for (const value of [card.front, card.back, card.reverse_prompt ?? ""]) {
    if (containsGreek(value)) return stripUnpronouncedGreekNotation(value);
  }
  return "";
}

async function resolveCloudGreekAsset(supabaseUrl: string, serviceKey: string, cloudCardId: string): Promise<GreekCourseAudioAsset | null> {
  const url = new URL(`${supabaseUrl}/rest/v1/cards`);
  url.searchParams.set("id", `eq.${cloudCardId}`);
  url.searchParams.set("select", "id,front,back,reverse_prompt,metadata,decks!inner(title,language,published)");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { apikey: serviceKey } });
  if (!response.ok) throw new Error(`Could not inspect uploaded Greek card: ${await response.text()}`);
  const card = ((await response.json()) as CloudCardRow[])[0];
  if (!card) return null;
  const deck = Array.isArray(card.decks) ? card.decks[0] : card.decks;
  if (!deck || deck.language !== "greek" || !deck.published) return null;
  const greekText = greekTextFromCloudCard(card);
  const ttsText = greekToClassicalIpa(greekText);
  return ttsText ? { id: `cloud-card-${card.id}`, label: `${deck.title} Greek card`, ttsText } : null;
}

async function inspectAudio(supabaseUrl: string, serviceKey: string, assetId: string) {
  const url = new URL(`${supabaseUrl}/rest/v1/course_audio_assets`);
  url.searchParams.set("id", `eq.${assetId}`);
  url.searchParams.set("select", "id,mime_type,audio_base64,storage_path,source_note,sha256");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { apikey: serviceKey } });
  if (!response.ok) throw new Error(`Could not inspect ${assetId}: ${await response.text()}`);
  return ((await response.json()) as ExistingAudio[])[0] ?? null;
}

async function saveAudioRow(supabaseUrl: string, serviceKey: string, payload: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/rest/v1/course_audio_assets?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Could not store course audio: ${await response.text()}`);
}

async function ensureAsset(asset: GreekCourseAudioAsset, context: { apiKey: string; voiceId: string; supabaseUrl: string; serviceKey: string }) {
  const { apiKey, voiceId, supabaseUrl, serviceKey } = context;
  const sourceNote = `${asset.label}. IPA sent to ElevenLabs: ${asset.ttsText}`;
  const existing = await inspectAudio(supabaseUrl, serviceKey, asset.id);

  if (existing && existing.source_note === sourceNote) {
    if (existing.storage_path) return { id: asset.id, status: "existing" as const, storagePath: existing.storage_path };
    if (existing.audio_base64) {
      const bytes = base64ToBytes(existing.audio_base64);
      const uploaded = await uploadAudio(supabaseUrl, serviceKey, asset.id, bytes, existing.mime_type || "audio/mpeg");
      await saveAudioRow(supabaseUrl, serviceKey, { id: asset.id, storage_path: uploaded.path, sha256: uploaded.digest, updated_at: new Date().toISOString() });
      return { id: asset.id, status: "migrated" as const, storagePath: uploaded.path };
    }
  }

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text: asset.ttsText, model_id: LESSON3_AUDIO_MODEL }),
    },
  );
  if (!elevenLabsResponse.ok) {
    throw new Error(`ElevenLabs failed for ${asset.id}: ${elevenLabsResponse.status} ${await elevenLabsResponse.text()}`);
  }

  const bytes = new Uint8Array(await elevenLabsResponse.arrayBuffer());
  if (!bytes.length) throw new Error(`ElevenLabs returned empty audio for ${asset.id}.`);
  const mimeType = elevenLabsResponse.headers.get("Content-Type")?.split(";")[0] || "audio/mpeg";
  const uploaded = await uploadAudio(supabaseUrl, serviceKey, asset.id, bytes, mimeType);
  await saveAudioRow(supabaseUrl, serviceKey, {
    id: asset.id,
    mime_type: mimeType,
    audio_base64: bytesToBase64(bytes),
    storage_path: uploaded.path,
    pronunciation_system: LESSON3_PRONUNCIATION_SYSTEM,
    engine: `ElevenLabs ${LESSON3_AUDIO_MODEL} · voice ${voiceId}`,
    source_note: sourceNote,
    sha256: uploaded.digest,
    updated_at: new Date().toISOString(),
  });
  return { id: asset.id, status: "generated" as const, bytes: bytes.length, storagePath: uploaded.path };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAllowedPublicCaller(request)) return json({ error: "Invalid project API key." }, 401);

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY")?.trim();
  const voiceId = Deno.env.get("ELEVENLABS_CLASSICAL_GREEK_VOICE_ID")?.trim() || DEFAULT_ELEVENLABS_VOICE_ID;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = adminApiKey();
  if (!apiKey) return json({ error: "ELEVENLABS_API_KEY is not configured." }, 503);
  if (!supabaseUrl || !serviceKey) return json({ error: "Supabase service credentials are unavailable." }, 500);

  let body: { assetId?: string; cloudCardId?: string } = {};
  try { body = await request.json(); } catch { /* old clients sent an empty body */ }

  try {
    const assets: GreekCourseAudioAsset[] = [];
    if (body.cloudCardId) {
      const cloudAsset = await resolveCloudGreekAsset(supabaseUrl, serviceKey, body.cloudCardId);
      if (cloudAsset) assets.push(cloudAsset);
    } else if (body.assetId) {
      const builtin = resolveBuiltinGreekAsset(body.assetId);
      if (builtin) assets.push(builtin);
    } else {
      // Backward compatibility for the first Lesson 3 client.
      assets.push(...lesson3CourseAudioAssets);
    }
    if (!assets.length) return json({ error: "No pronounceable Classical Greek audio is defined for this card." }, 404);

    const results = [];
    for (const asset of assets) results.push(await ensureAsset(asset, { apiKey, voiceId, supabaseUrl, serviceKey }));
    return json({ ok: true, pronunciationSystem: LESSON3_PRONUNCIATION_SYSTEM, model: LESSON3_AUDIO_MODEL, voiceId, results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502);
  }
});
