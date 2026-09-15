// The parts catalogue: what exists, and what is planned (shown as coming, never as available).

export type Part = {
  slug: string;
  partNumber: string;
  name: string;
  summary: string;
  pattern: string;
  status: "in-stock" | "coming";
};

export const parts: Part[] = [
  {
    slug: "date-picker",
    partNumber: "BC-DP01",
    name: "Date picker",
    summary: "One date or a range, typed in your format, with month and year views and earliest/latest dates.",
    pattern: "APG Date Picker Dialog",
    status: "in-stock",
  },
  {
    slug: "modal",
    partNumber: "BC-MD01",
    name: "Modal",
    summary: "Centred dialog or bottom sheet. Focus stays inside, Escape closes, motion respects reduced-motion settings.",
    pattern: "APG Dialog (Modal)",
    status: "in-stock",
  },
  {
    slug: "searchable-select",
    partNumber: "BC-SS01",
    name: "Searchable select",
    summary: "Type to filter a long list, pick with keyboard or mouse.",
    pattern: "APG Combobox",
    status: "coming",
  },
  {
    slug: "form",
    partNumber: "BC-FM01",
    name: "Form with validation",
    summary: "Your rules, and error messages that say what went wrong and how to fix it.",
    pattern: "Native form + error summary",
    status: "coming",
  },
  {
    slug: "header",
    partNumber: "BC-HD01",
    name: "Header",
    summary: "Site header with logo, links, call to action and a mobile menu.",
    pattern: "APG Disclosure navigation",
    status: "coming",
  },
  {
    slug: "cta",
    partNumber: "BC-CT01",
    name: "CTA section",
    summary: "Heading, supporting text and actions. Plain HTML, no JavaScript.",
    pattern: "Landmark section",
    status: "coming",
  },
];

export const inStock = parts.filter((part) => part.status === "in-stock");
export const partBySlug = (slug: string) => parts.find((part) => part.slug === slug)!;
