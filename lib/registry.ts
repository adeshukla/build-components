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
import { accordionSchema } from "@/registry/accordion/schema";
import * as accordionDocs from "@/registry/accordion/docs";
import { renderAccordionHtml } from "@/registry/accordion/vanilla/render";
import { tooltipSchema } from "@/registry/tooltip/schema";
import * as tooltipDocs from "@/registry/tooltip/docs";
import { renderTooltipHtml } from "@/registry/tooltip/vanilla/render";
import { menuSchema } from "@/registry/menu/schema";
import * as menuDocs from "@/registry/menu/docs";
import { renderMenuHtml } from "@/registry/menu/vanilla/render";
import { popoverSchema } from "@/registry/popover/schema";
import * as popoverDocs from "@/registry/popover/docs";
import { renderPopoverHtml } from "@/registry/popover/vanilla/render";
import { toastSchema } from "@/registry/toast/schema";
import * as toastDocs from "@/registry/toast/docs";
import { renderToastHtml } from "@/registry/toast/vanilla/render";
import { tableSchema } from "@/registry/table/schema";
import * as tableDocs from "@/registry/table/docs";
import { renderTableHtml } from "@/registry/table/vanilla/render";
import { paginationSchema } from "@/registry/pagination/schema";
import * as paginationDocs from "@/registry/pagination/docs";
import { renderPaginationHtml } from "@/registry/pagination/vanilla/render";
import { breadcrumbsSchema } from "@/registry/breadcrumbs/schema";
import * as breadcrumbsDocs from "@/registry/breadcrumbs/docs";
import { renderBreadcrumbsHtml } from "@/registry/breadcrumbs/vanilla/render";
import { stepperSchema } from "@/registry/stepper/schema";
import * as stepperDocs from "@/registry/stepper/docs";
import { renderStepperHtml } from "@/registry/stepper/vanilla/render";
import { sidebarSchema } from "@/registry/sidebar/schema";
import * as sidebarDocs from "@/registry/sidebar/docs";
import { renderSidebarHtml } from "@/registry/sidebar/vanilla/render";
import { uploadSchema } from "@/registry/upload/schema";
import * as uploadDocs from "@/registry/upload/docs";
import { renderUploadHtml } from "@/registry/upload/vanilla/render";
import { multiSelectSchema } from "@/registry/multi-select/schema";
import * as multiSelectDocs from "@/registry/multi-select/docs";
import { renderMultiSelectHtml } from "@/registry/multi-select/vanilla/render";
import { passwordSchema } from "@/registry/password/schema";
import * as passwordDocs from "@/registry/password/docs";
import { renderPasswordHtml } from "@/registry/password/vanilla/render";
import { otpSchema } from "@/registry/otp/schema";
import * as otpDocs from "@/registry/otp/docs";
import { renderOtpHtml } from "@/registry/otp/vanilla/render";
import { sliderSchema } from "@/registry/slider/schema";
import * as sliderDocs from "@/registry/slider/docs";
import { renderSliderHtml } from "@/registry/slider/vanilla/render";

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
  "accordion": {
    title: "Accordion",
    description: "An accessible accordion (WAI-ARIA accordion pattern) with headings, one or many open at a time.",
    schema: accordionSchema,
    ...accordionDocs,
    renderHtml: (config) => renderAccordionHtml(config as never),
  },
  "tooltip": {
    title: "Tooltip",
    description: "An accessible tooltip (WAI-ARIA tooltip pattern) that opens on hover and on focus.",
    schema: tooltipSchema,
    ...tooltipDocs,
    renderHtml: (config) => renderTooltipHtml(config as never),
  },
  "menu": {
    title: "Dropdown menu",
    description: "An accessible dropdown menu (WAI-ARIA menu button pattern) with arrow keys and type-ahead.",
    schema: menuSchema,
    ...menuDocs,
    renderHtml: (config) => renderMenuHtml(config as never),
  },
  "popover": {
    title: "Popover",
    description: "An accessible popover: an anchored panel that takes focus, closes on Escape and returns it.",
    schema: popoverSchema,
    ...popoverDocs,
    renderHtml: (config) => renderPopoverHtml(config as never),
  },
  "toast": {
    title: "Notifications",
    description: "Accessible notification messages: a live region that is already in the page, with pause and close.",
    schema: toastSchema,
    ...toastDocs,
    renderHtml: (config) => renderToastHtml(config as never),
  },
  "table": {
    title: "Data table",
    description: "An accessible data table: sortable columns, row selection and a phone layout that still reads.",
    schema: tableSchema,
    ...tableDocs,
    renderHtml: (config) => renderTableHtml(config as never),
  },
  "pagination": {
    title: "Pagination",
    description: "Accessible pagination: named navigation, a current page that says so, and gaps that are never controls.",
    schema: paginationSchema,
    ...paginationDocs,
    renderHtml: (config) => renderPaginationHtml(config as never),
  },
  "breadcrumbs": {
    title: "Breadcrumbs",
    description: "An accessible breadcrumb trail: named navigation, a current page that is not a link, no script.",
    schema: breadcrumbsSchema,
    ...breadcrumbsDocs,
    renderHtml: (config) => renderBreadcrumbsHtml(config as never),
  },
  "stepper": {
    title: "Stepper",
    description: "An accessible progress stepper: named flow, states in words, finished steps you can go back to.",
    schema: stepperSchema,
    ...stepperDocs,
    renderHtml: (config) => renderStepperHtml(config as never),
  },
  "sidebar": {
    title: "Sidebar navigation",
    description: "An accessible sidebar: sections as headings, aria-current on the page you are on, a drawer on a phone.",
    schema: sidebarSchema,
    ...sidebarDocs,
    renderHtml: (config) => renderSidebarHtml(config as never),
  },
  "upload": {
    title: "File upload",
    description: "An accessible file upload: a real file input, a drop shortcut, and checks that say which file and why.",
    schema: uploadSchema,
    ...uploadDocs,
    renderHtml: (config) => renderUploadHtml(config as never),
  },
  "multi-select": {
    title: "Multi-select",
    description: "An accessible multi-select combobox: virtual focus, removable choices, live counts.",
    schema: multiSelectSchema,
    ...multiSelectDocs,
    renderHtml: (config) => renderMultiSelectHtml(config as never),
  },
  "password": {
    title: "Password field",
    description: "An accessible password field: rules described with the field, strength in words, caps-lock warning.",
    schema: passwordSchema,
    ...passwordDocs,
    renderHtml: (config) => renderPasswordHtml(config as never),
  },
  "otp": {
    title: "One-time code",
    description: "An accessible one-time code field: a labelled group, boxes that name themselves, paste across boxes.",
    schema: otpSchema,
    ...otpDocs,
    renderHtml: (config) => renderOtpHtml(config as never),
  },
  "slider": {
    title: "Range slider",
    description: "An accessible slider: native range inputs, a two-ended range that cannot cross, values read with their unit.",
    schema: sliderSchema,
    ...sliderDocs,
    renderHtml: (config) => renderSliderHtml(config as never),
  },
} satisfies Record<string, RegistryEntry>;

export type RegistrySlug = keyof typeof registry;
export const isRegistrySlug = (slug: string): slug is RegistrySlug => Object.hasOwn(registry, slug);
