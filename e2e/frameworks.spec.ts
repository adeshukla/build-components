import { expect, test, type Page } from "@playwright/test";
import { frameworks } from "../lib/framework-output";
import { frameworkParts, open, targets } from "./helpers";

/*
 * What only the framework outputs can get wrong (D92): a component that goes must take its part's
 * listeners, timers and observers with it. Each part's own spec already runs on every framework output.
 *
 * Counted on the page: intervals running, observers observing, and listeners on document, window and media
 * queries. A framework may keep listeners of its own, so the bar is the same framework showing a part with
 * no script (the hero) after it has gone too.
 */

const counting = () => {
  const live = { intervals: new Set<number>(), observers: new Set<object>(), listeners: new Set<string>() };
  (window as unknown as { __bcLive: typeof live }).__bcLive = live;
  const every = window.setInterval;
  const stop = window.clearInterval;
  window.setInterval = ((...args: Parameters<typeof every>) => {
    const id = every(...args);
    live.intervals.add(id);
    return id;
  }) as typeof every;
  window.clearInterval = ((id?: number) => {
    live.intervals.delete(id!);
    stop(id);
  }) as typeof stop;
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const ids = new WeakMap<object, number>();
  let next = 0;
  const idOf = (thing: object) => ids.get(thing) ?? (ids.set(thing, ++next), next);
  const isPage = (target: EventTarget) => target === document || target === window || target instanceof MediaQueryList;
  const key = (target: EventTarget, type: string, listener: object, options: unknown) =>
    `${target === document ? "document" : target === window ? "window" : "media"} ${type} ${idOf(listener)} ${typeof options === "boolean" ? options : Boolean((options as { capture?: boolean })?.capture)}`;
  proto.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (listener && isPage(this)) live.listeners.add(key(this, type, listener, options));
    return add.call(this, type, listener, options);
  };
  proto.removeEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
    if (listener && isPage(this)) live.listeners.delete(key(this, type, listener, options));
    return remove.call(this, type, listener, options);
  };
  const observe = MutationObserver.prototype.observe;
  const disconnect = MutationObserver.prototype.disconnect;
  MutationObserver.prototype.observe = function (...args) {
    live.observers.add(this);
    return observe.apply(this, args);
  };
  MutationObserver.prototype.disconnect = function () {
    live.observers.delete(this);
    return disconnect.call(this);
  };
};

const liveCount = (page: Page) =>
  page.evaluate(() => {
    const live = (window as unknown as { __bcLive: { intervals: Set<number>; observers: Set<object>; listeners: Set<string> } }).__bcLive;
    return { intervals: live.intervals.size, observers: live.observers.size, listeners: [...live.listeners].map((entry) => entry.split(" ").slice(0, 2).join(" ")).sort() };
  });

async function afterUnmount(page: Page, url: string) {
  await page.addInitScript(counting);
  await open(page, url);
  const mounted = await liveCount(page);
  await page.evaluate(() => (window as unknown as { __bcUnmount: () => void }).__bcUnmount());
  return { mounted, gone: await liveCount(page) };
}

// The parts that set up the most around them: a timer, document listeners, media queries and an observer.
const parts = ["countdown", "menu", "date-picker"].filter((slug) => !frameworkParts() || frameworkParts()!.includes(slug));

for (const framework of frameworks) {
  test.describe(`${framework.name}: a component that goes takes its part's set-up with it`, () => {
    test.skip(({ browserName }) => browserName !== "chromium", "What is counted is the same in every browser");
    for (const slug of parts) {
      test(slug, async ({ page, browser }) => {
        const url = targets(slug).find((target) => target.name === framework.name)!.url("default");
        const { mounted, gone } = await afterUnmount(page, url);
        // Something was set up, or there is nothing to check.
        expect(mounted.intervals + mounted.observers + mounted.listeners.length).toBeGreaterThan(0);

        const bare = await browser.newPage();
        const baseline = await afterUnmount(bare, targets("hero").find((target) => target.name === framework.name)!.url("default"));
        await bare.close();
        expect(gone).toEqual(baseline.gone);
      });
    }
  });
}
