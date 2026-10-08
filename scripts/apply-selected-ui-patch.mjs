import fs from "node:fs";

for (const path of ["src/pages/greek-page-v2.tsx", "src/pages/latin-page.tsx"]) {
  const source = fs.readFileSync(path, "utf8");
  const needle = "  const savedCardCount = savedCardEntries.length;\n";
  if (!source.includes(needle)) throw new Error(`Unused savedCardCount line not found in ${path}.`);
  fs.writeFileSync(path, source.replace(needle, ""));
}
