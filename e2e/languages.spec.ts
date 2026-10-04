import { expect, test, type Page } from "@playwright/test";
import { dictionary } from "../lib/dictionary";
import { languages } from "../lib/languages";
import { registry } from "../lib/registry";
import type { Option } from "../lib/schema";
import { components } from "./generate";
import { open, targets } from "./helpers";

/*
 * Languages (D94). Two promises: every word a part says by itself is one of its Words options, and the
 * dictionary has every Words option in every language.
 *
 * The first is checked without a list of words: each part is rendered with its options as they come and
 * with its Words in German (the "de" variant e2e/generate.ts writes). Anything it says (text, a label, a
 * placeholder, a title) that is the same in both and is not the person's own content is English nobody
 * can change.
 */

test("no part's files hold a stray control character", () => {
  // One slipped into seven files once, as an escaped regex backreference: it shows on the page as a box.
  const fs = require("node:fs") as typeof import("node:fs");
  const bad = fs
    .readdirSync("registry", { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(tsx?|js|css|html)$/.test(file))
    .filter((file) => /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(fs.readFileSync(`registry/${file}`, "utf8")));
  expect(bad).toEqual([]);
});

test("the dictionary has every Words option in every language", () => {
  const missing: string[] = [];
  for (const [slug, item] of Object.entries(registry)) {
    for (const option of item.schema as readonly Option[]) {
      if (option.group !== "Words" || option.type !== "text") continue;
      const entry = dictionary[option.default];
      for (const { id } of languages) {
        if (id !== "en" && !entry?.[id]?.trim()) missing.push(`${slug}.${option.key} (${id}): ${option.default}`);
      }
    }
  }
  expect(missing.slice(0, 20), `${missing.length} translations missing`).toEqual([]);
});

/** Everything the page says: text, and the attributes a screen reader or a pointer reads out. */
const said = (page: Page) =>
  page.evaluate(() => {
    const out = new Set<string>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      // A demo stand-in (data-demo: filler to scroll past, a button that fakes going offline) is there to be replaced.
      if (!parent || parent.closest("script, style, template, [data-demo], #__next-route-announcer__, next-route-announcer")) continue;
      const text = node.textContent!.trim();
      if (text) out.add(text);
    }
    for (const element of document.body.querySelectorAll("[aria-label], [aria-roledescription], [placeholder], [title], [alt], [aria-valuetext]")) {
      if (element.closest("[data-demo]")) continue;
      for (const name of ["aria-label", "aria-roledescription", "placeholder", "title", "alt", "aria-valuetext"]) {
        const value = element.getAttribute(name)?.trim();
        if (value) out.add(value);
      }
    }
    return [...out];
  });

/** The person's own words: every option that is not a Words option, list items included. */
function contentOf(schema: readonly Option[], config: Record<string, unknown>) {
  const values: string[] = [];
  for (const option of schema) {
    if (option.group === "Words") continue;
    const value = config[option.key];
    // Lists inside one field come apart at a new line, a comma, a semicolon (a plan's features) or a
    // slash (a file path in the tree).
    const pieces = (text: string) => [text, ...text.split(/[\n,;/]/)];
    if (typeof value === "string") values.push(...pieces(value));
    if (Array.isArray(value)) for (const item of value) values.push(...Object.values(item as Record<string, string>).flatMap(pieces));
  }
  return values.map((value) => value.trim()).filter((value) => value.length > 1).sort((a, b) => b.length - a.length);
}

/** Words in a string once the person's own content, numbers and punctuation are taken out. */
function leftover(text: string, content: string[]) {
  // Case aside: a part may lower-case a name it is given ("Change delivery address").
  let rest = text.toLowerCase();
  for (const value of content) rest = rest.split(value.toLowerCase()).join(" ");
  return rest.replace(/[\d\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

/** Words German shares with English ("in {symbol}"), as the pieces around their blanks. */
const sharedPieces = Object.keys(dictionary)
  .filter((english) => dictionary[english].de === english)
  .map((english) => english.split(/\{\w+\}/));

/** Whether text is one of those words, filled in: what it says is German too, not left over. */
const sameInEnglishAndGerman = sharedPieces.map((pieces) => ({
  test: (text: string) => {
    if (!text.startsWith(pieces[0]) || !text.endsWith(pieces.at(-1)!)) return false;
    let at = pieces[0].length;
    for (const piece of pieces.slice(1, -1)) {
      at = text.indexOf(piece, at);
      if (at === -1) return false;
      at += piece.length;
    }
    return text.length >= at + pieces.at(-1)!.length || pieces.length === 1;
  },
}));

for (const slug of Object.keys(components)) {
  for (const target of targets(slug).slice(0, 2)) {
    test(`${slug} says nothing in English that its options cannot change, ${target.name}`, async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "What a part says does not depend on the engine");
      const schema = registry[slug as keyof typeof registry].schema as readonly Option[];
      const firstVariant = Object.keys(components[slug].variants)[0];
      const context = await browser.newContext({ reducedMotion: "reduce" });
      const english = await context.newPage();
      await open(english, target.url(firstVariant));
      const german = await context.newPage();
      // A German page says so (<html lang="de">): parts that name months and days take them from it.
      await german.addInitScript(() => {
        const set = () => document.documentElement?.setAttribute("lang", "de");
        if (document.documentElement) return set();
        new MutationObserver((_, observer) => {
          if (!document.documentElement) return;
          set();
          observer.disconnect();
        }).observe(document, { childList: true });
      });
      await open(german, target.url("de"));
      const [inEnglish, inGerman] = [await said(english), new Set(await said(german))];
      await context.close();

      const { parseConfig } = await import("../lib/schema");
      const content = contentOf(schema, parseConfig(schema, new URLSearchParams(components[slug].variants[firstVariant])));
      const untranslated = inEnglish.filter(
        (text) =>
          inGerman.has(text) &&
          !sameInEnglishAndGerman.some((pattern) => pattern.test(text)) &&
          // A placeholder to replace, and initials taken from a name, are not words to translate.
          !text.startsWith("[TODO") &&
          !/^\p{Lu}{1,3}$/u.test(text) &&
          /\p{L}{2,}/u.test(leftover(text, content)),
      );
      expect(untranslated, `${untranslated.length} things said in English that no option sets`).toEqual([]);
    });
  }
}
