import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("How this site works guide", () => {
  it("is present on the Account page for signed-in and signed-out users", () => {
    const account = fs.readFileSync("src/pages/account-page.tsx", "utf8");
    expect(account).toContain('import { HowSiteWorks } from "./how-site-works"');
    expect(account.match(/<HowSiteWorks \/>/g)?.length).toBe(2);
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
