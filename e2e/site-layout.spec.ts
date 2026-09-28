import { expect, test, type Page } from "@playwright/test";

/**
 * The site's own pages, held to the standard its parts are held to.
 *
 * `layout.spec.ts` checks every exported component at three widths and has caught a dozen real bugs.
 * The pages around those components had never been checked at all — which is how the editor ended up
 * with a 20px "Reset all" on a phone while every part inside it was 44px.
 */
/*
 * The site, plus the four part pages whose option panels are the biggest: every part page is the
 * same template, so what differs between them is the schema the panel is built from.
 */
const pages = [
  "/",
  "/parts",
  "/in-use",
  "/tested",
  "/start",
  "/about",
  "/accessibility",
  "/date-picker",
  "/mega-menu",
  "/cart",
  "/form",
  "/footer",
];
const widths = [375, 768, 1280];

async function problemsOn(page: Page, viewport: number) {
  return page.evaluate((width) => {
    const found: string[] = [];
    if (document.documentElement.scrollWidth > width + 1) {
      found.push(`the page scrolls sideways (${document.documentElement.scrollWidth}px wide)`);
    }

    const seen = new Set<string>();
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") continue;

      const pressable = element.matches(
        "button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=menuitem], summary",
      );
      if (!pressable) continue;

      // The same two exceptions WCAG 2.5.8 makes, and layout.spec.ts already models.
      const hidden = style.clipPath !== "none" || style.clip !== "auto";
      const inSentence =
        style.display === "inline" &&
        (element.parentElement?.textContent ?? "").trim().length > (element.textContent ?? "").trim().length;
      if (hidden || inSentence) continue;

      // A control inside its own label is pressed through the label, so that is the real target.
      const target = element.matches("input") ? (element.closest("label") ?? element) : element;
      /*
       * A card whose title link carries an ::after at inset 0 is pressed anywhere on the card — that
       * overlay is the activation area, so the text is not the target. Measure what a thumb can hit.
       */
      const spread = ["::after", "::before"].some((part) => {
        const pseudo = getComputedStyle(element, part);
        return pseudo.position === "absolute" && pseudo.content !== "none" && pseudo.inset !== "auto";
      });
      let measured: Element = target;
      if (spread) {
        for (let node = element.parentElement; node; node = node.parentElement) {
          if (getComputedStyle(node).position !== "static") {
            measured = node;
            break;
          }
        }
      }
      const size = measured.getBoundingClientRect();
      const name = `<${element.tagName.toLowerCase()}> “${(element.getAttribute("aria-label") ?? element.textContent ?? "").trim().slice(0, 28)}”`;
      if ((size.width < 24 || size.height < 24) && !seen.has(name)) {
        seen.add(name);
        found.push(`${name} is ${Math.round(size.width)}x${Math.round(size.height)}, under the 24px minimum`);
      }
    }
    return found;
  }, viewport);
}

for (const path of pages) {
  test.describe(`${path} layout`, () => {
    for (const width of widths) {
      test(`fits and can be pressed at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        expect(await problemsOn(page, width)).toEqual([]);
      });
    }
  });
}

test("the header's own menu is a comfortable target on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu" });
  const box = await menu.boundingBox();
  // The parts in this catalogue are all 44px. The site that ships them should not be smaller.
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("every link in the phone menu is a comfortable target", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const links = page.locator("#site-menu").getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(3);
  for (let index = 0; index < count; index++) {
    const box = await links.nth(index).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
