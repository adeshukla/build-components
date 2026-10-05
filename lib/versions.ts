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
  "product-grid": "2026-10-05",
};

/** Changes to one part, oldest first. On a day the theme arrived, they came after it. */
const own: Partial<Record<RegistrySlug, Change[]>> = {
  "video-embed": [{ date: "2026-10-03", kind: "added", note: "A YouTube or Vimeo link plays as it is copied." }],
  hero: [{ date: "2026-10-03", kind: "added", note: "A picture option: set, it shows in place of the drawn panel." }],
  header: [{ date: "2026-10-04", kind: "added", note: "A light and dark switch for visitors, remembered between visits." }],
  "feature-grid": [{ date: "2026-10-04", kind: "fixed", note: "Two items with the same title no longer break the React output." }],
  "notification-list": [{ date: "2026-10-04", kind: "fixed", note: "Two items with the same title no longer break the React output or share a read state." }],
  toolbar: [{ date: "2026-10-04", kind: "fixed", note: "Two buttons with the same label no longer break the React output." }],
  "product-card": [{ date: "2026-10-05", kind: "added", note: "A heading level option, so on a product's own page its name is the h1." }],
  form: [{ date: "2026-10-05", kind: "added", note: "A Send to option: the form posts its fields there, says while it is sending, and says so if it did not arrive." }],
  newsletter: [{ date: "2026-10-05", kind: "added", note: "A Send to option: the sign-up is posted there, and it says so if it did not arrive." }],
  "text-section": [{ date: "2026-10-05", kind: "fixed", note: "Its link is a 44px target, not 21px." }],
  cart: [{ date: "2026-10-05", kind: "fixed", note: "In the HTML/CSS/JS output, the item count in the heading now changes with the basket." }],
};

/** Parts that did not mirror in a right-to-left page until D93 (e2e/rtl.spec.ts found them). */
const mirrored: RegistrySlug[] = [
  "alert-banner",
  "avatar-group",
  "back-to-top",
  "changelog",
  "code-block",
  "comment-thread",
  "comparison-table",
  "cta",
  "data-grid",
  "dual-slider",
  "header",
  "hover-card",
  "mega-menu",
  "notification-list",
  "order-tracker",
  "pricing-table",
  "pull-quote",
  "slider",
  "sticky-header",
  "switch",
  "table",
  "tag-input",
  "tree-view",
];
/** Parts whose scripts read the arrow keys: in a right-to-left page, Left now goes forward (D93). */
const sidewaysKeys: RegistrySlug[] = ["data-grid", "date-picker", "lightbox", "menu-bar", "otp", "resizable-panels", "tabs", "toolbar", "tree-view"];
const rtlKeys: Change = { date: "2026-10-04", kind: "fixed", note: "In a right-to-left page the Left and Right arrow keys swap, as the layout does." };
const rtlFix: Change = { date: "2026-10-04", kind: "fixed", note: "Mirrors in a right-to-left page (Arabic, Hebrew, Persian, Urdu)." };

/** Parts that say something by themselves: every such word became an option (D94), so they speak any language. */
const worded: RegistrySlug[] = [
  "address-fields",
  "alert-banner",
  "announcement-bar",
  "article-card",
  "author-byline",
  "autosave-field",
  "avatar-group",
  "bottom-sheet",
  "card-fields",
  "carousel",
  "cart",
  "changelog",
  "checkbox-group",
  "code-block",
  "color-picker",
  "command-menu",
  "comment-thread",
  "comparison-table",
  "confirm-dialog",
  "contact-details",
  "cookie-consent",
  "countdown",
  "currency-input",
  "cursor-pagination",
  "data-grid",
  "date-picker",
  "date-range",
  "drawer",
  "dual-slider",
  "error-summary",
  "faq",
  "feature-grid",
  "feed",
  "filter-bar",
  "form",
  "header",
  "inline-edit",
  "invoice-summary",
  "kanban",
  "lightbox",
  "maintenance-notice",
  "masked-input",
  "modal",
  "multi-select",
  "newsletter",
  "notification-list",
  "offline-banner",
  "order-tracker",
  "otp",
  "page-header",
  "pagination",
  "password",
  "phone-input",
  "picture-section",
  "pin-pad",
  "popover",
  "post-list",
  "pricing-table",
  "product-card",
  "quantity",
  "radio-cards",
  "rating",
  "reading-progress",
  "search",
  "searchable-select",
  "select-field",
  "session-timeout",
  "shortcut-help",
  "sidebar",
  "signature-pad",
  "skip-links",
  "slider",
  "slot-picker",
  "sortable-list",
  "stat-comparison",
  "stepper",
  "sticky-header",
  "switch",
  "table",
  "tag-input",
  "textarea-counter",
  "time-picker",
  "time-range",
  "timeline",
  "toast",
  "toggle-group",
  "toolbar",
  "tour",
  "tree-view",
  "unit-input",
  "unsaved-changes",
  "upload",
  "wizard",
];
const words: Change = { date: "2026-10-05", kind: "added", note: "Every word it says by itself is an option (the Words group), so it can speak your page's language; the editor fills them in for ten languages." };

/** A part's changes with their version numbers, newest first. */
export function changesOf(slug: RegistrySlug): VersionedChange[] {
  const released = firstReleased[slug];
  const start = released ? [{ date: released, kind: "first" as const, note: "" }] : [shipped, themed];
  // A stable sort: the theme, listed first, stays ahead of a part's own change on the same day.
  const history = [...start, ...(own[slug] ?? []), ...(mirrored.includes(slug) ? [rtlFix] : []), ...(sidewaysKeys.includes(slug) ? [rtlKeys] : []), ...(worded.includes(slug) ? [words] : [])].sort((a, b) => a.date.localeCompare(b.date));
  let [minor, patch] = [0, 0];
  const versioned = history.map((change) => {
    if (change.kind === "added") [minor, patch] = [minor + 1, 0];
    if (change.kind === "fixed") patch += 1;
    return { ...change, version: `1.${minor}.${patch}` };
  });
  return versioned.reverse();
}

export const versionOf = (slug: RegistrySlug) => changesOf(slug)[0].version;
