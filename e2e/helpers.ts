import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Navigate, and on React harness pages wait until hydration has finished. */
export async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load" });
  if (!url.startsWith("/harness")) return;
  const hydrated = page.locator('[data-hydrated="true"]').first();
  try {
    await hydrated.waitFor({ state: "attached", timeout: 5_000 });
  } catch {
    // A harness route written moments ago is sometimes not registered by the dev server yet:
    // one reload is enough, and it is only ever the first visit in a run.
    await page.goto(url, { waitUntil: "load" });
    await hydrated.waitFor({ state: "attached", timeout: 30_000 });
  }
}

export async function expectNoAxeViolations(page: Page) {
  // Let open animations finish: mid-fade colours would give false contrast failures.
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

/** Every exported output of a component; each spec runs the same tests against all of them. */
export function targets(slug: string) {
  return [
    { name: "React + Tailwind", url: (variant: string) => `/harness/${slug}-${variant}` },
    {
      name: "HTML/CSS/JS",
      url: (variant: string) =>
        pathToFileURL(path.join(__dirname, ".generated", slug, variant, "index.html")).href,
    },
  ];
}
