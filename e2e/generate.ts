import fs from "node:fs";
import path from "node:path";
import { applyConfig } from "../lib/export";
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
      plain: "layout=left&secondaryButton=false&note=true&theme=dark&spacing=compact&headingLevel=h3&heading=Book+a+call&primaryText=Choose+a+time&primaryHref=%2Fcall",
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
      strict: "validateOn=submit&errorSummary=false&phoneRequired=true&messageMinLength=0&layout=one&consentField=false&optionalMarker=false",
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
