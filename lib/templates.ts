import { fullBleed } from "@/lib/parts";
import { registry, type RegistrySlug } from "@/lib/registry";
import { parseConfig } from "@/lib/schema";

/*
 * Templates (D75): whole pages made from the parts in the catalogue. A template is a list of parts, each
 * with the few options the page needs set (an h1 here, a name there), plus what the person chooses: the
 * product name, a brand colour and a theme, given to every part, and which optional sections to keep.
 *
 * Nothing in a template is drawn by hand: every section is a real part, so a template is only as good as
 * its parts, and is tested again as a page (e2e/templates.spec.ts).
 */

export type TemplateOptions = {
  name: string;
  /** Every part's accentColor. */
  brand: string;
  theme: "light" | "dark" | "system";
  /** Which optional sections are on, by slug. */
  sections: string[];
};

type Section = {
  slug: RegistrySlug;
  /** Where it goes: above main, in a side column beside main, in main, or below main. */
  region: "top" | "side" | "main" | "bottom";
  optional?: boolean;
  /** Narrow sections (forms) sit in a reading-width column. */
  narrow?: boolean;
  /** Options the page sets on this part, besides the brand colour and theme. */
  config?: (options: TemplateOptions) => Record<string, unknown>;
};

export type Template = {
  id: string;
  name: string;
  type: "Marketing" | "Shop" | "App" | "Company";
  summary: string;
  sections: Section[];
};

/*
 * Every template tells one story: Northwind (the name the parts use by default) is a tool that keeps a
 * small team's projects in one place. The words are placeholders to replace, and none of them claims a
 * customer, a number or a quote that does not exist.
 */
const links = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];
const header = (extra: Record<string, unknown> = {}): Section => ({
  slug: "header",
  region: "top",
  config: (o) => ({ logoText: o.name, skipLink: true, links, ctaText: "Start free", ctaHref: "/start", ...extra }),
});
const footer: Section = {
  slug: "footer",
  region: "bottom",
  config: (o) => ({
    brandText: o.name,
    tagline: "Every project in one place.",
    links: [...links, { label: "Contact", href: "/contact" }],
    legalText: `© ${o.name}. All rights reserved.`,
  }),
};
/** The page header without the extras its own demo shows. */
const pageHeader = (title: string, lede = ""): Section => ({
  slug: "page-header",
  region: "main",
  config: () => ({ title, lede, showTrail: false, primaryLabel: "", secondaryLabel: "", metaValue: "" }),
});

