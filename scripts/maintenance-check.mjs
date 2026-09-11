import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

function fail(message) {
  console.error(`maintenance-check: ${message}`);
  process.exitCode = 1;
}

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);

for (const file of tracked) {
  const name = basename(file);
  if (file.startsWith(".github/workflows/temp-") || /(?:\.bak|\.tmp|\.orig|~)$/i.test(name) || file.includes("/backup/")) {
    fail(`temporary/backup artifact is tracked: ${file}`);
  }
}

const retiredPatterns = [
  ["Reading route", /(?:loadReadingPage|path=["']reading["']|href:\s*["']\/reading["'])/],
  ["Reading feature code", /features\/reading|reading-page/],
  ["ElevenLabs usage snapshot", /elevenlabs_usage_snapshot|ElevenLabsUsagePanel|elevenlabs-usage-panel/],
  ["local progress-file import", /legacy-import|Progress backup\s*&\s*migration/],
  ["retired Stats heading", /Continuous memory bank/],
  ["retired footer tagline", /Active recall\s*·\s*adaptive review\s*·\s*reading aloud/],
];

for (const file of tracked.filter((path) => path.startsWith("src/") || path.startsWith("public/"))) {
  if (!/\.(?:ts|tsx|js|jsx|html|css|json|md)$/i.test(file)) continue;
  const text = readFileSync(file, "utf8");
  for (const [label, pattern] of retiredPatterns) {
    if (pattern.test(text)) fail(`${label} reference remains in ${file}`);
  }
}

const catalog = readFileSync("src/features/study/builtin-study-catalog.ts", "utf8");
if (!catalog.includes("BUILTIN_STUDY_DECKS")) fail("canonical built-in study catalog is missing");
if (!tracked.includes("tests/builtin-study-catalog.test.ts")) fail("built-in study catalog regression test is missing");

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (!packageJson.scripts?.["maintain:check"]) fail("package.json is missing maintain:check");
if (!String(packageJson.scripts?.check ?? "").includes("maintain:check")) fail("npm run check must include maintain:check");

if (!process.exitCode) console.log("maintenance-check: clean");
