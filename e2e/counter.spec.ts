import { expect, test } from "@playwright/test";
import { open } from "./helpers";

/*
 * The counter (D90). Without a store (here) nothing is stored, but the beacon route still checks what it is
 * sent, and the pages still send it. That the store is called was checked once against a stand-in store
 * with a production build (scratchpad/counter-check.mjs).
 */

test("the beacon route takes only known events and names", async ({ request }) => {
  const post = (body: string) => request.post("/api/count", { data: body, headers: { "content-type": "text/plain" } });
  expect((await post(JSON.stringify({ event: "copy", name: "feature-grid" }))).status()).toBe(204);
  expect((await post(JSON.stringify({ event: "download", name: "template:blog" }))).status()).toBe(204);
  expect((await post(JSON.stringify({ event: "copy", name: "built-site" }))).status()).toBe(204);
  expect((await post(JSON.stringify({ event: "copy", name: "not-a-part" }))).status()).toBe(400);
  expect((await post(JSON.stringify({ event: "install", name: "feature-grid" }))).status()).toBe(400);
  expect((await post(JSON.stringify({ event: "copy", name: "template:nope" }))).status()).toBe(400);
  expect((await post("not json")).status()).toBe(400);
});

test("copying a part's install command counts a copy of that part", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Clipboard permission is a Chromium switch");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "/feature-grid");
  await page.getByRole("tab", { name: /Install/ }).first().click();
  const sent = page.waitForRequest((request) => request.url().endsWith("/api/count"));
  await page.getByRole("button", { name: "Copy install command" }).click();
  expect(JSON.parse((await sent).postData() ?? "")).toEqual({ event: "copy", name: "feature-grid" });
});
