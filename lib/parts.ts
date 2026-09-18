// The parts catalogue: what exists, and what is planned (shown as coming, never as available).
// Each part has a name of its own from one family (ship's instruments) plus a plain description.

export type Part = {
  slug: string;
  /** The part's own name, e.g. "Almanac". */
  codename: string;
  /** What it is in plain words, e.g. "Date picker". */
  name: string;
  summary: string;
  pattern: string;
  /** Accent used for this part across the catalogue and its page. */
  accent: string;
  status: "in-stock" | "coming";
};

export const parts: Part[] = [
  {
    slug: "date-picker",
    codename: "Almanac",
    name: "Date picker",
    summary: "One date or a range, typed in your format, with month and year views and earliest/latest dates.",
    pattern: "APG Date Picker Dialog",
    accent: "#e6b24a",
    status: "in-stock",
  },
  {
    slug: "modal",
    codename: "Porthole",
    name: "Modal",
    summary: "Centred dialog or bottom sheet. Focus stays inside, Escape closes, motion respects reduced-motion settings.",
    pattern: "APG Dialog (Modal)",
    accent: "#5ad1c8",
    status: "in-stock",
  },
  {
    slug: "searchable-select",
    codename: "Sextant",
    name: "Searchable select",
    summary: "Type to filter a long list, pick with the keyboard or the mouse, with matches highlighted.",
    pattern: "APG Combobox",
    accent: "#f08a5d",
    status: "in-stock",
  },
  {
    slug: "form",
    codename: "Logbook",
    name: "Form with validation",
    summary: "Your rules, and error messages that say what went wrong and how to fix it.",
    pattern: "Native form + error summary",
    accent: "#9d7bea",
    status: "in-stock",
  },
  {
    slug: "header",
    codename: "Masthead",
    name: "Site header",
    summary: "Logo, links, call to action and a mobile menu that behaves.",
    pattern: "APG Disclosure navigation",
    accent: "#6fc36f",
    status: "in-stock",
  },
  {
    slug: "tabs",
    codename: "Compass",
    name: "Tabs",
    summary: "One area, several panels. Arrow keys move between tabs, in a row or down the side.",
    pattern: "APG Tabs",
    accent: "#5b9cf0",
    status: "in-stock",
  },
  {
    slug: "footer",
    codename: "Keel",
    name: "Site footer",
    summary: "Brand, links, social profiles and the legal line. Plain HTML, no JavaScript.",
    pattern: "Landmark contentinfo",
    accent: "#c08457",
    status: "in-stock",
  },
  {
    slug: "cta",
    codename: "Beacon",
    name: "CTA section",
    summary: "Heading, supporting text and actions. Plain HTML, no JavaScript.",
    pattern: "Landmark section",
    accent: "#ef7ba4",
    status: "in-stock",
  },
];

export const inStock = parts.filter((part) => part.status === "in-stock");
export const partBySlug = (slug: string) => parts.find((part) => part.slug === slug)!;
