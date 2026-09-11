import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ElevenLabsUsage = {
  tier: string;
  status: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  percentUsed: number;
  nextResetUnix: number | null;
  billingPeriod: string | null;
  refreshPeriod: string | null;
  currentOverage: { amount: string; currency: string } | null;
  updatedAt: string;
};

const numberFormatter = new Intl.NumberFormat();

function planLabel(value: string) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Unknown";
}

function resetLabel(unix: number | null) {
  if (!unix) return "Not reported";
  return new Date(unix * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ElevenLabsUsagePanel() {
  const [usage, setUsage] = useState<ElevenLabsUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("elevenlabs-usage", { body: { refresh: true } });
      if (invokeError) throw invokeError;
      if (!data?.usage) throw new Error(data?.error || "ElevenLabs usage was unavailable.");
      setUsage(data.usage as ElevenLabsUsage);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="deck-settings panel-surface" aria-labelledby="elevenlabs-usage-heading">
      <div className="deck-settings-heading">
        <div>
          <p className="eyebrow">Private administrator usage</p>
          <h2 id="elevenlabs-usage-heading">ElevenLabs</h2>
          <p>The ElevenLabs API key remains server-side. This panel shows the live subscription balance only to administrators.</p>
        </div>
        <div className="settings-actions">
          <button className="secondary-button" type="button" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh usage"}
          </button>
        </div>
      </div>
      {error && <div className="inline-alert">{error}</div>}
      {!error && !usage && <p className="form-help">Loading ElevenLabs usage…</p>}
      {usage && (
        <div className="card-form">
          <div><span className="form-help">Plan</span><strong>{planLabel(usage.tier)}</strong></div>
          <div><span className="form-help">Used</span><strong>{numberFormatter.format(usage.creditsUsed)}</strong></div>
          <div><span className="form-help">Remaining</span><strong>{numberFormatter.format(usage.creditsRemaining)}</strong></div>
          <div><span className="form-help">Current limit</span><strong>{numberFormatter.format(usage.creditsLimit)}</strong></div>
          <div><span className="form-help">Used</span><strong>{usage.percentUsed.toFixed(1)}%</strong></div>
          <div><span className="form-help">Next reset</span><strong>{resetLabel(usage.nextResetUnix)}</strong></div>
          <div className="wide-field">
            <progress max={Math.max(1, usage.creditsLimit)} value={Math.min(usage.creditsUsed, Math.max(1, usage.creditsLimit))} aria-label={`${usage.percentUsed.toFixed(1)} percent of ElevenLabs usage consumed`} />
            <p className="form-help">Status: {planLabel(usage.status)} · refreshed {new Date(usage.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </section>
  );
}
