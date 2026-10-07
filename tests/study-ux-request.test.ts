import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("requested Greek and Latin study workflow", () => {
  it("adds adaptive strength levels, Enter backtracking, coverage queue, and Wrong Bank flash sessions", () => {
    const session = fs.readFileSync("src/features/study/multi-source-study-session.tsx", "utf8");
    const sidebar = fs.readFileSync("src/features/study/study-session-ui.tsx", "utf8");

    expect(session).toContain("1: Diverse");
    expect(session).toContain("2: Standard");
    expect(session).toContain("3: Concentrated");
    expect(session).toContain('event.key === "Enter"');
    expect(session).toContain("back();");
    expect(sidebar).toContain("Words/forms left");
    expect(sidebar).toContain("Wrong Bank");
    expect(sidebar).toContain("Flash These");
    expect(sidebar).toContain('className="priority-details"');
    expect(sidebar.indexOf('className="priority-details"')).toBeLessThan(sidebar.indexOf("</section>", sidebar.indexOf('className="panel-surface stats-panel"')));
    expect(session).toContain("Do it again");
    expect(session).toContain("Return to larger sessions");
  });

  it("routes Greek to direct vocabulary words and endings but no paradigm selector", () => {
    const route = fs.readFileSync("src/route-preload.ts", "utf8");
    const page = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");

    expect(route).toContain('import("./pages/greek-page-v2")');
    expect(page).not.toContain('title="Vocabulary words"');
    expect(page).toContain('title="New Testament Vocab (Kubo)"');
    expect(page).not.toContain("All Lesson ${config.lesson} vocabulary");
    expect(page).toContain("FilterDirectionControl");
    expect(page).toContain('label={`#${card.rank} · ${card.front}`}');
    expect(page).toContain('title="Endings"');
    expect(page).toContain('label="All Endings"');
    expect(page).not.toContain('title="Paradigms"');
    expect(page).not.toContain('title="Individual cards"');
    expect(page).not.toContain("firstDeclensionMathetes");
    expect(page).not.toContain("imperfectActiveIndicative,");
  });
});
