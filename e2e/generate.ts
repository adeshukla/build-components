import fs from "node:fs";
import path from "node:path";
import { applyConfig } from "../lib/export";
import { renderCarouselHtml } from "../registry/carousel/vanilla/render";
import { carouselSchema } from "../registry/carousel/schema";
import type { CarouselConfig } from "../registry/carousel/react/carousel";
import { renderCartHtml } from "../registry/cart/vanilla/render";
import { cartSchema } from "../registry/cart/schema";
import type { CartConfig } from "../registry/cart/react/cart";
import { renderCtaHtml } from "../registry/cta/vanilla/render";
import { ctaSchema } from "../registry/cta/schema";
import type { CtaConfig } from "../registry/cta/react/cta";
import { renderFooterHtml } from "../registry/footer/vanilla/render";
import { footerSchema } from "../registry/footer/schema";
import type { FooterConfig } from "../registry/footer/react/footer";
import { renderFormHtml } from "../registry/form/vanilla/render";
import { formSchema } from "../registry/form/schema";
import type { FormConfig } from "../registry/form/react/form";
import { renderHeaderHtml } from "../registry/header/vanilla/render";
import { headerSchema } from "../registry/header/schema";
import type { HeaderConfig } from "../registry/header/react/header";
import { accordionSchema } from "../registry/accordion/schema";
import type { AccordionConfig } from "../registry/accordion/react/accordion";
import { renderAccordionHtml } from "../registry/accordion/vanilla/render";
import { tooltipSchema } from "../registry/tooltip/schema";
import type { TooltipConfig } from "../registry/tooltip/react/tooltip";
import { renderTooltipHtml } from "../registry/tooltip/vanilla/render";
import { menuSchema } from "../registry/menu/schema";
import type { MenuConfig } from "../registry/menu/react/menu";
import { renderMenuHtml } from "../registry/menu/vanilla/render";
import { popoverSchema } from "../registry/popover/schema";
import type { PopoverConfig } from "../registry/popover/react/popover";
import { renderPopoverHtml } from "../registry/popover/vanilla/render";
import { toastSchema } from "../registry/toast/schema";
import type { ToastConfig } from "../registry/toast/react/toast";
import { renderToastHtml } from "../registry/toast/vanilla/render";
import { parseConfig, type Schema } from "../lib/schema";
import { readComponentSources } from "../lib/sources";
import { datePickerSchema } from "../registry/date-picker/schema";
import { renderMegaMenuHtml } from "../registry/mega-menu/vanilla/render";
import { megaMenuSchema } from "../registry/mega-menu/schema";
import type { MegaMenuConfig } from "../registry/mega-menu/react/mega-menu";
import { modalSchema } from "../registry/modal/schema";
import { searchableSelectSchema } from "../registry/searchable-select/schema";
import { renderTabsHtml } from "../registry/tabs/vanilla/render";
import { tabsSchema } from "../registry/tabs/schema";
import type { TabsConfig } from "../registry/tabs/react/tabs";

/** Components under test, with configs written as the same query strings the editor puts in its URL. */
export const components: Record<
  string,
  {
    exportName: string;
    schema: Schema;
    variants: Record<string, string>;
    /** HTML-first components generate their page markup from the options. */
    renderHtml?: (config: Record<string, unknown>) => string;
  }
