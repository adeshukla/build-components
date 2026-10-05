import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { frameworks } from "../lib/framework-output";

/** Navigate, and on React harness pages wait until hydration has finished. */
export async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load" });
  // A framework page marks itself once its component is on it (Angular starts after load).
  if (url.includes("/fw-")) {
    await page.locator('html[data-mounted="true"]').waitFor({ state: "attached", timeout: 15_000 });
    return;
  }
  if (!url.startsWith("/harness")) return;
  const hydrated = page.locator('[data-hydrated="true"]').first();
  try {
    await hydrated.waitFor({ state: "attached", timeout: 5_000 });
  } catch {
    // A harness route written moments ago is sometimes not registered by the dev server yet:
    // one reload is enough, and it is only ever the first visit in a run.
    await page.goto(url, { waitUntil: "load" });
    await hydrated.waitFor({ state: "attached", timeout: 30_000 });
  }
}

export async function expectNoAxeViolations(page: Page) {
  // Let open animations finish: mid-fade colours would give false contrast failures. Endless ones
  // (a skeleton's pulse, a spinner) never finish, so they are left running instead of waited for.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          // Scroll- and view-driven animations only finish when the scrolling does, so waiting on
          // one waits for ever: they are left where they are.
          .filter((animation) => animation.timeline === document.timeline)
          // A transition that is replaced or interrupted rejects with an AbortError. It has settled,
          // which is all this is waiting for, so the rejection is not a failure.
          .map((animation) => animation.finished.catch(() => undefined)),
      ),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

/**
 * The parts whose framework outputs are tested (D92): FW_PARTS="date-picker,tabs", "all" or "none".
 * Read from the environment, so the test list is the same in every process.
 */
export function frameworkParts(): string[] | undefined {
  const parts = process.env.FW_PARTS ?? "all";
  if (parts === "all") return undefined;
  return parts === "none" ? [] : parts.split(",");
}

/** Every exported output of a component; each spec runs the same tests against all of them. */
export function targets(slug: string) {
  const only = frameworkParts();
  const withFrameworks = !only || only.includes(slug);
  const file = (variant: string, framework: string) =>
    pathToFileURL(path.join(__dirname, ".generated", slug, variant, `fw-${framework}`, "index.html")).href;
  return [
    { name: "React + Tailwind", url: (variant: string) => `/harness/${slug}-${variant}` },
    {
      name: "HTML/CSS/JS",
      url: (variant: string) =>
        pathToFileURL(path.join(__dirname, ".generated", slug, variant, "index.html")).href,
    },
    ...(withFrameworks
      ? frameworks.map((framework) => ({ name: framework.name, url: (variant: string) => file(variant, framework.id) }))
      : []),
  ];
}

/**
 * Answers what a form part sends to "/api/send-test" (its Send to option, D95), with the status asked for,
 * and keeps each request's body. A file page has no server, so its form is pointed at a host the test
 * answers instead; React pages stay on their own origin, which the site's CSP allows.
 */
export async function answerSends(page: Page) {
  const bodies: string[] = [];
  let status = 200;
  await page.route("**/api/send-test", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status, contentType: "application/json", body: "{}", headers: { "Access-Control-Allow-Origin": "*" } });
  });
  return {
    bodies,
    answerWith: (next: number) => (status = next),
    /** Call after the page has opened: points a file page's form at the answered host. */
    reachable: () =>
      page.evaluate(() => {
        if (location.protocol !== "file:") return;
        document.querySelectorAll("form[action='/api/send-test']").forEach((form) => form.setAttribute("action", "https://forms.example.test/api/send-test"));
      }),
  };
}
