import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { open, targets } from "./helpers";

/*
 * Arrow keys right to left (D93). A part laid out sideways mirrors in a right-to-left page, so its keys
 * mirror too: Left goes forward. Native controls (radios, range inputs) do this themselves; these parts
 * handle the arrows in their scripts.
 *
 * Checked without writing down what each key does: from the same starting point, Right in a
 * left-to-right page and Left in a right-to-left one must leave the part in the same state (where focus
 * is, every ARIA state, every value), and that state must differ from where it started.
 */

const starts: Record<string, (page: Page) => Promise<void>> = {
  tabs: (page) => page.getByRole("tab").first().focus(),
  toolbar: (page) => page.getByRole("toolbar").getByRole("button").first().focus(),
  "menu-bar": (page) => page.getByRole("menubar").getByRole("menuitem").first().focus(),
  "tree-view": (page) => page.getByRole("treeitem", { name: "src", exact: true }).focus(),
  "resizable-panels": (page) => page.getByRole("separator", { name: "Resize the file list" }).focus(),
  "data-grid": (page) => page.getByRole("separator", { name: "Name column width" }).focus(),
  otp: (page) => page.getByRole("group", { name: "Enter the code we sent you" }).getByRole("textbox").nth(1).focus(),
  lightbox: (page) => page.getByRole("button", { name: "Harbour at dawn" }).click(),
  "date-picker": async (page) => {
    await page.getByRole("button", { name: "Choose date" }).click();
    await expect(page.getByRole("dialog", { name: "Choose date" })).toBeVisible();
  },
};

/** Where focus is, every ARIA state and every value: what a key can change. */
const state = (page: Page) =>
  page.evaluate(() => {
    const pathOf = (element: Element | null): string => {
      if (!element || element === document.body) return "body";
      const parent = element.parentElement;
      return `${pathOf(parent)}/${element.tagName.toLowerCase()}[${parent ? [...parent.children].indexOf(element) : 0}]`;
    };
    const attributes = ["aria-expanded", "aria-selected", "aria-valuenow", "aria-current", "aria-pressed", "aria-checked", "tabindex"];
    return {
      focus: pathOf(document.activeElement),
      states: [...document.querySelectorAll(attributes.map((name) => `[${name}]`).join(","))].map(
        (element) => `${pathOf(element)} ${attributes.map((name) => element.getAttribute(name) ?? "").join(" ")}`,
      ),
      values: [...document.querySelectorAll("input")].map((input) => input.value),
      // Text that says where you are ("2 of 6", the month shown).
      live: [...document.querySelectorAll("[aria-live], [role=status], dialog[open] h2, [role=dialog] h2")].map((element) => element.textContent),
    };
  });

async function afterKey(page: Page, url: string, dir: "ltr" | "rtl", slug: string) {
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
  await starts[slug](page);
  const before = await state(page);
  await page.keyboard.press(dir === "ltr" ? "ArrowRight" : "ArrowLeft");
  await page.waitForTimeout(150);
  return { before, after: await state(page) };
}

for (const slug of Object.keys(starts)) {
  for (const target of targets(slug).slice(0, 2)) {
    test(`${slug}: Left right to left is Right left to right, ${target.name}`, async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Which way a key goes does not depend on the engine");
      const variant = Object.keys(components[slug].variants)[0];
      const context = await browser.newContext({ viewport: { width: 1000, height: 1400 }, reducedMotion: "reduce" });
      const ltr = await afterKey(await context.newPage(), target.url(variant), "ltr", slug);
      const rtl = await afterKey(await context.newPage(), target.url(variant), "rtl", slug);
      await context.close();
      expect(ltr.after, "Right did something left to right").not.toEqual(ltr.before);
      expect(rtl.after).toEqual(ltr.after);
    });
  }
}
