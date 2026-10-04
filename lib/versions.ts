import type { RegistrySlug } from "@/lib/registry";

/*
 * Every part has a version (D90), so someone who copied it can tell what has changed since. The version is
 * stamped on the first line of every file a part gives out (lib/sources.ts), and the part page lists the
 * changes. Numbers are worked out from the history: something added is a minor step, a fix a patch.
 *
 * When a change alters what a part gives out, add it here, with the day it was made.
 */
export type Change = { date: string; kind: "first" | "added" | "fixed"; note: string };
export type VersionedChange = Change & { version: string };

/** What was live on build-components.devstash.me when versions began. */
const shipped: Change = { date: "2026-10-03", kind: "first", note: "As it was on the site when versions began." };

/** The site theme (D87), which every part shipped by then gained. */
const themed: Change = {
  date: "2026-10-04",
  kind: "added",
  note: "Takes the site theme when a page has one: colours, corners, body font, and the page's own light or dark choice.",
};

/** Parts first released after versions began. */
const firstReleased: Partial<Record<RegistrySlug, string>> = {
  "text-section": "2026-10-04",
  "picture-section": "2026-10-04",
  testimonials: "2026-10-04",
  "contact-details": "2026-10-04",
  "post-list": "2026-10-04",
  "announcement-bar": "2026-10-04",
};

/** Changes to one part, oldest first. On a day the theme arrived, they came after it. */
const own: Partial<Record<RegistrySlug, Change[]>> = {
  "video-embed": [{ date: "2026-10-03", kind: "added", note: "A YouTube or Vimeo link plays as it is copied." }],
  hero: [{ date: "2026-10-03", kind: "added", note: "A picture option: set, it shows in place of the drawn panel." }],
  header: [{ date: "2026-10-04", kind: "added", note: "A light and dark switch for visitors, remembered between visits." }],
  "feature-grid": [{ date: "2026-10-04", kind: "fixed", note: "Two items with the same title no longer break the React output." }],
  "notification-list": [{ date: "2026-10-04", kind: "fixed", note: "Two items with the same title no longer break the React output or share a read state." }],
  toolbar: [{ date: "2026-10-04", kind: "fixed", note: "Two buttons with the same label no longer break the React output." }],
};

/** A part's changes with their version numbers, newest first. */
export function changesOf(slug: RegistrySlug): VersionedChange[] {
  const released = firstReleased[slug];
  const start = released ? [{ date: released, kind: "first" as const, note: "" }] : [shipped, themed];
  // A stable sort: the theme, listed first, stays ahead of a part's own change on the same day.
  const history = [...start, ...(own[slug] ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  let [minor, patch] = [0, 0];
  const versioned = history.map((change) => {
    if (change.kind === "added") [minor, patch] = [minor + 1, 0];
    if (change.kind === "fixed") patch += 1;
    return { ...change, version: `1.${minor}.${patch}` };
  });
  return versioned.reverse();
}

export const versionOf = (slug: RegistrySlug) => changesOf(slug)[0].version;