> = {
  "date-picker": {
    exportName: "DatePicker",
    schema: datePickerSchema,
    variants: {
      default: "",
      range:
        "mode=range&format=YYYY-MM-DD&weekStartsOn=sunday&clearButton=true&todayButton=true&helperText=true&helperTextContent=Check-in+to+check-out&name=stay&minDate=2026-03-05&maxDate=2026-03-25",
    },
  },
  "searchable-select": {
    exportName: "SearchableSelect",
    schema: searchableSelectSchema,
    variants: {
      default: "",
      compact:
        "filter=startsWith&clearButton=true&helperText=true&maxVisible=4&size=sm&label=Fruit&name=fruit&options=%5B%7B%22label%22%3A%22Apple%22%7D%2C%7B%22label%22%3A%22Apricot%22%7D%2C%7B%22label%22%3A%22Banana%22%7D%2C%7B%22label%22%3A%22Blackberry%22%7D%2C%7B%22label%22%3A%22Cherry%22%7D%2C%7B%22label%22%3A%22Fig%22%7D%5D",
    },
  },
  tabs: {
    exportName: "Tabs",
    schema: tabsSchema,
    renderHtml: (config) => renderTabsHtml(config as unknown as TabsConfig),
    variants: {
      default: "",
      manual: "activation=manual&orientation=vertical&look=pill&theme=dark&panelBox=false&stretch=true&size=sm&label=Account",
    },
  },
  cta: {
    exportName: "Cta",
    schema: ctaSchema,
    renderHtml: (config) => renderCtaHtml(config as unknown as CtaConfig),
    variants: {
      default: "",
      plain: "look=plain&layout=left&secondaryButton=false&note=true&theme=dark&spacing=compact&headingLevel=h3&eyebrow=&heading=Book+a+call&primaryText=Choose+a+time&primaryHref=%2Fcall",
      split: "look=card&layout=split&theme=light&heading=Ready+when+you+are",
    },
  },
  footer: {
    exportName: "SiteFooter",
    schema: footerSchema,
    renderHtml: (config) => renderFooterHtml(config as unknown as FooterConfig),
    variants: {
      default: "",
      full: "layout=stacked&social=true&backToTop=true&theme=dark&spacing=compact&topBorder=false&brandText=Harbour&navLabel=More+from+Harbour",
    },
  },
  form: {
    exportName: "ContactForm",
    schema: formSchema,
    renderHtml: (config) => renderFormHtml(config as unknown as FormConfig),
    variants: {
      default: "",
      // A different set of fields entirely: a pattern, a number range, and checks on submit only.
      strict: "fields=%5B%7B%22label%22%3A%20%22Full%20name%22%2C%20%22type%22%3A%20%22text%22%2C%20%22required%22%3A%20%22yes%22%2C%20%22min%22%3A%20%222%22%2C%20%22max%22%3A%20%2260%22%2C%20%22pattern%22%3A%20%22%22%2C%20%22options%22%3A%20%22%22%2C%20%22help%22%3A%20%22%22%7D%2C%20%7B%22label%22%3A%20%22Order%20number%22%2C%20%22type%22%3A%20%22text%22%2C%20%22required%22%3A%20%22yes%22%2C%20%22min%22%3A%20%22%22%2C%20%22max%22%3A%20%22%22%2C%20%22pattern%22%3A%20%22%5E%5BA-Z%5D%7B2%7D-%5C%5Cd%7B4%7D%24%22%2C%20%22options%22%3A%20%22%22%2C%20%22help%22%3A%20%22Two%20letters%2C%20a%20dash%20and%20four%20digits%2C%20like%20AB-1234%22%7D%2C%20%7B%22label%22%3A%20%22Quantity%22%2C%20%22type%22%3A%20%22number%22%2C%20%22required%22%3A%20%22yes%22%2C%20%22min%22%3A%20%221%22%2C%20%22max%22%3A%20%2210%22%2C%20%22pattern%22%3A%20%22%22%2C%20%22options%22%3A%20%22%22%2C%20%22help%22%3A%20%22%22%7D%5D&validateOn=submit&errorSummary=false&marker=required&counter=false&layout=one&title=Report+a+problem",
    },
  },
  header: {
    exportName: "SiteHeader",
    schema: headerSchema,
    renderHtml: (config) => renderHeaderHtml(config as unknown as HeaderConfig),
    variants: {
      default: "",
      wide: "mobileBreakpoint=sm&ctaButton=false&sticky=true&height=compact&theme=dark&skipLink=false&logoText=Harbour",
    },
  },
  cart: {
    exportName: "Cart",
    schema: cartSchema,
    renderHtml: (config) => renderCartHtml(config as unknown as CartConfig),
    variants: {
      default: "",
      drawer: "layout=drawer&currency=USD&quantityStepper=false&shipping=false&taxNote=&theme=dark&title=Your+cart&openText=Cart",
    },
  },
  carousel: {
    exportName: "Carousel",
    schema: carouselSchema,
    renderHtml: (config) => renderCarouselHtml(config as unknown as CarouselConfig),
    variants: {
      default: "",
      auto: "perView=2&autoRotate=true&interval=2&counter=true&dots=false&theme=dark&aspect=1%2F1&label=Case+studies",
      repeat: "loop=true&label=On+repeat",
    },
  },
  "mega-menu": {
    exportName: "MegaMenu",
    schema: megaMenuSchema,
    renderHtml: (config) => renderMegaMenuHtml(config as unknown as MegaMenuConfig),
    variants: {
      default: "",
      wide: "openOn=hover&panel=full&columns=3&descriptions=false&ctaButton=false&theme=dark&logoText=Harbour&label=Primary",
    },
  },
  modal: {
    exportName: "Modal",
    schema: modalSchema,
    variants: {
      default: "",
      sheet:
        "position=bottom&animation=none&closeButton=false&secondaryButton=false&closeOnBackdrop=false&initialFocus=primary&size=lg",
    },
  },
  "accordion": {
    exportName: "Accordion",
    schema: accordionSchema,
    renderHtml: (config) => renderAccordionHtml(config as unknown as AccordionConfig),
    variants: {
      default: "",
      cards: "allowMultiple=true&openFirst=false&icon=plus&look=separated&theme=dark&headingLevel=h2",
    },
  },
  "tooltip": {
    exportName: "Tooltip",
    schema: tooltipSchema,
    renderHtml: (config) => renderTooltipHtml(config as unknown as TooltipConfig),
    variants: {
      default: "",
      icon: "trigger=icon&placement=right&delay=0&arrow=false&theme=dark&triggerText=What+is+this%3F&text=We+use+this+to+work+out+delivery.",
    },
  },
  "menu": {
    exportName: "Menu",
    schema: menuSchema,
    renderHtml: (config) => renderMenuHtml(config as unknown as MenuConfig),
    variants: {
      default: "",
      plain: "typeAhead=false&chevron=false&align=end&theme=dark&buttonText=Options&items=%5B%7B%22label%22%3A%22Rename%22%2C%22href%22%3A%22%22%7D%2C%7B%22label%22%3A%22Download%22%2C%22href%22%3A%22%22%7D%5D",
    },
  },
  "popover": {
    exportName: "Popover",
    schema: popoverSchema,
    renderHtml: (config) => renderPopoverHtml(config as unknown as PopoverConfig),
    variants: {
      default: "",
      sticky: "closeOnOutside=false&placement=right&closeButton=false&secondaryButton=false&theme=dark&triggerText=Filters&heading=Filters&primaryText=Apply&body=Narrow+the+list+to+what+you+need.",
    },
  },
  "toast": {
    exportName: "Toast",
    schema: toastSchema,
    renderHtml: (config) => renderToastHtml(config as unknown as ToastConfig),
    variants: {
      default: "",
      quick: "duration=1&position=top-center&icon=false&actionText=&maxVisible=1&theme=dark",
    },
  },
};

