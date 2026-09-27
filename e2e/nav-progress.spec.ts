import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["nav-progress"].variants);
const trigger = (page: Page) => page.getByRole("button");
const state = (page: Page) => page.locator("[data-phase]");

for (const target of targets("nav-progress")) {
  test.describe(`navigation progress — ${target.name} export`, () => {
    test("no axe violations for every variant, idle and loading", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("slow"));
      await trigger(page).click();
      await expect(state(page)).toHaveAttribute("data-phase", "loading");
      await expectNoAxeViolations(page);
    });

    test("the state is a polite status naming the page it reached", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(state(page)).toHaveAttribute("role", "status");
      await expect(state(page)).toHaveText("");
      await trigger(page).click();
      await expect(state(page)).toHaveText("Loading…");
      await expect(state(page)).toHaveText("Loaded: Parts catalogue", { timeout: 6_000 });
    });

    test("nothing is drawn until the load outlasts the delay", async ({ page }) => {
      await open(page, target.url("slow"));
      await trigger(page).click();
      // The announcement starts at once; the bar has to wait.
      await expect(state(page)).toHaveAttribute("data-phase", "waiting");
      await expect(state(page)).toHaveAttribute("data-phase", "loading", { timeout: 4_000 });
    });

    test("the bar is hidden from screen readers and gone once it arrives", async ({ page }) => {
      await open(page, target.url("slow"));
      await trigger(page).click();
      await expect(state(page)).toHaveAttribute("data-phase", "loading");
      const bar = page.locator("[data-track]");
      await expect(bar).toBeVisible();
      await expect(bar).toHaveAttribute("aria-hidden", "true");
      await expect(state(page)).toHaveAttribute("data-phase", "done", { timeout: 8_000 });
      await expect(bar).toBeHidden();
    });

    test("there is no progressbar with an invented value", async ({ page }) => {
      await open(page, target.url("slow"));
      await trigger(page).click();
      await expect(page.getByRole("progressbar")).toHaveCount(0);
    });

    test("barless variant: the words still do the whole job", async ({ page }) => {
      await open(page, target.url("barless"));
      await trigger(page).click();
      await expect(state(page)).toHaveText("Loading…");
      await expect(state(page)).toHaveText(/^Loaded: /, { timeout: 6_000 });
    });
  });
}

test("registry serves the navigation progress with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/nav-progress.json?position=bottom&delayMs=500")).json();
  expect(item).toMatchObject({ name: "nav-progress", type: "registry:component" });
  expect(item.files[0].content).toContain('"position": "bottom"');
  expect(item.files[0].content).toContain('"delayMs": 500');
});
