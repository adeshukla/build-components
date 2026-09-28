import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components["notification-list"].variants);
const rows = (page: Page) => page.getByRole("listitem");
const markAll = (page: Page) => page.getByRole("button", { name: "Mark all as read" });
const status = (page: Page) => page.getByRole("status");

for (const target of targets("notification-list")) {
  test.describe(`notification list — ${target.name} export`, () => {
    test("no axe violations for every variant, and once all are read", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await markAll(page).click();
      await expectNoAxeViolations(page);
    });

    test("each per-item button is named with the item it acts on", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("button", { name: "Mark as read: Build 4812 failed on main" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Mark as read: / })).toHaveCount(3);
    });

    test("unread is a word, not only a bar", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(rows(page).first().getByText("Unread")).toBeVisible();
      // Visible ones only: the plain output keeps a hidden flag on the read rows.
      await expect(page.getByText("Unread", { exact: true }).filter({ visible: true })).toHaveCount(3);
    });

    test("the count is inside the heading text, so it never reads Notifications(3)", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByRole("heading")).toHaveText("Notifications (3 unread)");
    });

    test("marking one takes its button away and updates both counts", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(status(page)).toHaveText("3 unread");
      await page.getByRole("button", { name: "Mark as read: Build 4812 failed on main" }).click();
      await expect(page.getByRole("button", { name: "Mark as read: Build 4812 failed on main" })).toHaveCount(0);
      await expect(status(page)).toHaveText("2 unread");
      await expect(page.getByRole("heading")).toHaveText("Notifications (2 unread)");
    });

    test("read items have no button at all, rather than a disabled one", async ({ page }) => {
      await open(page, target.url("default"));
      const read = rows(page).nth(3);
      await expect(read).toHaveAttribute("data-unread", "false");
      await expect(read.getByRole("button")).toHaveCount(0);
    });

    test("mark-all clears everything and then takes itself away", async ({ page }) => {
      await open(page, target.url("default"));
      await markAll(page).click();
      await expect(page.getByRole("button", { name: /^Mark as read: / })).toHaveCount(0);
      await expect(markAll(page)).toHaveCount(0);
      await expect(status(page)).toHaveText("Nothing unread.");
      await expect(page.getByRole("heading")).toHaveText("Notifications");
    });

    test("quiet variant: no count in the heading and its own wording", async ({ page }) => {
      await open(page, target.url("quiet"));
      await expect(page.getByRole("heading")).toHaveText("Inbox");
      await expect(page.getByText("New", { exact: true }).first()).toBeVisible();
    });
  });
}

test("registry serves the notification list with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/notification-list.json?heading=Inbox&showCount=false")).json();
  expect(item).toMatchObject({ name: "notification-list", type: "registry:component" });
  expect(item.files[0].content).toContain('"heading": "Inbox"');
  expect(item.files[0].content).toContain('"showCount": false');
});
