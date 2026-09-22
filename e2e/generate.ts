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
import { tableSchema } from "../registry/table/schema";
import type { TableConfig } from "../registry/table/react/table";
import { renderTableHtml } from "../registry/table/vanilla/render";
import { paginationSchema } from "../registry/pagination/schema";
import type { PaginationConfig } from "../registry/pagination/react/pagination";
import { renderPaginationHtml } from "../registry/pagination/vanilla/render";
import { breadcrumbsSchema } from "../registry/breadcrumbs/schema";
import type { BreadcrumbsConfig } from "../registry/breadcrumbs/react/breadcrumbs";
import { renderBreadcrumbsHtml } from "../registry/breadcrumbs/vanilla/render";
import { stepperSchema } from "../registry/stepper/schema";
import type { StepperConfig } from "../registry/stepper/react/stepper";
import { renderStepperHtml } from "../registry/stepper/vanilla/render";
import { sidebarSchema } from "../registry/sidebar/schema";
import type { SidebarConfig } from "../registry/sidebar/react/sidebar";
import { renderSidebarHtml } from "../registry/sidebar/vanilla/render";
import { uploadSchema } from "../registry/upload/schema";
import type { UploadConfig } from "../registry/upload/react/upload";
import { renderUploadHtml } from "../registry/upload/vanilla/render";
import { multiSelectSchema } from "../registry/multi-select/schema";
import type { MultiSelectConfig } from "../registry/multi-select/react/multi-select";
import { renderMultiSelectHtml } from "../registry/multi-select/vanilla/render";
import { passwordSchema } from "../registry/password/schema";
import type { PasswordConfig } from "../registry/password/react/password";
import { renderPasswordHtml } from "../registry/password/vanilla/render";
import { otpSchema } from "../registry/otp/schema";
import type { OtpConfig } from "../registry/otp/react/otp";
import { renderOtpHtml } from "../registry/otp/vanilla/render";
import { sliderSchema } from "../registry/slider/schema";
import type { SliderConfig } from "../registry/slider/react/slider";
import { renderSliderHtml } from "../registry/slider/vanilla/render";
import { searchSchema } from "../registry/search/schema";
import type { SearchConfig } from "../registry/search/react/search";
import { renderSearchHtml } from "../registry/search/vanilla/render";
import { timePickerSchema } from "../registry/time-picker/schema";
import type { TimePickerConfig } from "../registry/time-picker/react/time-picker";
import { renderTimePickerHtml } from "../registry/time-picker/vanilla/render";
import { treeViewSchema } from "../registry/tree-view/schema";
import type { TreeViewConfig } from "../registry/tree-view/react/tree-view";
import { renderTreeViewHtml } from "../registry/tree-view/vanilla/render";
import { sortableListSchema } from "../registry/sortable-list/schema";
import type { SortableListConfig } from "../registry/sortable-list/react/sortable-list";
import { renderSortableListHtml } from "../registry/sortable-list/vanilla/render";
import { drawerSchema } from "../registry/drawer/schema";
import type { DrawerConfig } from "../registry/drawer/react/drawer";
import { renderDrawerHtml } from "../registry/drawer/vanilla/render";
import { cookieConsentSchema } from "../registry/cookie-consent/schema";
import type { CookieConsentConfig } from "../registry/cookie-consent/react/cookie-consent";
import { renderCookieConsentHtml } from "../registry/cookie-consent/vanilla/render";
import { cardFieldsSchema } from "../registry/card-fields/schema";
import type { CardFieldsConfig } from "../registry/card-fields/react/card-fields";
import { renderCardFieldsHtml } from "../registry/card-fields/vanilla/render";
import { tourSchema } from "../registry/tour/schema";
import type { TourConfig } from "../registry/tour/react/tour";
import { renderTourHtml } from "../registry/tour/vanilla/render";
import { feedSchema } from "../registry/feed/schema";
import type { FeedConfig } from "../registry/feed/react/feed";
import { renderFeedHtml } from "../registry/feed/vanilla/render";
import { lightboxSchema } from "../registry/lightbox/schema";
import type { LightboxConfig } from "../registry/lightbox/react/lightbox";
import { renderLightboxHtml } from "../registry/lightbox/vanilla/render";
import { resizablePanelsSchema } from "../registry/resizable-panels/schema";
import type { ResizablePanelsConfig } from "../registry/resizable-panels/react/resizable-panels";
import { renderResizablePanelsHtml } from "../registry/resizable-panels/vanilla/render";
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
      summary: "errorSummary=true",
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
  "table": {
    exportName: "Table",
    schema: tableSchema,
    renderHtml: (config) => renderTableHtml(config as unknown as TableConfig),
    variants: {
      default: "",
      plain: "sortable=false&selectable=false&zebra=false&density=compact&theme=dark&small=scroll",
      empty: "data=&emptyText=Nothing%20to%20show%20yet.",
    },
  },
  "pagination": {
    exportName: "Pagination",
    schema: paginationSchema,
    renderHtml: (config) => renderPaginationHtml(config as unknown as PaginationConfig),
    variants: {
      default: "",
      links: "hrefPattern=%2Forders%3Fpage%3D%7Bpage%7D",
      compact: "look=compact&summary=true&theme=dark&prevText=Newer&nextText=Older",
    },
  },
  "breadcrumbs": {
    exportName: "Breadcrumbs",
    schema: breadcrumbsSchema,
    renderHtml: (config) => renderBreadcrumbsHtml(config as unknown as BreadcrumbsConfig),
    variants: {
      default: "",
      plain: "separator=slash&homeIcon=false&collapse=false&theme=dark&label=You+are+here",
    },
  },
  "stepper": {
    exportName: "Stepper",
    schema: stepperSchema,
    renderHtml: (config) => renderStepperHtml(config as unknown as StepperConfig),
    variants: {
      default: "",
      locked: "current=2&linkDone=false&summary=false&marker=dot&orientation=vertical&theme=dark&details=false",
    },
  },
  "sidebar": {
    exportName: "Sidebar",
    schema: sidebarSchema,
    renderHtml: (config) => renderSidebarHtml(config as unknown as SidebarConfig),
    variants: {
      default: "",
      plain: "collapsible=false&badges=false&theme=dark&width=200&activeHref=%2Fteam&label=Admin",
    },
  },
  "upload": {
    exportName: "Upload",
    schema: uploadSchema,
    renderHtml: (config) => renderUploadHtml(config as unknown as UploadConfig),
    variants: {
      default: "",
      small: "multiple=false&maxSizeMb=1&maxFiles=1&accept=.png%2C.jpg&theme=dark&label=Upload+a+photo&hint=PNG+or+JPG%2C+up+to+1+MB.&showSize=false",
    },
  },
  "multi-select": {
    exportName: "MultiSelect",
    schema: multiSelectSchema,
    renderHtml: (config) => renderMultiSelectHtml(config as unknown as MultiSelectConfig),
    variants: {
      default: "",
      capped: "maxSelected=2&clearAll=false&filter=startsWith&theme=dark&label=Colours&hint=Pick+up+to+two.&placeholder=Search+colours&options=%5B%7B%22label%22%3A%20%22Red%22%7D%2C%20%7B%22label%22%3A%20%22Green%22%7D%2C%20%7B%22label%22%3A%20%22Blue%22%7D%2C%20%7B%22label%22%3A%20%22Yellow%22%7D%5D",
    },
  },
  "password": {
    exportName: "Password",
    schema: passwordSchema,
    renderHtml: (config) => renderPasswordHtml(config as unknown as PasswordConfig),
    variants: {
      default: "",
      strict: "minLength=16&requireUpper=true&requireSymbol=true&showMeter=false&theme=dark&label=Choose+a+password&hint=",
    },
  },
  "otp": {
    exportName: "Otp",
    schema: otpSchema,
    renderHtml: (config) => renderOtpHtml(config as unknown as OtpConfig),
    variants: {
      default: "",
      single: "mode=single&allowLetters=true&theme=dark&label=Enter+your+code&hint=Six+characters%2C+letters+or+numbers.&completeText=That+is+the+whole+code.&resendText=",
    },
  },
  "slider": {
    exportName: "Slider",
    schema: sliderSchema,
    renderHtml: (config) => renderSliderHtml(config as unknown as SliderConfig),
    variants: {
      default: "",
      single: "mode=single&min=0&max=100&step=5&startValue=30&prefix=&suffix=%25&label=Volume&hint=&theme=dark",
    },
  },
  "search": {
    exportName: "Search",
    schema: searchSchema,
    renderHtml: (config) => renderSearchHtml(config as unknown as SearchConfig),
    variants: {
      default: "",
      inline: "layout=inline&groups=false&theme=dark&label=Search+the+menu&placeholder=Coffee%2C+cake%2C+anything&data=%5B%7B%22title%22%3A%20%22Coffee%22%2C%20%22items%22%3A%20%5B%7B%22title%22%3A%20%22Oat%20milk%20flat%20white%22%2C%20%22description%22%3A%20%22Double%20shot%2C%20oat%20milk%22%2C%20%22url%22%3A%20%22/menu/flat-white%22%2C%20%22tags%22%3A%20%5B%22dairy%20free%22%5D%7D%2C%20%7B%22title%22%3A%20%22Espresso%22%2C%20%22description%22%3A%20%22Single%20or%20double%22%2C%20%22url%22%3A%20%22/menu/espresso%22%7D%5D%7D%2C%20%7B%22title%22%3A%20%22Food%22%2C%20%22items%22%3A%20%5B%7B%22title%22%3A%20%22Banana%20bread%22%2C%20%22description%22%3A%20%22Toasted%2C%20with%20butter%22%2C%20%22url%22%3A%20%22/menu/banana-bread%22%2C%20%22tags%22%3A%20%5B%22vegetarian%22%5D%7D%5D%7D%5D",
    },
  },
  "time-picker": {
    exportName: "TimePicker",
    schema: timePickerSchema,
    renderHtml: (config) => renderTimePickerHtml(config as unknown as TimePickerConfig),
    variants: {
      default: "",
      twelve: "format=12h&interval=15&startValue=09:30&label=Pickup%20time&hint=&theme=dark",
    },
  },
  "tree-view": {
    exportName: "TreeView",
    schema: treeViewSchema,
    renderHtml: (config) => renderTreeViewHtml(config as unknown as TreeViewConfig),
    variants: {
      default: "",
      open: "startOpen=all&showIcons=false&showSelection=false&label=Sections&theme=dark",
    },
  },
  "sortable-list": {
    exportName: "SortableList",
    schema: sortableListSchema,
    renderHtml: (config) => renderSortableListHtml(config as unknown as SortableListConfig),
    variants: {
      default: "",
      plain: "moveButtons=false&numbered=false&theme=dark",
    },
  },
  "drawer": {
    exportName: "Drawer",
    schema: drawerSchema,
    renderHtml: (config) => renderDrawerHtml(config as unknown as DrawerConfig),
    variants: {
      default: "",
      bottom: "side=bottom&size=lg&secondaryButton=false&theme=dark",
    },
  },
  "cookie-consent": {
    exportName: "CookieConsent",
    schema: cookieConsentSchema,
    renderHtml: (config) => renderCookieConsentHtml(config as unknown as CookieConsentConfig),
    variants: {
      default: "",
      corner: "position=corner&showReopen=false&theme=dark",
    },
  },
  "card-fields": {
    exportName: "CardFields",
    schema: cardFieldsSchema,
    renderHtml: (config) => renderCardFieldsHtml(config as unknown as CardFieldsConfig),
    variants: {
      default: "",
      lean: "showName=false&showPostcode=false&buttonText=Pay%20now&theme=dark",
    },
  },
  "tour": {
    exportName: "Tour",
    schema: tourSchema,
    renderHtml: (config) => renderTourHtml(config as unknown as TourConfig),
    variants: {
      default: "",
      lean: "showProgress=false&theme=dark",
    },
  },
  "feed": {
    exportName: "Feed",
    schema: feedSchema,
    renderHtml: (config) => renderFeedHtml(config as unknown as FeedConfig),
    variants: {
      default: "",
      scroll: "mode=scroll&pageSize=3&theme=dark",
    },
  },
  "lightbox": {
    exportName: "Lightbox",
    schema: lightboxSchema,
    renderHtml: (config) => renderLightboxHtml(config as unknown as LightboxConfig),
    variants: {
      default: "",
      noloop: "loop=false&columns=4&showCaptions=false&theme=dark",
    },
  },
  "resizable-panels": {
    exportName: "ResizablePanels",
    schema: resizablePanelsSchema,
    renderHtml: (config) => renderResizablePanelsHtml(config as unknown as ResizablePanelsConfig),
    variants: {
      default: "",
      vertical: "orientation=vertical&startSize=50&collapsible=false&theme=dark",
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
