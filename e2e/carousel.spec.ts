import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.carousel.variants);
const slide = (page: Page, position: string) => page.getByRole("group", { name: position });
const dot = (page: Page, name: string | RegExp) => page.getByRole("button", { name });

for (const target of targets("carousel")) {
  test.describe(`carousel — ${target.name} export`, () => {
    test("no axe violations for every variant", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
    });

    test("every slide is in the page, labelled with its position", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("group", { name: "Customer stories" })).toBeVisible();
      await expect(slide(page, "1 of 4")).toContainText("Harbour Studio");
      await expect(slide(page, "4 of 4")).toContainText("Meridian");

      // Previous is off at the start; next is available.
      await expect(dot(page, "Previous slide")).toBeDisabled();
      await expect(dot(page, "Next slide")).toBeEnabled();
    });

    test("next and previous move through the slides", async ({ page }) => {
      await open(page, target.url("default"));
      await dot(page, "Next slide").click();
      await expect(dot(page, "Previous slide")).toBeEnabled();
      await expect(dot(page, /^Slide 2:/)).toHaveAttribute("aria-current", "true");

      await dot(page, "Previous slide").click();
      await expect(dot(page, /^Slide 1:/)).toHaveAttribute("aria-current", "true");
      await expect(dot(page, "Previous slide")).toBeDisabled();
    });

    test("a dot jumps straight to its slide, and the last one ends the row", async ({ page }) => {
      await open(page, target.url("default"));
      await dot(page, /^Slide 4:/).click();
      await expect(dot(page, /^Slide 4:/)).toHaveAttribute("aria-current", "true");
      await expect(dot(page, "Next slide")).toBeDisabled();
    });

    test("the slide row itself can take focus, so it can be scrolled by keyboard", async ({ page }) => {
      await open(page, target.url("default"));
      const track = page.getByRole("group", { name: "Customer stories slides" });
      await track.focus();
      await expect(track).toBeFocused();
    });

    test("repeat variant: the ends wrap instead of stopping", async ({ page }) => {
      await open(page, target.url("repeat"));
      // Previous is available from the start here, because it wraps to the last slide.
      await expect(dot(page, "Previous slide")).toBeEnabled();
      await dot(page, "Previous slide").click();
      await expect(dot(page, /^Slide 4:/)).toHaveAttribute("aria-current", "true");

      await dot(page, "Next slide").click();
      await expect(dot(page, /^Slide 1:/)).toHaveAttribute("aria-current", "true");
    });

    test("auto variant: two on screen, a stop button and a live counter", async ({ page }) => {
      await open(page, target.url("auto"));
      await expect(page.getByRole("group", { name: "Case studies slides" })).toBeVisible();
      const counter = page.getByText(/Slide \d+ of 3/); // 4 slides, 2 on screen
      await expect(counter).toBeVisible();
      await expect(dot(page, /^Slide 1:/)).toHaveCount(0); // dots are off here

      // Stopping holds the carousel where it is, instead of moving on its own.
      await dot(page, "Stop automatic slide changes").click();
      await expect(dot(page, "Start automatic slide changes")).toBeVisible();
      const stopped = await counter.textContent();
      await page.waitForTimeout(2500); // longer than the 2 second interval
      await expect(counter).toHaveText(stopped ?? "");
    });
  });
}

test("registry serves the carousel with config from the URL", async ({ request }) => {
  const query = new URLSearchParams({
    slides: JSON.stringify([{ title: "One", text: "", image: "javascript:alert(1)", alt: "" }]),
    perView: "9",
    interval: "99",
  });
  const item = await (await request.get(`/r/carousel.json?${query}`)).json();
  expect(item).toMatchObject({ name: "carousel", type: "registry:component" });
  expect(item.files[0].content).not.toContain("javascript:");
  expect(item.files[0].content).toContain('"perView": "1"'); // unknown value falls back
  expect(item.files[0].content).toContain('"interval": 20'); // clamped to the schema maximum
});
