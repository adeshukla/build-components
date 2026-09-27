import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["autosave-field"].variants);
const field = (page: Page) => page.getByRole("textbox");
const state = (page: Page) => page.locator("[data-state]");

for (const target of targets("autosave-field")) {
  test.describe(`autosaving field — ${target.name} export`, () => {
    test("no axe violations for every variant, and while failed", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("fails"));
      await field(page).fill("Something worth keeping");
      await expect(state(page)).toHaveAttribute("data-state", "error");
      await expectNoAxeViolations(page);
    });

    test("the state is a polite status, never an alert", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(state(page)).toHaveAttribute("role", "status");
      // Next injects its own route announcer with role=alert on every page; this asks about the component.
      await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toHaveCount(0);
    });

    test("typing says not saved, then saving, then saved with a time", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("A draft");
      await expect(state(page)).toHaveText("Not saved yet");
      await expect(state(page)).toHaveText(/^Saved at \d\d:\d\d$/, { timeout: 5_000 });
    });

    test("it waits for a rest in the typing rather than saving per letter", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).pressSequentially("abcdef", { delay: 40 });
      // Still mid-burst: nothing has been sent yet.
      await expect(state(page)).toHaveAttribute("data-state", "unsaved");
      await expect(state(page)).toHaveAttribute("data-state", "saved", { timeout: 5_000 });
    });

    test("a failure keeps the text and offers one button", async ({ page }) => {
      await open(page, target.url("fails"));
      await field(page).fill("Something worth keeping");
      await expect(state(page)).toHaveText("Could not save.");
      await expect(field(page)).toHaveValue("Something worth keeping");
      const retry = page.getByRole("button", { name: "Try again" });
      await expect(retry).toBeVisible();
      await retry.click();
      await expect(state(page)).toHaveText("Could not save.");
    });
  });
}

test("registry serves the autosaving field with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/autosave-field.json?name=draft&pauseMs=1500")).json();
  expect(item).toMatchObject({ name: "autosave-field", type: "registry:component" });
  expect(item.files[0].content).toContain('"name": "draft"');
  expect(item.files[0].content).toContain('"pauseMs": 1500');
});
