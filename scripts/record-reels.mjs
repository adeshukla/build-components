// Films real parts for the home page hero: each part on its own preview page, driven by the keyboard,
// with the keys shown on screen. Writes public/reels/<slug>.webm, a still <slug>.jpg (shown before the
// clip plays, on a phone that saves data, and when motion is reduced) and lib/reels.json.
//
// Run with the dev server up:  node scripts/record-reels.mjs   (BASE=http://localhost:3300 to change port)
// Re-run it whenever one of these parts changes, so the footage stays the real thing.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE ?? "http://localhost:3000";
const out = path.resolve("public/reels");
fs.mkdirSync(out, { recursive: true });
const size = { width: 960, height: 600 };

async function hud(page, text, ms) {
  await page.evaluate(
    ([t, m]) => {
      const el = document.getElementById("hud");
      el.textContent = t;
      el.style.opacity = "1";
      clearTimeout(window.__hud);
      window.__hud = setTimeout(() => (el.style.opacity = "0"), m);
    },
    [text, ms],
  );
}
/** Shows the key being pressed, like a screencast key display, then presses it. */
async function key(page, label, combo, pause = 520) {
  await hud(page, label, 900);
  await page.keyboard.press(combo);
  await page.waitForTimeout(pause);
}
async function type(page, text, label = `Type “${text}”`) {
  await hud(page, label, 1400);
  await page.keyboard.type(text, { delay: 230 });
  await page.waitForTimeout(500);
}

/** What each clip shows, in the words the hero uses, and the script that performs it. */
const clips = [
  {
    slug: "command-menu",
    keys: "Ctrl K, arrows, Home, Escape",
    act: async (page, snap) => {
      await key(page, "Ctrl K", "ControlOrMeta+k", 900);
      for (let i = 0; i < 3; i++) await key(page, "↓", "ArrowDown");
      await snap();
      await key(page, "Home", "Home");
      await key(page, "↓", "ArrowDown");
      await key(page, "Esc", "Escape", 900);
    },
  },
  {
    slug: "date-picker",
    keys: "Enter, arrows, Page Down, Enter",
    zoom: 1.05,
    top: true,
    act: async (page, snap) => {
      await page.getByRole("button", { name: /^Choose date/ }).first().focus();
      await key(page, "Enter", "Enter", 900);
      for (let i = 0; i < 3; i++) await key(page, "→", "ArrowRight", 420);
      await key(page, "↓", "ArrowDown");
      await key(page, "Page Down · next month", "PageDown", 800);
      await snap();
      await key(page, "Enter", "Enter", 1200);
    },
  },
  {
    slug: "searchable-select",
    keys: "type to filter, arrows, Enter",
    act: async (page, snap) => {
      await page.getByRole("combobox").first().focus();
      await page.waitForTimeout(400);
      await type(page, "uni");
      await key(page, "↓", "ArrowDown");
      await snap();
      await key(page, "↓", "ArrowDown");
      await key(page, "Enter", "Enter", 1200);
    },
  },
  {
    slug: "otp",
    keys: "type the code",
    act: async (page) => {
      await page.getByRole("textbox").first().focus();
      await page.waitForTimeout(400);
      await type(page, "482915", "Type the code");
      await page.waitForTimeout(900);
    },
  },
  {
    slug: "kanban",
    keys: "Enter moves a card",
    act: async (page) => {
      for (const name of [/Move Sand the deck to/, /Move Paint the hull to/]) {
        await page.getByRole("button", { name }).first().focus();
        await page.waitForTimeout(300);
        await key(page, "Enter", "Enter", 1100);
      }
    },
  },
  {
    slug: "toast",
    keys: "Enter",
    act: async (page) => {
      await page.getByRole("button", { name: "Save changes" }).focus();
      await key(page, "Enter", "Enter", 700);
      await key(page, "Enter", "Enter", 700);
      await page.getByRole("button", { name: "Save without a connection" }).focus();
      await key(page, "Enter", "Enter", 1800);
    },
  },
];

const browser = await chromium.launch();
const reels = [];
for (const clip of clips) {
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: out, size }, colorScheme: "light" });
  const page = await context.newPage();
  const started = Date.now();
  await page.goto(`${base}/preview/${clip.slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // Bigger and centred, with the key display. The part itself is untouched.
  await page.addStyleTag({
    content: `html{zoom:${clip.zoom ?? 1.35};background:#fff}
      body{background:#fff;display:grid;place-items:${clip.top ? "start center" : "center"};min-height:100vh}
      body>*{background:#fff!important}
      #hud{position:fixed;right:18px;bottom:18px;z-index:99999;padding:8px 14px;border-radius:999px;
        background:#1c1a17;color:#fff;font:600 14px/1 system-ui;opacity:0;transition:opacity .25s}`,
  });
  await page.evaluate(() => document.body.append(Object.assign(document.createElement("div"), { id: "hud" })));
  await page.waitForTimeout(700);
  const start = (Date.now() - started) / 1000;
  // The still is the moment the part is doing its job: where a clip calls snap(), or its end.
  let snapped = false;
  const snap = async () => {
    snapped = true;
    await page.screenshot({ path: path.join(out, `${clip.slug}.jpg`), type: "jpeg", quality: 72 });
  };
  await clip.act(page, snap);
  if (!snapped) await snap();
  await page.waitForTimeout(400);
  const video = page.video();
  await context.close();
  fs.renameSync(await video.path(), path.join(out, `${clip.slug}.webm`));
  reels.push({ slug: clip.slug, keys: clip.keys, start: Math.round(start * 10) / 10 });
  console.log(clip.slug, `${(fs.statSync(path.join(out, `${clip.slug}.webm`)).size / 1024).toFixed(0)}KB`, `starts at ${start.toFixed(1)}s`);
}
fs.writeFileSync(path.resolve("lib/reels.json"), JSON.stringify(reels, null, 2) + "\n");
await browser.close();
