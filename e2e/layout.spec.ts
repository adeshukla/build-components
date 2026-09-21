import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { open, targets } from "./helpers";

/**
 * Layout and target-size checks for every component, at three widths, on both outputs.
 * Behaviour tests never catch a component that runs off the side of a phone, or a button
 * too small to hit — these do.
 */
const widths = [375, 768, 1280];

/** Anything a person is meant to press, and how big it actually is. */
async function problemsOn(page: Page, width: number) {
  return page.evaluate((viewport) => {
    const found: string[] = [];
    if (document.documentElement.scrollWidth > viewport + 1) {
      found.push(`the page scrolls sideways (${document.documentElement.scrollWidth}px wide)`);
    }

    const seen = new Set<string>();
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") continue;

      // Inside a scroller, or clipped by an ancestor, means it is contained on purpose.
      let contained = false;
      for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowX;
        if (overflow === "auto" || overflow === "scroll" || overflow === "hidden" || overflow === "clip") {
          contained = true;
          break;
        }
      }

      const name = `<${element.tagName.toLowerCase()} class="${String(element.className).slice(0, 40)}">`;
      if (box.right > viewport + 1 && !contained && !seen.has(`over${name}`)) {
        seen.add(`over${name}`);
        found.push(`${name} runs past the right edge (right=${Math.round(box.right)})`);
      }

      const pressable = element.matches(
        "button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=menuitem]",
      );
      // A control wrapped in its label is pressed through the label, so that is the target to
      // measure — this is how a visually hidden file input with a styled button works.
      const target = element.matches("input") ? (element.closest("label") ?? element) : element;
      const size = target.getBoundingClientRect();
      if (pressable && (size.width < 24 || size.height < 24) && !seen.has(`small${name}`)) {
        seen.add(`small${name}`);
        found.push(`${name} is ${Math.round(size.width)}x${Math.round(size.height)}, under the 24px minimum`);
      }
    }
    return found;
  }, width);
}

for (const slug of Object.keys(components)) {
  for (const target of targets(slug)) {
    test.describe(`${slug} layout — ${target.name} export`, () => {
      for (const width of widths) {
        test(`fits and can be pressed at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await open(page, target.url("default"));
          expect(await problemsOn(page, width)).toEqual([]);
        });
      }
    });
  }
}
