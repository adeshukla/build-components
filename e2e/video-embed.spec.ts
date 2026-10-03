import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["video-embed"].variants);
const play = (page: Page) => page.locator("[data-play]");

for (const target of targets("video-embed")) {
  test.describe(`click-to-load video — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after playing", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await play(page).click();
      await expectNoAxeViolations(page);
    });

    test("nothing is requested from anywhere until it is asked for", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.locator("iframe")).toHaveCount(0);
      await expect(page.locator("script[src*='//']")).toHaveCount(0);
    });

    test("the play button is named with the video, not just Play", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(play(page)).toHaveAccessibleName(
        "Play: Building an accessible date picker, start to finish, 24 minutes",
      );
    });

    test("with no embed address it says so rather than showing a black box", async ({ page }) => {
      await open(page, target.url("default"));
      await play(page).click();
      await expect(page.getByText("[TODO: set embedUrl", { exact: false })).toBeVisible();
      await expect(page.locator("iframe")).toHaveCount(0);
    });

    test("with one set, pressing play creates one titled frame", async ({ page }) => {
      await open(page, target.url("loaded"));
      await play(page).click();
      const frame = page.locator("iframe");
      await expect(frame).toHaveCount(1);
      await expect(frame).toHaveAttribute("title", /accessible date picker/);
      await expect(frame).toHaveAttribute("allowfullscreen", /.*/);
    });

    test("a YouTube page link plays from YouTube's no-cookie embed", async ({ page }) => {
      await page.route(/youtube-nocookie.com/, (route) => route.abort());
      await open(page, target.url("youtube"));
      await play(page).click();
      await expect(page.locator("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/aqzQ1-wAbcd");
    });

    test("there is a direct link as well, for where a frame is blocked", async ({ page }) => {
      await open(page, target.url("loaded"));
      await expect(page.getByRole("link", { name: /^Watch on / })).toBeVisible();
    });

    test("the poster is decoration, and the privacy note goes once it is playing", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Nothing is requested from the video host")).toBeVisible();
      await play(page).click();
      await expect(page.getByText("Nothing is requested from the video host")).toBeHidden();
    });

    test("the shape is reserved before anything loads", async ({ page }) => {
      await open(page, target.url("default"));
      const ratio = await page.locator("[data-frame]").evaluate((node) => getComputedStyle(node).aspectRatio);
      expect(ratio.replace(/\s/g, "")).toBe("16/9");
    });
  });
}

test("registry serves the click-to-load video with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/video-embed.json?aspect=4-3&providerName=Vimeo")).json();
  expect(item).toMatchObject({ name: "video-embed", type: "registry:component" });
  expect(item.files[0].content).toContain('"aspect": "4-3"');
  expect(item.files[0].content).toContain('"providerName": "Vimeo"');
});
