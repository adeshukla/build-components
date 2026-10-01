// Photographs each scene of the home page reel (/reel, D79) as it opens: public/reels/<slug>.jpg, shown
// before the reel has loaded and, when motion is reduced, instead of it.
//
// Run with the dev server up:  node scripts/reel-stills.mjs   (BASE=http://localhost:3300 to change port)
// Re-run it when one of the reel's parts, or the reel's look, changes.
import { chromium } from "@playwright/test";
import path from "node:path";

const base = process.env.BASE ?? "http://localhost:3000";
const slugs = ["searchable-select", "date-picker", "kanban", "otp", "toast", "command-menu"]; // lib/reel-scenes.ts

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
// Standing alone, the reel posts its messages to itself.
await page.addInitScript(() => {
  window.__scenes = [];
  window.addEventListener("message", (event) => {
    if (event.data?.type === "reel-scene") window.__scenes.push(event.data.index);
  });
});
await page.goto(`${base}/reel`);
for (const [index, slug] of slugs.entries()) {
  await page.waitForFunction((i) => window.__scenes.includes(i), index, { timeout: 60_000 });
  await page.waitForTimeout(900); // the scene's entrance
  await page.screenshot({ path: path.resolve(`public/reels/${slug}.jpg`), type: "jpeg", quality: 82 });
  console.log(slug);
}
await browser.close();
