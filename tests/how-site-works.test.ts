import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("How this site works guide", () => {
  it("is present once on Home above the progress/cloud-sync callout", () => {
    const home = fs.readFileSync("src/pages/home-page.tsx", "utf8");
    const account = fs.readFileSync("src/pages/account-page.tsx", "utf8");
    expect(home).toContain('import { HowSiteWorks } from "./how-site-works"');
    expect(home.match(/<HowSiteWorks \/>/g)?.length).toBe(1);
    expect(home.indexOf("<HowSiteWorks />")).toBeLessThan(home.indexOf('className="sign-in-callout panel-surface"'));
    expect(account).not.toContain("HowSiteWorks");
  });

  it("derives important numerical explanations from study constants", () => {
    const guide = fs.readFileSync("src/pages/how-site-works.tsx", "utf8");
    expect(guide).toContain("INITIAL_COVERAGE_MULTIPLIER");
    expect(guide).toContain("INITIAL_AUTO_WRONG_REVIEWS");
    expect(guide).toContain("RECENT_AUTO_GRADE_WINDOW");
    expect(guide).toContain("EASY_RECALL_LIMIT_MS");
    expect(guide).toContain("HARD_RECALL_START_MS");
    expect(guide).toContain("20 selected cards must all appear by card 25");
    expect(guide).toContain("Learner");
    expect(guide).toContain("Reviewer");
    expect(guide).toContain("Initial completion");
    expect(guide).toContain("Initial mastery");
  });

  it("requires future agents to update the guide when learner-visible behavior changes", () => {
    const instructions = fs.readFileSync(".github/copilot-instructions.md", "utf8");
    expect(instructions).toContain("src/pages/how-site-works.tsx");
    expect(instructions).toContain("MUST update this guide in the same change");
    expect(instructions).toContain("stem - ending");
    expect(instructions).toContain("INITIAL_COVERAGE_MULTIPLIER = 1.25");
  });
});