export const templates: Template[] = [
  {
    id: "landing-page",
    name: "Landing page",
    type: "Marketing",
    summary: "A product's front door: what it is, who trusts it, what it does and a way to start.",
    sections: [
      header(),
      {
        slug: "hero",
        region: "main",
        config: (o) => ({
          headingLevel: "h1",
          eyebrow: "For small teams",
          heading: "Every project in one place",
          copy: `${o.name} keeps your team's tasks, files and decisions together, so nobody has to ask where things are.`,
          primaryText: "Start free",
          primaryHref: "/start",
          secondaryText: "See how it works",
          secondaryHref: "/product",
          note: "No card needed to start.",
          panelLabel: "A screenshot of the product goes here",
        }),
      },
      {
        slug: "feature-grid",
        region: "main",
        optional: true,
        config: () => ({
          heading: "What you get",
          intro: "",
          items: [
            { title: "One list for everything", text: "Tasks, files and notes live together, so the context travels with the work.", glyph: "◆", href: "" },
            { title: "Updates without meetings", text: "A change is written down once, and everyone who needs it hears about it.", glyph: "✦", href: "" },
            { title: "Works from the keyboard", text: "Every action has a shortcut, and every screen works without a mouse.", glyph: "⌘", href: "" },
          ],
        }),
      },
      {
        slug: "how-it-works",
        region: "main",
        optional: true,
        config: () => ({
          heading: "How it works",
          intro: "Three steps, and the first one takes a minute.",
          steps: [
            { title: "Create a project", text: "Name it and invite the people working on it.", meta: "A minute" },
            { title: "Add the work", text: "Paste a list, import a sheet or start from scratch.", meta: "Ten minutes" },
            { title: "Get going", text: "Everyone sees what is theirs and what comes next.", meta: "Today" },
          ],
        }),
      },
      {
        slug: "cta",
        region: "main",
        optional: true,
        config: (o) => ({
          headingLevel: "h2",
          eyebrow: "",
          heading: `Try ${o.name} free`,
          body: "Bring one project and see whether it fits. No card needed.",
          primaryText: "Start free",
          primaryHref: "/start",
          secondaryText: "Talk to us",
          secondaryHref: "/contact",
          noteText: "We reply to every message within two working days.",
        }),
      },
      footer,
    ],
  },
  {
    id: "pricing-page",
    name: "Pricing page",
    type: "Marketing",
    summary: "Plans side by side with a monthly or yearly switch, the questions people ask, and a way in.",
    sections: [
      header(),
      pageHeader("Pricing", "Start free, then pick the plan that fits your team. Change or cancel whenever you like."),
      { slug: "pricing-table", region: "main" },
      {
        slug: "faq",
        region: "main",
        optional: true,
        config: () => ({
          heading: "Questions about plans",
          intro: "",
          items: [
            { question: "Can I change plans later?", answer: "Yes. Move up or down whenever you like; the difference is worked out to the day." },
            { question: "What happens to my data if I leave?", answer: "Export everything first. We delete it thirty days after the account is closed." },
            { question: "Is there a contract?", answer: "No. Pay by the month or the year, and stop whenever you want." },
          ],
        }),
      },
      {
        slug: "cta",
        region: "main",
        optional: true,
        config: (o) => ({
          headingLevel: "h2",
          eyebrow: "",
          heading: `Still deciding? Talk to ${o.name}`,
          body: "Tell us what your team needs and we will reply within two working days.",
          primaryText: "Get in touch",
          primaryHref: "/contact",
          secondaryButton: false,
          note: false,
        }),
      },
      footer,
    ],
  },
  {
    id: "checkout",
    name: "Checkout",
    type: "Shop",
    summary: "Where the order is up to, the address and card, and what it all costs, in that order.",
    sections: [
      header({ ctaButton: false }),
      pageHeader("Checkout"),
      { slug: "stepper", region: "main", narrow: true },
      { slug: "address-fields", region: "main", narrow: true },
      { slug: "card-fields", region: "main", narrow: true },
      { slug: "invoice-summary", region: "main", narrow: true, optional: true },
      footer,
    ],
  },
  {
    id: "dashboard",
    name: "Dashboard",
    type: "App",
    summary: "An app's home: a sidebar, the numbers that matter, the latest rows and what needs attention.",
    sections: [
      header({ ctaButton: false }),
      { slug: "sidebar", region: "side" },
      pageHeader("Overview"),
      { slug: "stats-tiles", region: "main" },
      { slug: "table", region: "main" },
      { slug: "notification-list", region: "main", optional: true },
    ],
  },
  {
    id: "contact",
    name: "Contact page",
    type: "Company",
    summary: "A form that says what went wrong and how to fix it, and the answers people look for first.",
    sections: [
      header(),
      pageHeader("Contact us", "Questions, problems or ideas: we reply to every message within two working days."),
      { slug: "form", region: "main", narrow: true, config: () => ({ title: "Send us a message", intro: "" }) },
      {
        slug: "faq",
        region: "main",
        optional: true,
        narrow: true,
        config: () => ({
          heading: "Before you write",
          intro: "",
          items: [
            { question: "Where do I report a bug?", answer: "Here is fine. Say what you did, what you expected and what happened instead." },
            { question: "Can I change my plan by email?", answer: "Yes, or from the billing page, which takes effect straight away." },
          ],
        }),
      },
      footer,
    ],
  },
  {
    id: "help-centre",
    name: "Help centre",
    type: "Company",
    summary: "Search the answers first, the common questions next, and a person when neither helps.",
    sections: [
      header(),
      pageHeader("Help centre", "Search the answers, or browse the questions people ask most."),
      {
        slug: "search",
        region: "main",
        narrow: true,
        config: () => ({
          label: "Search the help centre",
          placeholder: "Billing, invites, exporting…",
          data: JSON.stringify({
            title: "Help",
            children: [
              { title: "Getting started", children: [{ title: "Create your first project" }, { title: "Invite your team" }] },
              { title: "Billing", children: [{ title: "Change your plan" }, { title: "Download an invoice" }] },
              { title: "Your data", children: [{ title: "Export a project" }, { title: "Close your account" }] },
            ],
          }),
        }),
      },
      {
        slug: "faq",
        region: "main",
        narrow: true,
        config: () => ({
          heading: "Common questions",
          intro: "",
          items: [
            { question: "How do I invite someone?", answer: "Open the project, choose Invite and type their email address." },
            { question: "Can I undo a deleted task?", answer: "Yes, for thirty days: it waits in the bin at the foot of the project." },
            { question: "Does it work offline?", answer: "You can read everything offline; changes are saved when you reconnect." },
          ],
        }),
      },
      {
        slug: "cta",
        region: "main",
        optional: true,
        config: () => ({
          headingLevel: "h2",
          eyebrow: "",
          heading: "Still stuck? Ask a person",
          body: "Write to us and someone who works here will reply within two working days.",
          primaryText: "Contact us",
          primaryHref: "/contact",
          secondaryButton: false,
          note: false,
        }),
      },
      footer,
    ],
  },
  {
    id: "changelog",
    name: "Changelog",
    type: "Company",
    summary: "What changed in each release, grouped by kind, and a way to hear about the next one.",
    sections: [
      header(),
      pageHeader("What's new", "Every change worth knowing about, newest first."),
      { slug: "changelog", region: "main", narrow: true, config: () => ({ heading: "Releases", headingLevel: "h2" }) },
      { slug: "newsletter", region: "main", optional: true, narrow: true, config: () => ({ heading: "Hear about the next release" }) },
      footer,
    ],
  },
  {
    id: "about",
    name: "About page",
    type: "Company",
    summary: "Why the product exists, who makes it and a way to get in touch.",
    sections: [
      header(),
      pageHeader("About", "Why we make this, and who we are."),
      {
        slug: "split-feature",
        region: "main",
        config: (o) => ({
          heading: `Why ${o.name} exists`,
          headingLevel: "h2",
          body: "Small teams lose hours asking where things are. We make one place for the work, the files and the decisions, so they don't have to.",
        }),
      },
      { slug: "team-grid", region: "main", optional: true, config: () => ({ heading: "The people behind it", intro: "" }) },
      {
        slug: "cta",
        region: "main",
        optional: true,
        config: () => ({
          headingLevel: "h2",
          eyebrow: "",
          heading: "Want to work with us?",
          body: "Tell us about yourself. We read everything.",
          primaryText: "Get in touch",
          primaryHref: "/contact",
          secondaryButton: false,
          note: false,
        }),
      },
      footer,
    ],
  },
  {
    id: "not-found",
    name: "Page not found",
    type: "Company",
    summary: "A 404 that says what happened in plain words and offers the way back.",
    sections: [
      header(),
      {
        slug: "empty-state",
        region: "main",
        narrow: true,
        config: () => ({
          headingLevel: "h1",
          icon: "search",
          title: "We can't find that page",
          body: "It may have moved, or the link may be mistyped. Try the home page, or tell us what you were looking for.",
          actionText: "Go to the home page",
          actionUrl: "/",
          secondaryText: "Contact us",
          secondaryUrl: "/contact",
        }),
      },
      footer,
    ],
  },
];

