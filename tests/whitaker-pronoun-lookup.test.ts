import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from "vitest";

let parser: typeof import("../supabase/functions/latin-lookup/index");

beforeAll(async () => {
  // Import the actual deployed Edge Function source without starting a server.
  vi.stubGlobal("Deno", { env: { get: () => null }, serve: () => {} });
  parser = await import("../supabase/functions/latin-lookup/index");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllGlobals());

function page(output: string) {
  return `<html><body><h1>Whitaker's Words Online</h1><pre>${output}</pre></body></html>`;
}
function reply(text: string, status = 200) { return { status, ok: status >= 200 && status < 300, text: async () => text }; }

const pronounOutput = `quicquid             PRON   1 0 NOM S N
quicquid  X   [XXXBX]
quicquid             PRON   1 0 ACC S N
whatever, whatsoever; everything which; each one; each; everything; anything;`;
const quidOutput = `qu.id                PRON   1 0 NOM S N
qu  PACK   [XXXAX]
qu.id                PRON   1 0 ACC S N
what? something; anything;`;

describe("Whitaker lookup pronoun and empty-result recovery", () => {
  it("retains Whitaker X-coded special pronouns and all analyses on both sides of the headword", () => {
    const matches = parser.toMatches(pronounOutput);
    expect(matches).toHaveLength(1);
    expect(matches[0].headword).toBe("quicquid");
    expect(matches[0].definition).toContain("whatever");
    expect(matches[0].whitaker?.partOfSpeech).toBe("pronoun");
    expect(matches[0].morphology).toContain("pronoun · nominative · singular · neuter");
    expect(matches[0].morphology).toContain("pronoun · accusative · singular · neuter");
    expect(matches[0].whitaker?.rawAnalyses).toHaveLength(2);
  });

  it("recovers quid from the same online source when its short-word page is empty, excluding companion meanings", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(String(url));
      if (calls.length === 1) return reply(page(""));
      if (calls.length === 2) return reply(page(`qu.am                PRON  1 0 ACC S F
qu  PACK   [XXXAX]
which, how;
${quidOutput}`));
      throw Error("Unexpected third fetch");
    });
    const matches = await parser.fetchLatinWords("quid");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("/word/latin/quid");
    expect(calls[1]).toContain("/word/latin/quamquid");
    expect(matches).toHaveLength(1);
    expect(matches[0].definition).toContain("what?");
    expect(matches[0].definition).not.toContain("which, how");
    expect(matches[0].morphology).toContain("pronoun · accusative · singular · neuter");
  });

  it("retries se without manufacturing a definition when no Whitaker output is supplied", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(String(url));
      return reply("<html><body>Please only look up longer words.</body></html>");
    });
    await expect(parser.fetchLatinWords("se")).rejects.toThrow("no usable analysis");
    expect(calls).toHaveLength(3);
    expect(calls[1]).toContain("quamse");
    expect(calls[2]).toContain("sesanguine");
  });

  it("preserves normal inflection lookup and does not retry when the direct result is valid", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(String(url));
      return reply(page(`am.o                 V      1 1 PRES ACTIVE IND 1 S
amo, amare, amavi, amatus  V (1st)  [XXXAX]
love, like; be fond of;`));
    });
    const matches = await parser.fetchLatinWords("amo");
    expect(matches).toHaveLength(1);
    expect(matches[0].definition).toContain("love");
    expect(matches[0].morphology?.[0]).toContain("1st person");
    expect(urls).toHaveLength(1);
  });

  it("returns a genuine no-match only for an explicit source 404", async () => {
    vi.stubGlobal("fetch", async () => reply("", 404));
    expect(await parser.fetchLatinWords("zzyxqw")).toEqual([]);
  });
});
