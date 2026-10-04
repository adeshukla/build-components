import { expect, test } from "@playwright/test";
import { inStock } from "../lib/parts";
import { isRegistrySlug, registry, type RegistrySlug } from "../lib/registry";
import { changesOf, versionOf } from "../lib/versions";
import { expectNoAxeViolations } from "./helpers";

/*
 * Versions (D90): every part has one, every file it gives out names it on the first line, and its page
 * lists the changes, the last test run and a way to report a problem.
 */

test("every part has a history, newest first, whose numbers only go up", () => {
  for (const slug of Object.keys(registry) as RegistrySlug[]) {
    const changes = changesOf(slug);
    expect(changes.at(-1)!.kind, slug).toBe("first");
    const numbers = changes.map((change) => change.version.split(".").map(Number)).reverse();
    for (let i = 1; i < numbers.length; i++) {
      const [before, after] = [numbers[i - 1], numbers[i]];
      expect(after[1] > before[1] || (after[1] === before[1] && after[2] > before[2]), `${slug} ${changes.map((c) => c.version)}`).toBe(true);
    }
  }
  // The theme, a fix, then the Words options: 1.0.0, 1.1.0, 1.1.1, 1.2.0.
  expect(changesOf("feature-grid").map((change) => change.version)).toEqual(["1.2.0", "1.1.1", "1.1.0", "1.0.0"]);
});

test("an installed file names the part, its version and where its changes are", async ({ request }) => {
  const item = await (await request.get("/r/feature-grid.json")).json();
  const first = (item.files[0].content as string).split("\n")[0];
  expect(first).toBe(`// Feature grid ${versionOf("feature-grid")} from Build Components. Changes: https://build-components.devstash.me/feature-grid#changes`);
});

test("a part page shows its version, its changes, its last run and a report link", async ({ page }) => {
  test.skip(test.info().project.name !== "chromium", "The page, not the part: once is enough");
  await page.goto("/feature-grid");
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: `${versionOf("feature-grid")}, what changed` })).toHaveAttribute("href", "#changes");
  const changes = main.getByRole("region", { name: "Changes" });
  await expect(changes.getByRole("listitem")).toHaveCount(changesOf("feature-grid").length);
  await expect(changes.getByRole("listitem").first()).toContainText("Added.");
  await expect(main.getByRole("region", { name: "Last test run" })).toContainText(/passed|No run recorded/);
  const report = main.getByRole("link", { name: "Report a problem with Feature grid" });
  await expect(report).toHaveAttribute("href", /^mailto:hello@devstash\.me\?subject=Problem%20with%20Feature%20grid%201\.2\.0&body=/);
  await expectNoAxeViolations(page);
});

test("every part in the catalogue has a version", () => {
  for (const part of inStock) if (isRegistrySlug(part.slug)) expect(versionOf(part.slug)).toMatch(/^1\.\d+\.\d+$/);
});
