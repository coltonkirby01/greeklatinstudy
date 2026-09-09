import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Greek study audio player", () => {
  const source = fs.readFileSync("src/features/greek/classical-greek-audio.tsx", "utf8");

  it("uses custom controls instead of the browser media control strip", () => {
    expect(source).toContain("aria-keyshortcuts=\"A\"");
    expect(source).toContain("Replay");
    expect(source).not.toMatch(/<audio[\s\S]*?\scontrols(?:[=\s>])/u);
    expect(source).not.toContain("playbackRate");
    expect(source).not.toContain("download=");
  });

  it("keeps Space assigned to study navigation rather than media playback", () => {
    expect(source).toContain('if (event.key === " ") event.preventDefault();');
    expect(source).toContain("the study\n      // session's Space shortcut");
  });
});