const harnessPage = (slug: string, exportName: string) => `"use client";

import { useEffect, useState } from "react";
import { ${exportName} } from "./${slug}";

// Generated by e2e/generate.ts — test harness for the exported React file.
// data-hydrated tells the tests when React is listening, so no keystroke is typed into a dead page.
export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <main className="p-8" data-hydrated={hydrated ? "true" : undefined}>
      <${exportName} />
    </main>
  );
}
`;

function write(file: string, content: string) {
  // Skip unchanged files so the running dev server doesn't recompile mid-test.
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Writes the exported output for every variant: React into a harness route, vanilla as static files. */
export function generateOutputs() {
  for (const [slug, component] of Object.entries(components)) {
    const sources = readComponentSources(slug);
    for (const [variant, query] of Object.entries(component.variants)) {
      const config = parseConfig(component.schema, new URLSearchParams(query));

      const harness = path.join(process.cwd(), "app/(bare)/harness", `${slug}-${variant}`);
      write(path.join(harness, `${slug}.tsx`), applyConfig(sources.react, config));
      write(path.join(harness, "page.tsx"), harnessPage(slug, component.exportName));

      const vanilla = path.join(process.cwd(), "e2e/.generated", slug, variant);
      write(path.join(vanilla, "index.html"), component.renderHtml ? component.renderHtml(config) : sources.html);
      write(path.join(vanilla, `${slug}.css`), sources.css);
      if (sources.js !== "") write(path.join(vanilla, `${slug}.js`), applyConfig(sources.js, config));
    }
  }
}
