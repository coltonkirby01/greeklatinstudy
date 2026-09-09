import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Greek study audio player", () => {
  const source = fs.readFileSync("src/features/greek/classical-greek-audio.tsx", "utf8");

  it("uses a compact custom player instead of browser media controls", () => {
    expect(source).toContain("aria-keyshortcuts=\"A\"");
    expect(source).toContain('A · {playing ? "Pause" : "Play"}');
    expect(source).toContain("Replay");
    expect(source).not.toMatch(/<audio[\s\S]*?\scontrols(?:[=\s>])/u);
    expect(source).not.toContain("playbackRate");
    expect(source).not.toContain("download=");
  });

  it("keeps Space assigned to study navigation even after an audio button has focus", () => {
    expect(source).toContain("onKeyDownCapture={preventMediaSpace}");
    expect(source).toContain("onKeyUpCapture={preventMediaSpace}");
    expect(source).toContain('if (event.key === " ") event.preventDefault();');
    expect(source).toContain("Space exclusively assigned to the study");
  });

  it("supports replaying from the beginning without dragging a progress bar", () => {
    expect(source).toContain("audio.currentTime = 0;");
    expect(source).toContain("onClick={replay}");
  });

  it("keeps repeat playback fast while periodically checking for revised shared audio", () => {
    expect(source).toContain('storageCacheVersion = "classical-greek-audio-v3"');
    expect(source).toContain("persistentPathMaxAgeMs = 5 * 60 * 1_000");
    expect(source).toContain("if (request.cloudCardId)");
    expect(source).toContain("generateCourseAudio(request)");
    expect(source).toContain("fetchCourseAudioAsset(request.assetId, true)");
  });
});
