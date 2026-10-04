import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { open, targets } from "./helpers";

/*
 * Right-to-left (D93): Arabic, Hebrew, Persian and Urdu pages set dir="rtl", and a part must mirror with
 * them. Checked without writing down what each part should look like: every visible element's place in
 * a right-to-left page must be its left-to-right place, mirrored. A margin, a padding, a position or an
 * alignment written as "left" instead of "start" shows up as an element that did not move.
 *
 * Text written left to right on purpose (code, a card number, a phone number) carries dir="ltr" and is
 * measured as a whole, not inside.
 */

type Box = { path: string; left: number; right: number };

const WIDTH = 1000;

/** Where every visible element sits, by its path in the document. */
const boxes = (page: Page) =>
  page.evaluate(() => {
    const out: { path: string; left: number; right: number }[] = [];
    const walk = (element: Element, path: string) => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return;
      const box = element.getBoundingClientRect();
      // Inline pieces of a sentence follow the sentence: English text stays left to right inside a
      // right-to-left page, as it should. A real translation would mirror; only boxes are judged here.
      // Plain inline elements are always pieces of a line; an inline block is one only beside text.
      const inSentence =
        style.display === "inline" ||
        (style.display.startsWith("inline") &&
          [...(element.parentNode?.childNodes ?? [])].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== ""));
      // Visually hidden text (a 1px clip) and empty boxes say nothing about the layout.
      const shown = !inSentence && box.width > 2 && box.height > 2 && style.clipPath === "none" && style.clip === "auto";
      if (shown) out.push({ path, left: Math.round(box.left), right: Math.round(box.right) });
      // Inside a drawing or a deliberately left-to-right run, only the whole is measured.
      if (element instanceof SVGElement || (element !== document.documentElement && element.getAttribute("dir") === "ltr")) return;
      [...element.children].forEach((child, i) => walk(child, `${path}/${child.tagName.toLowerCase()}[${i}]`));
    };
    walk(document.body, "body");
    return out;
  });

async function layout(page: Page, url: string, dir: "ltr" | "rtl") {
  // Before anything else runs, as a page written in that direction would be: set the moment <html> exists.
  await page.addInitScript((value) => {
    const set = () => document.documentElement?.setAttribute("dir", value);
    if (document.documentElement) return set();
    new MutationObserver((_, observer) => {
      if (!document.documentElement) return;
      set();
      observer.disconnect();
    }).observe(document, { childList: true });
  }, dir);
  await open(page, url);
  // Let entrances and transitions finish: a part sliding in is not yet where it lives.
  await page.waitForTimeout(400);
  return boxes(page);
}

for (const slug of Object.keys(components)) {
  for (const target of targets(slug).slice(0, 2)) {
    test(`${slug} mirrors right to left, ${target.name}`, async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Layout mirroring is the same in every engine; Chromium measures it");
      const variant = Object.keys(components[slug].variants)[0];
      const context = await browser.newContext({ viewport: { width: WIDTH, height: 2400 }, reducedMotion: "reduce" });
      const ltr = await layout(await context.newPage(), target.url(variant), "ltr");
      const rtl = new Map((await layout(await context.newPage(), target.url(variant), "rtl")).map((box) => [box.path, box]));
      await context.close();

      const width = WIDTH;
      const unmirrored = ltr
        .map((box: Box) => ({ box, mirror: rtl.get(box.path) }))
        .filter(({ mirror }) => mirror)
        .filter(({ box, mirror }) => Math.abs(mirror!.left - (width - box.right)) > 2 || Math.abs(mirror!.right - (width - box.left)) > 2)
        .map(({ box, mirror }) => `${box.path}: ltr ${box.left}–${box.right}, rtl ${mirror!.left}–${mirror!.right}, expected ${width - box.right}–${width - box.left}`);
      expect(unmirrored.slice(0, 8), `${unmirrored.length} elements did not mirror`).toEqual([]);
    });
  }
}
