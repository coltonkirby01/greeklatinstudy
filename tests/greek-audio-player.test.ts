import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Greek study audio player", () => {
  const source = fs.readFileSync("src/features/greek/classical-greek-audio.tsx", "utf8");
  const sessionSource = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");

  it("uses one compact A play/pause control instead of browser media controls", () => {
    expect(source).toContain("aria-keyshortcuts=\"A\"");
    expect(source).toContain('A · {playing ? "Pause" : "Play"}');
    expect(source).not.toContain("Replay");
    expect(source).not.toContain("RotateCcw");
    expect(source).not.toContain("onClick={replay}");
    expect(source).not.toMatch(/<audio[\s\S]*?\scontrols(?:[=\s>])/u);
    expect(source).not.toContain("playbackRate");
    expect(source).not.toContain("download=");
  });

  it("keeps Space and Enter assigned to study controls after the audio button has focus", () => {
    expect(source).toContain("onKeyDownCapture={preventReservedStudyKeys}");
    expect(source).toContain("onKeyUpCapture={preventReservedStudyKeys}");
    expect(source).toContain('if (event.key === " " || event.key === "Enter") event.preventDefault();');
    expect(source).toContain("Enter assigned only");
    expect(source).toContain("A remains the sole keyboard shortcut for this audio");
    expect(sessionSource).toContain('const controlsTarget = Boolean(target?.closest(".session-toolbar, .study-start-card"));');
    expect(sessionSource).not.toContain('closest("[data-study-control]');
  });

  it("starts again from the beginning when A or Play is used after audio has ended", () => {
    expect(source).toContain("if (audio.ended) audio.currentTime = 0;");
    expect(source).toContain("onClick={togglePlayback}");
  });

  it("keeps repeat playback fast while periodically checking for revised shared audio", () => {
    expect(source).toContain('storageCacheVersion = "classical-greek-audio-v3"');
    expect(source).toContain("persistentPathMaxAgeMs = 5 * 60 * 1_000");
    expect(source).toContain("Date.now() - cached.checkedAt <= persistentPathMaxAgeMs");
    expect(source).toContain("if (request.cloudCardId)");
    expect(source).toContain("generateCourseAudio(request)");
    expect(source).toContain("fetchCourseAudioAsset(request.assetId, true)");
  });
});
