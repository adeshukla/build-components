// Runs the parts' own test files and records, per part, what passed and failed in each browser (D90). The
// part page shows the record, so it is only ever written by a run, never by hand.
//
//   node scripts/test-results.mjs                    every part
//   node scripts/test-results.mjs hero date-picker   just these; the others keep their last record
//
// Uses a running dev server like the tests do: set E2E_PORT=3000 to reuse Adesh's.
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const out = "lib/test-results.json";
const slugs = (process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync("registry")).filter((slug) =>
  fs.existsSync(`e2e/${slug}.spec.ts`),
);
const report = path.join(os.tmpdir(), `bc-test-results-${Date.now()}.json`);

spawnSync(`pnpm exec playwright test ${slugs.map((slug) => `e2e/${slug}.spec.ts`).join(" ")} --reporter=json`, {
  stdio: ["ignore", "ignore", "inherit"],
  shell: true,
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: report },
});
const { suites } = JSON.parse(fs.readFileSync(report, "utf8"));

/** Every test in a suite and the suites inside it. */
const testsIn = (suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests), ...(suite.suites ?? []).flatMap(testsIn)];

const ranOn = new Date().toISOString().slice(0, 10);
// A "+" says the run included changes not yet committed.
const dirty = execSync("git status --porcelain -- registry e2e lib components :!lib/test-results.json").toString().trim() !== "";
const commit = `${execSync("git rev-parse --short HEAD").toString().trim()}${dirty ? "+" : ""}`;
const record = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : {};
for (const suite of suites) {
  const slug = path.basename(suite.file, ".spec.ts");
  const browsers = {};
  for (const test of testsIn(suite)) {
    if (test.status === "skipped") continue;
    const counts = (browsers[test.projectName] ??= { passed: 0, failed: 0 });
    // "expected" is a pass; with no retries there is no "flaky", so anything else failed.
    counts[test.status === "expected" ? "passed" : "failed"] += 1;
  }
  record[slug] = { ranOn, commit, browsers };
}
fs.writeFileSync(out, `${JSON.stringify(Object.fromEntries(Object.entries(record).sort()), null, 2)}\n`);
const failed = Object.entries(record).filter(([, entry]) => Object.values(entry.browsers).some((counts) => counts.failed > 0));
console.log(`${suites.length} parts recorded in ${out}.${failed.length ? ` With failures: ${failed.map(([slug]) => slug).join(", ")}` : ""}`);
