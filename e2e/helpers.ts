import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

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
