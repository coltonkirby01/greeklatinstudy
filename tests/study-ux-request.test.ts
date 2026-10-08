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
    expect(session).not.toContain('className="toolbar-timer-shortcut"');
  });

  it("routes Greek to direct vocabulary words and endings but no paradigm selector", () => {
    const route = fs.readFileSync("src/route-preload.ts", "utf8");
    const page = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");

    expect(route).toContain('import("./pages/greek-page-v2")');
    expect(page).not.toContain('title="Vocabulary words"');
    expect(page).toContain('title="New Testament Vocab (Kubo)"');
    expect(page).toContain('title="Greek Lessons (Groton)"');
    expect(page).not.toContain("All Lesson ${config.lesson} vocabulary");
    expect(page).toContain("FilterDirectionControl");
    expect(page).toContain('oneWordVocabularyGloss(card.back)');
    expect(page.match(/oneWordVocabularyGloss\(card\.back\)/g)?.length).toBe(2);
    expect(page).toContain('title="Endings"');
    expect(page).toContain('label="All Endings"');
    expect(page).not.toContain('title="Paradigms"');
    expect(page).not.toContain('title="Individual cards"');
    expect(page).not.toContain("firstDeclensionMathetes");
    expect(page).not.toContain("imperfectActiveIndicative,");
  });

  it("shows individual Saved Cards and a persistent Currently Selected snapshot", () => {
    const sidebar = fs.readFileSync("src/features/study/study-session-ui.tsx", "utf8");
    const savedFilter = fs.readFileSync("src/features/study/saved-cards-filter.tsx", "utf8");
    const greek = fs.readFileSync("src/pages/greek-page-v2.tsx", "utf8");
    const latin = fs.readFileSync("src/pages/latin-page.tsx", "utf8");

    expect(savedFilter).toContain('title="Saved Cards"');
    expect(savedFilter).toContain('title="Individual saved cards"');
    expect(greek).toContain("<SavedCardsFilter");
    expect(latin).toContain("<SavedCardsFilter");
    expect(greek).toContain("<SelectedCardsProvider");
    expect(latin).toContain("<SelectedCardsProvider");

    expect(sidebar).toContain("Currently Selected");
    expect(sidebar).toContain("selectedSnapshot");
    expect(sidebar).toContain("setSelectedSnapshot([...selectedCards])");
    expect(sidebar).toContain('className={`current-selected-item ${checked ? "" : "is-deselected"}`}');
    expect(sidebar).not.toContain("Progress · {copy.sideLabel}");
    expect(sidebar).not.toContain("Answers remain hidden. Only the currently selected cards can appear here");
    expect(sidebar).toContain(".study-grid{align-items:stretch}");
    expect(sidebar).toContain(".study-panel{min-height:0;height:100%}");
  });
});
