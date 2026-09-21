import { expect, test, type Page } from "@playwright/test";
import { components } from "./generate";
import { expectNoAxeViolations, open, targets } from "./helpers";

const variants = Object.keys(components.upload.variants);

/** The file input is off-screen on purpose, so tests set files on it directly. */
const attach = (page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) =>
  page.locator("input[type=file]").setInputFiles(files);

/** The component's own message list, not Next's route announcer. */
const alerts = (page: Page) => page.locator("ul[role=alert], [role=alert] li").first();
/** A row in the list of attached files — not the message list, which names files too. */
const fileRow = (page: Page, name: string) =>
  page.locator("ul[aria-labelledby='upload-label'] li").filter({ hasText: name });

const brief = { name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(1024) };
const photo = { name: "photo.png", mimeType: "image/png", buffer: Buffer.alloc(2048) };

for (const target of targets("upload")) {
  test.describe(`file upload — ${target.name} export`, () => {
    test("no axe violations, empty and with files", async ({ page }) => {
      for (const variant of variants) {
        await open(page, target.url(variant));
        await expectNoAxeViolations(page);
      }
      await open(page, target.url("default"));
      await attach(page, [brief]);
      await expectNoAxeViolations(page);
    });

    test("the label and hint are in the page, and the input is reachable", async ({ page }) => {
      await open(page, target.url("default"));
      await expect(page.getByText("Attach your brief")).toBeVisible();
      await expect(page.getByText("PDF, Word or an image, up to 5 MB each.")).toBeVisible();
      // Off-screen, not display:none, so it can still be focused and read out.
      await expect(page.locator("input[type=file]")).toBeAttached();
      await expect(page.locator("input[type=file]")).toHaveAttribute("accept", /pdf/);
    });

    test("attaching files lists them with their size", async ({ page }) => {
      await open(page, target.url("default"));
      await attach(page, [brief, photo]);
      await expect(fileRow(page, "brief.pdf")).toBeVisible();
      await expect(fileRow(page, "photo.png")).toBeVisible();
      await expect(page.getByText("1 KB").first()).toBeVisible();
    });

    test("removing a file names the file it removes", async ({ page }) => {
      await open(page, target.url("default"));
      await attach(page, [brief, photo]);
      await page.getByRole("button", { name: "Remove brief.pdf" }).click();
      await expect(fileRow(page, "brief.pdf")).toHaveCount(0);
      await expect(fileRow(page, "photo.png")).toBeVisible();
    });

    test("a file of the wrong kind is refused, and the message says which and why", async ({ page }) => {
      await open(page, target.url("default"));
      await attach(page, [{ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.alloc(10) }]);
      await expect(alerts(page)).toContainText("notes.txt is not a kind of file we accept");
      await expect(fileRow(page, "notes.txt")).toHaveCount(0);
    });

    test("a file that is too big is refused with its size", async ({ page }) => {
      await open(page, target.url("small"));
      await attach(page, [{ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024) }]);
      await expect(alerts(page)).toContainText("big.png is 2.0 MB");
      await expect(alerts(page)).toContainText("largest we can take is 1 MB");
    });

    test("small variant: one file at a time replaces the last", async ({ page }) => {
      await open(page, target.url("small"));
      await attach(page, [photo]);
      await expect(fileRow(page, "photo.png")).toBeVisible();
      await attach(page, [{ name: "other.png", mimeType: "image/png", buffer: Buffer.alloc(100) }]);
      await expect(fileRow(page, "other.png")).toBeVisible();
      await expect(fileRow(page, "photo.png")).toHaveCount(0);
    });
  });
}

test("registry serves the upload with config from the URL", async ({ request }) => {
  const item = await (await request.get("/r/upload.json?maxSizeMb=999&maxFiles=0&multiple=false")).json();
  expect(item).toMatchObject({ name: "upload", type: "registry:component" });
  expect(item.files[0].content).toContain('"multiple": false');
  expect(item.files[0].content).toContain('"maxSizeMb": 100'); // clamped to the schema maximum
  expect(item.files[0].content).toContain('"maxFiles": 1'); // clamped to the schema minimum
});
