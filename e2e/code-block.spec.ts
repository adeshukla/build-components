import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["code-block"].variants);
const copy = (page: Page) => page.getByRole("button", { name: "Copy" });
const wrap = (page: Page) => page.getByRole("button", { name: "Wrap lines" });

for (const target of targets("code-block")) {
  test.describe(`code block — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("copying puts the code on the clipboard, without the line numbers", async ({ page, context, browserName }) => {
      test.skip(browserName !== "chromium", "only chromium can be granted clipboard permissions here");
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await open(page, target.url("default"));
      await copy(page).click();
      await expect(page.getByRole("status")).toHaveText("Copied");
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain("pnpm dlx shadcn@latest add");
      expect(clipboard).not.toMatch(/^1/m);
    });

    test("the copied message clears itself", async ({ page, context, browserName }) => {
      test.skip(browserName !== "chromium", "only chromium can be granted clipboard permissions here");
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await open(page, target.url("default"));
      await copy(page).click();
      await expect(page.getByRole("status")).toHaveText("Copied");
      await expect(page.getByRole("status")).toHaveText("", { timeout: 6000 });
    });

    test("when the clipboard is refused it selects the code and says which keys to press", async ({ page }) => {
      await open(page, target.url("default"));
      // A sandboxed frame, a missing permission, an old browser: all end up here.
      await page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error("refused")) },
        });
      });
      await copy(page).click();
      await expect(page.getByRole("status")).toHaveText("Selected. Press Ctrl+C (Cmd+C on a Mac) to copy.");
      const selected = await page.evaluate(() => window.getSelection()?.toString() ?? "");
      expect(selected).toContain("pnpm dlx shadcn@latest add");
    });

    test("wrap lines is a toggle that reports its state", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(wrap(page)).toHaveAttribute("aria-pressed", "false");
      await wrap(page).click();
      await expect(wrap(page)).toHaveAttribute("aria-pressed", "true");
      const white = await page.locator("pre").evaluate((node) => getComputedStyle(node).whiteSpace);
      expect(white).toBe("pre-wrap");
    });

    test("the code scrolls by keyboard and is a real pre and code", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("pre code")).toHaveCount(1);
      await expect(page.getByRole("region", { name: /install\.sh code/ })).toHaveAttribute("tabindex", "0");
    });

    test("plain variant: no numbers, no wrap button", async ({ page }) => {
      await open(page, target.url("plain"));
      await expect(wrap(page)).toHaveCount(0);
      await expect(page.locator("pre [aria-hidden=true]")).toHaveCount(0);
      await expect(page.getByText("curl.txt")).toBeVisible();
    });
  });
}

test("registry serves the code block with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/code-block.json?title=setup.sh&showLineNumbers=false")).json();
  expect(item).toMatchObject({ name: "code-block", type: "registry:component" });
  expect(item.files[0].content).toContain('"title": "setup.sh"');
  expect(item.files[0].content).toContain('"showLineNumbers": false');
});
