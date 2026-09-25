import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["comment-thread"].variants);
const field = (page: Page) => page.getByRole("textbox", { name: "Add a comment" });
const post = (page: Page) => page.getByRole("button", { name: "Post" });
const comments = (page: Page) => page.getByRole("listitem");

for (const target of targets("comment-thread")) {
  test.describe(`comment thread — ${target.name} export`, () => {
    test("no axe violations for every variant, before and after posting", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await field(page).fill("Asked the yard this morning.");
      await post(page).click();
      await expectNoAxeViolations(page);
    });

    test("the count is part of the heading and a reply says it is one", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading", { level: 2 })).toHaveText("Comments (3)");
      await expect(comments(page).nth(1)).toContainText("reply");
    });

    test("Post cannot post nothing", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(post(page)).toBeDisabled();
      await field(page).fill("   ");
      await expect(post(page)).toBeDisabled();
      await field(page).fill("Something");
      await expect(post(page)).toBeEnabled();
    });

    test("posting adds the comment, keeps focus in the box and says the count", async ({ page }) => {
      await open(page, target.url("default"));
      await field(page).fill("Asked the yard this morning.");
      await post(page).click();
      await expect(comments(page)).toHaveCount(4);
      await expect(comments(page).last()).toContainText("Asked the yard this morning.");
      await expect(comments(page).last()).toContainText("You");
      await expect(field(page)).toHaveValue("");
      await expect(field(page)).toBeFocused();
      await expect(page.getByRole("status")).toContainText("4 comments in this thread");
    });

    test("the hide button reports itself and hides the list", async ({ page }) => {
      await open(page, target.url("default"));
      const toggle = page.getByRole("button", { name: "Hide the thread" });
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await toggle.click();
      await expect(comments(page)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Show the thread" })).toHaveAttribute("aria-expanded", "false");
    });

    test("readonly variant: no box, no hide button", async ({ page }) => {
      await open(page, target.url("readonly"));
      await expect(page.getByRole("textbox")).toHaveCount(0);
      await expect(page.getByRole("button")).toHaveCount(0);
      await expect(comments(page)).toHaveCount(3);
    });
  });
}

test("registry serves the comment thread with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/comment-thread.json?yourName=Ade&allowReply=false")).json();
  expect(item).toMatchObject({ name: "comment-thread", type: "registry:component" });
  expect(item.files[0].content).toContain('"yourName": "Ade"');
  expect(item.files[0].content).toContain('"allowReply": false');
});