export const templateById = (id: string) => templates.find((template) => template.id === id);

export const defaultOptions = (template: Template): TemplateOptions => ({
  name: "Northwind",
  brand: "#2563eb",
  theme: "light",
  sections: template.sections.filter((section) => section.optional).map((section) => section.slug),
});

/** The sections that are on, each with its whole config: the part's defaults, the page's, the person's. */
export function resolve(template: Template, options: TemplateOptions) {
  return template.sections
    .filter((section) => !section.optional || options.sections.includes(section.slug))
    .map((section) => ({
      ...section,
      bleed: fullBleed.includes(section.slug) || section.slug === "page-header",
      config: {
        ...parseConfig(registry[section.slug].schema, new URLSearchParams()),
        ...section.config?.(options),
        accentColor: options.brand,
        theme: options.theme,
      } as Record<string, unknown>,
    }));
}

/** Options from an address bar: the editor writes them there, and the preview and registry read them. */
export function optionsFromParams(template: Template, params: URLSearchParams): TemplateOptions {
  const fallback = defaultOptions(template);
  const theme = params.get("theme");
  const brand = params.get("brand");
  const sections = params.get("sections");
  return {
    name: (params.get("name") ?? "").trim().slice(0, 40) || fallback.name,
    brand: brand && /^#[0-9a-f]{6}$/i.test(brand) ? brand : fallback.brand,
    theme: theme === "dark" || theme === "system" ? theme : "light",
    sections: sections === null ? fallback.sections : sections.split(",").filter((slug) => fallback.sections.includes(slug)),
  };
}

export function optionsToParams(options: TemplateOptions) {
  return new URLSearchParams({
    name: options.name,
    brand: options.brand,
    theme: options.theme,
    sections: options.sections.join(","),
  });
}
