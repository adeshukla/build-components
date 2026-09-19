// One place that knows every component: the registry route, the generic part page, the preview
// frame and the editor all read this map. Adding a component means adding one entry here.
import type { KeyboardRow } from "@/components/editor";
import type { Schema } from "@/lib/schema";

import { carouselSchema } from "@/registry/carousel/schema";
import * as carouselDocs from "@/registry/carousel/docs";
import { renderCarouselHtml } from "@/registry/carousel/vanilla/render";
import { cartSchema } from "@/registry/cart/schema";
import * as cartDocs from "@/registry/cart/docs";
import { renderCartHtml } from "@/registry/cart/vanilla/render";
import { ctaSchema } from "@/registry/cta/schema";
import * as ctaDocs from "@/registry/cta/docs";
import { renderCtaHtml } from "@/registry/cta/vanilla/render";
import { datePickerSchema } from "@/registry/date-picker/schema";
import * as datePickerDocs from "@/registry/date-picker/docs";
import { footerSchema } from "@/registry/footer/schema";
import * as footerDocs from "@/registry/footer/docs";
import { renderFooterHtml } from "@/registry/footer/vanilla/render";
import { formSchema } from "@/registry/form/schema";
import * as formDocs from "@/registry/form/docs";
import { renderFormHtml } from "@/registry/form/vanilla/render";
import { headerSchema } from "@/registry/header/schema";
import * as headerDocs from "@/registry/header/docs";
import { renderHeaderHtml } from "@/registry/header/vanilla/render";
import { megaMenuSchema } from "@/registry/mega-menu/schema";
import * as megaMenuDocs from "@/registry/mega-menu/docs";
import { renderMegaMenuHtml } from "@/registry/mega-menu/vanilla/render";
import { modalSchema } from "@/registry/modal/schema";
import * as modalDocs from "@/registry/modal/docs";
import { searchableSelectSchema } from "@/registry/searchable-select/schema";
import * as searchableSelectDocs from "@/registry/searchable-select/docs";
import { tabsSchema } from "@/registry/tabs/schema";
import * as tabsDocs from "@/registry/tabs/docs";
import { renderTabsHtml } from "@/registry/tabs/vanilla/render";

export type RegistryEntry = {
  title: string;
  description: string;
  schema: Schema;
  keyboard: KeyboardRow[];
  checklist: string[];
  /** HTML-first components generate their markup from the options. */
  renderHtml?: (config: Record<string, unknown>) => string;
};

export const registry = {
  carousel: {
    title: "Carousel",
    description: "An accessible carousel (WAI-ARIA carousel pattern) that scrolls, swipes and steps.",
    schema: carouselSchema,
    ...carouselDocs,
    renderHtml: (config) => renderCarouselHtml(config as never),
  },
  cart: {
    title: "Basket",
    description: "A shopping basket: lines, quantities, delivery and totals, as a panel or a drawer.",
    schema: cartSchema,
    ...cartDocs,
    renderHtml: (config) => renderCartHtml(config as never),
  },
  cta: {
    title: "CTA section",
    description: "A call-to-action section: heading, supporting text and actions. Plain HTML, no JavaScript.",
    schema: ctaSchema,
    ...ctaDocs,
    renderHtml: (config) => renderCtaHtml(config as never),
  },
  "date-picker": {
    title: "Date picker",
    description: "Accessible date picker (WAI-ARIA dialog + grid) with single or range selection.",
    schema: datePickerSchema,
    ...datePickerDocs,
  },
  footer: {
    title: "Site footer",
    description: "A site footer with links, social profiles and a legal line. Plain HTML, no JavaScript.",
    schema: footerSchema,
    ...footerDocs,
    renderHtml: (config) => renderFooterHtml(config as never),
  },
  form: {
    title: "Form with validation",
    description: "A form whose fields and rules are yours to set, with messages that say how to fix each problem.",
    schema: formSchema,
    ...formDocs,
    renderHtml: (config) => renderFormHtml(config as never),
  },
  header: {
    title: "Site header",
    description: "A site header with links, a call to action and a small-screen menu (APG disclosure navigation).",
    schema: headerSchema,
    ...headerDocs,
    renderHtml: (config) => renderHeaderHtml(config as never),
  },
  "mega-menu": {
    title: "Mega menu",
    description: "A mega menu: columns of links under each heading, and one step at a time on a phone.",
    schema: megaMenuSchema,
    ...megaMenuDocs,
    renderHtml: (config) => renderMegaMenuHtml(config as never),
  },
  modal: {
    title: "Modal",
    description: "Accessible modal dialog (WAI-ARIA dialog pattern) with title, body and actions.",
    schema: modalSchema,
    ...modalDocs,
  },
  "searchable-select": {
    title: "Searchable select",
    description: "Accessible combobox (WAI-ARIA combobox with list autocomplete) that filters as you type.",
    schema: searchableSelectSchema,
    ...searchableSelectDocs,
  },
  tabs: {
    title: "Tabs",
    description: "Accessible tabs (WAI-ARIA tabs pattern) with automatic or manual activation.",
    schema: tabsSchema,
    ...tabsDocs,
    renderHtml: (config) => renderTabsHtml(config as never),
  },
} satisfies Record<string, RegistryEntry>;

export type RegistrySlug = keyof typeof registry;
export const isRegistrySlug = (slug: string): slug is RegistrySlug => Object.hasOwn(registry, slug);
