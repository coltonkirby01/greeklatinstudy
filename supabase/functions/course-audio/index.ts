import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  LESSON3_AUDIO_MODEL,
  LESSON3_PRONUNCIATION_SYSTEM,
  lesson3CourseAudioAssets,
} from "./lesson3-assets.ts";

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

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function sha256(bytes: Uint8Array) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY")?.trim();
  const voiceId = Deno.env.get("ELEVENLABS_CLASSICAL_GREEK_VOICE_ID")?.trim() || DEFAULT_ELEVENLABS_VOICE_ID;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!apiKey) return json({ error: "ELEVENLABS_API_KEY is not configured." }, 503);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase service credentials are unavailable." }, 500);

  const serviceHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  const results: Array<{ id: string; status: "existing" | "generated"; bytes?: number }> = [];

  for (const asset of lesson3CourseAudioAssets) {
    const existingResponse = await fetch(
      `${supabaseUrl}/rest/v1/course_audio_assets?id=eq.${encodeURIComponent(asset.id)}&select=id,audio_base64&limit=1`,
      { headers: serviceHeaders },
    );
    if (!existingResponse.ok) {
      return json({ error: `Could not inspect ${asset.id}: ${await existingResponse.text()}` }, 502);
    }
    const existing = (await existingResponse.json()) as Array<{ id: string; audio_base64?: string }>;
    if (existing[0]?.audio_base64) {
      results.push({ id: asset.id, status: "existing" });
      continue;
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
        body: JSON.stringify({
          text: asset.ttsText,
          model_id: LESSON3_AUDIO_MODEL,
        }),
      },
    );

    if (!elevenLabsResponse.ok) {
      return json(
        {
          error: `ElevenLabs failed for ${asset.id}.`,
          providerStatus: elevenLabsResponse.status,
          providerMessage: await elevenLabsResponse.text(),
        },
        502,
      );
    }

    const bytes = new Uint8Array(await elevenLabsResponse.arrayBuffer());
    if (!bytes.length) return json({ error: `ElevenLabs returned empty audio for ${asset.id}.` }, 502);

    const payload = {
      id: asset.id,
      mime_type: elevenLabsResponse.headers.get("Content-Type")?.split(";")[0] || "audio/mpeg",
      audio_base64: bytesToBase64(bytes),
      pronunciation_system: LESSON3_PRONUNCIATION_SYSTEM,
      engine: `ElevenLabs ${LESSON3_AUDIO_MODEL} · voice ${voiceId}`,
      source_note: `${asset.label}. IPA sent to ElevenLabs: ${asset.ttsText}`,
      sha256: await sha256(bytes),
      updated_at: new Date().toISOString(),
    };

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/course_audio_assets?on_conflict=id`, {
      method: "POST",
      headers: {
        ...serviceHeaders,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (!saveResponse.ok) {
      return json({ error: `Could not store ${asset.id}: ${await saveResponse.text()}` }, 502);
    }

    results.push({ id: asset.id, status: "generated", bytes: bytes.length });
  }

  return json({
    ok: true,
    pronunciationSystem: LESSON3_PRONUNCIATION_SYSTEM,
    model: LESSON3_AUDIO_MODEL,
    voiceId,
    results,
  });
});
