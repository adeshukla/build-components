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

test("each part's changes are an RSS feed, and every part's are one more (D100)", async ({ page, request }) => {
  test.skip(test.info().project.name !== "chromium", "Feeds, not pages: once is enough");
  const one = await request.get("/changes/feature-grid.xml");
  expect(one.headers()["content-type"]).toContain("application/rss+xml");
  const all = await request.get("/changes.xml");
  expect(all.headers()["content-type"]).toContain("application/rss+xml");
  expect((await request.get("/changes/not-a-part.xml")).status()).toBe(404);

  // Both are well-formed RSS that a reader can take: parsed here by the browser's own XML parser.
  await page.goto("/parts");
  const read = (xml: string) =>
    page.evaluate((text) => {
      const doc = new DOMParser().parseFromString(text, "application/xml");
      return {
        broken: doc.querySelector("parsererror") !== null,
        titles: [...doc.querySelectorAll("item > title")].map((node) => node.textContent),
        guids: [...doc.querySelectorAll("item > guid")].map((node) => node.textContent),
      };
    }, xml);

  const feed = await read(await one.text());
  expect(feed.broken).toBe(false);
  expect(feed.titles).toHaveLength(changesOf("feature-grid").length);
  expect(feed.titles[0]).toBe(`Feature grid ${versionOf("feature-grid")}: added`);
  expect(feed.guids[0]).toBe(`feature-grid@${versionOf("feature-grid")}`);

  // A change made to many parts on one day is one item that names them, not one item each.
  const everything = await read(await all.text());
  expect(everything.broken).toBe(false);
  expect(new Set(everything.guids).size).toBe(everything.guids.length);
  expect(everything.titles.filter((title) => /^\d+ parts: added$/.test(title ?? "")).length).toBeGreaterThan(0);
  expect(everything.titles.length).toBeLessThan(inStock.length);

  // The part page names both feeds for readers, and links its own where people can see it.
  await page.goto("/feature-grid");
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"][href$="/changes/feature-grid.xml"]')).toHaveCount(1);
  await expect(page.locator("main").getByRole("link", { name: "Follow changes to Feature grid (RSS)" })).toHaveAttribute("href", "/changes/feature-grid.xml");
});
