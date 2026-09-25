"use client";

import { demos, type DemoStep } from "@/lib/demos";
import { fullBleed } from "@/lib/parts";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Carousel, type CarouselConfig } from "@/registry/carousel/react/carousel";
import { Cart, type CartConfig } from "@/registry/cart/react/cart";
import { Cta, type CtaConfig } from "@/registry/cta/react/cta";
import { DatePicker, type DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { SiteFooter as FooterPart, type FooterConfig } from "@/registry/footer/react/footer";
import { ContactForm, type FormConfig } from "@/registry/form/react/form";
import { SiteHeader as HeaderPart, type HeaderConfig } from "@/registry/header/react/header";
import { MegaMenu, type MegaMenuConfig } from "@/registry/mega-menu/react/mega-menu";
import { Modal, type ModalAction, type ModalConfig } from "@/registry/modal/react/modal";
import { SearchableSelect, type SearchableSelectConfig } from "@/registry/searchable-select/react/searchable-select";
import { Tabs, type TabsConfig } from "@/registry/tabs/react/tabs";

import { Accordion, type AccordionConfig } from "@/registry/accordion/react/accordion";

import { Tooltip, type TooltipConfig } from "@/registry/tooltip/react/tooltip";

import { Menu, type MenuConfig } from "@/registry/menu/react/menu";

import { Popover, type PopoverConfig } from "@/registry/popover/react/popover";

import { Toast, type ToastConfig } from "@/registry/toast/react/toast";

import { Table, type TableConfig } from "@/registry/table/react/table";

import { Pagination, type PaginationConfig } from "@/registry/pagination/react/pagination";

import { Breadcrumbs, type BreadcrumbsConfig } from "@/registry/breadcrumbs/react/breadcrumbs";

import { Stepper, type StepperConfig } from "@/registry/stepper/react/stepper";

import { Sidebar, type SidebarConfig } from "@/registry/sidebar/react/sidebar";

import { Upload, type UploadConfig } from "@/registry/upload/react/upload";

import { MultiSelect, type MultiSelectConfig } from "@/registry/multi-select/react/multi-select";

import { Password, type PasswordConfig } from "@/registry/password/react/password";

import { Otp, type OtpConfig } from "@/registry/otp/react/otp";

import { Slider, type SliderConfig } from "@/registry/slider/react/slider";

import { Search, type SearchConfig } from "@/registry/search/react/search";

import { TimePicker, type TimePickerConfig } from "@/registry/time-picker/react/time-picker";

import { TreeView, type TreeViewConfig } from "@/registry/tree-view/react/tree-view";

import { SortableList, type SortableListConfig } from "@/registry/sortable-list/react/sortable-list";

import { Drawer, type DrawerConfig } from "@/registry/drawer/react/drawer";

import { CookieConsent, type CookieConsentConfig } from "@/registry/cookie-consent/react/cookie-consent";

import { CardFields, type CardFieldsConfig } from "@/registry/card-fields/react/card-fields";

import { Tour, type TourConfig } from "@/registry/tour/react/tour";

import { Feed, type FeedConfig } from "@/registry/feed/react/feed";

import { Lightbox, type LightboxConfig } from "@/registry/lightbox/react/lightbox";

import { ResizablePanels, type ResizablePanelsConfig } from "@/registry/resizable-panels/react/resizable-panels";

import { Switch, type SwitchConfig } from "@/registry/switch/react/switch";

import { Rating, type RatingConfig } from "@/registry/rating/react/rating";

import { Segmented, type SegmentedConfig } from "@/registry/segmented/react/segmented";

import { AlertBanner, type AlertBannerConfig } from "@/registry/alert-banner/react/alert-banner";

import { Skeleton, type SkeletonConfig } from "@/registry/skeleton/react/skeleton";

import { EmptyState, type EmptyStateConfig } from "@/registry/empty-state/react/empty-state";

import { AvatarGroup, type AvatarGroupConfig } from "@/registry/avatar-group/react/avatar-group";

import { Badge, type BadgeConfig } from "@/registry/badge/react/badge";

import { TagInput, type TagInputConfig } from "@/registry/tag-input/react/tag-input";

import { Quantity, type QuantityConfig } from "@/registry/quantity/react/quantity";

import { CurrencyInput, type CurrencyInputConfig } from "@/registry/currency-input/react/currency-input";

import { PhoneInput, type PhoneInputConfig } from "@/registry/phone-input/react/phone-input";

import { InlineEdit, type InlineEditConfig } from "@/registry/inline-edit/react/inline-edit";

import { ColorPicker, type ColorPickerConfig } from "@/registry/color-picker/react/color-picker";

import { BackToTop, type BackToTopConfig } from "@/registry/back-to-top/react/back-to-top";

import { ReadingProgress, type ReadingProgressConfig } from "@/registry/reading-progress/react/reading-progress";

import { LanguageSwitcher, type LanguageSwitcherConfig } from "@/registry/language-switcher/react/language-switcher";

import { FilterBar, type FilterBarConfig } from "@/registry/filter-bar/react/filter-bar";

import { DataGrid, type DataGridConfig } from "@/registry/data-grid/react/data-grid";

import { Kanban, type KanbanConfig } from "@/registry/kanban/react/kanban";

import { ConfirmDialog, type ConfirmDialogConfig } from "@/registry/confirm-dialog/react/confirm-dialog";

import { SessionTimeout, type SessionTimeoutConfig } from "@/registry/session-timeout/react/session-timeout";

import { UnsavedChanges, type UnsavedChangesConfig } from "@/registry/unsaved-changes/react/unsaved-changes";

import { OfflineBanner, type OfflineBannerConfig } from "@/registry/offline-banner/react/offline-banner";

import { ShortcutHelp, type ShortcutHelpConfig } from "@/registry/shortcut-help/react/shortcut-help";

import { PricingTable, type PricingTableConfig } from "@/registry/pricing-table/react/pricing-table";

import { StatsTiles, type StatsTilesConfig } from "@/registry/stats-tiles/react/stats-tiles";

import { Timeline, type TimelineConfig } from "@/registry/timeline/react/timeline";

import { CommentThread, type CommentThreadConfig } from "@/registry/comment-thread/react/comment-thread";

import { ProductCard, type ProductCardConfig } from "@/registry/product-card/react/product-card";

type Config = Record<string, unknown>;

// The frame shows the component on its own surface, whatever theme the site is in.
const surfaces = { light: { background: "#ffffff", color: "#16121f" }, dark: { background: "#141019", color: "#f6f5fa" } };
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

/** Types into a React-controlled field the way a person would: one character at a time. */
function typeInto(field: HTMLInputElement | HTMLTextAreaElement, text: string, index: number) {
  const setter = Object.getOwnPropertyDescriptor(
    field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(field, text.slice(0, index));
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function runStep(step: DemoStep, wait: (ms: number) => Promise<void>) {
  const target = document.querySelector<HTMLElement>(step.find);
  if (!target) return Promise.resolve();
  if (step.action === "click") {
    target.click();
    return Promise.resolve();
  }
  if (step.action === "key") {
    target.focus();
    target.dispatchEvent(new KeyboardEvent("keydown", { key: step.value, bubbles: true }));
    return Promise.resolve();
  }
  const field = target as HTMLInputElement;
  field.focus();
  const text = step.value ?? "";
  return text.split("").reduce(
    (before, _, index) => before.then(() => wait(110)).then(() => typeInto(field, text, index + 1)),
    Promise.resolve(),
  );
}

export function PreviewClient({ slug, initialConfig, demo = false }: { slug: string; initialConfig: Config; demo?: boolean }) {
  const [config, setConfig] = useState(initialConfig);
  const [lastAction, setLastAction] = useState<ModalAction | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);

  // The editor sends new options as they change, instead of reloading this page.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "config") setConfig(event.data.config as Config);
    }
    window.addEventListener("message", onMessage);
    // Tell the editor we are listening; a config sent before this would be lost.
    window.parent?.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The cookie banner remembers a choice; the preview always starts from "not asked yet" so the
  // banner can be seen again after trying it.
  const storageKey = slug === "cookie-consent" ? String(config.storageKey) : "";
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.removeItem(storageKey);
      window.dispatchEvent(new Event("cookie-consent"));
    } catch {
      // Storage blocked: the component falls back to memory, which starts empty anyway.
    }
  }, [storageKey]);

  // The catalogue cards open this page with ?demo=1: play the part's own script against the real
  // component, then start again. Nothing moves for anyone who asked for less motion.
  useEffect(() => {
    const steps = demos[slug]?.steps ?? [];
    if (!demo || steps.length === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
    void (async () => {
      await wait(900);
      for (const step of steps) {
        if (cancelled) return;
        await runStep(step, wait);
        await wait(step.after ?? 700);
      }
      await wait(2200);
      if (!cancelled) window.location.reload();
    })();
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [demo, slug]);

  // Tell the editor how tall the frame needs to be.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const report = () =>
      window.parent?.postMessage(
        { type: "preview-height", height: Math.ceil(box.getBoundingClientRect().height) },
        window.location.origin,
      );
    report();
    const observer = new ResizeObserver(report);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    // The outer box paints the whole frame; only the inner one is measured, so reporting its
    // height back to the editor can never grow the frame a second time.
    <div style={surfaces[dark ? "dark" : "light"]} className="min-h-dvh">
      <div
        ref={boxRef}
        className={fullBleed.includes(slug) ? "" : "p-6 sm:p-8"}
      >
        {slug === "accordion" && <Accordion config={config as unknown as AccordionConfig} />}
        {slug === "tooltip" && <Tooltip config={config as unknown as TooltipConfig} />}
        {slug === "menu" && <Menu config={config as unknown as MenuConfig} />}
        {slug === "popover" && <Popover config={config as unknown as PopoverConfig} />}
        {slug === "toast" && <Toast config={config as unknown as ToastConfig} />}
        {slug === "table" && <Table config={config as unknown as TableConfig} />}
        {slug === "pagination" && <Pagination config={config as unknown as PaginationConfig} />}
        {slug === "breadcrumbs" && <Breadcrumbs config={config as unknown as BreadcrumbsConfig} />}
        {slug === "stepper" && <Stepper config={config as unknown as StepperConfig} />}
        {slug === "sidebar" && <Sidebar config={config as unknown as SidebarConfig} />}
        {slug === "upload" && <Upload config={config as unknown as UploadConfig} />}
        {slug === "multi-select" && <MultiSelect config={config as unknown as MultiSelectConfig} />}
        {slug === "password" && <Password config={config as unknown as PasswordConfig} />}
        {slug === "otp" && <Otp config={config as unknown as OtpConfig} />}
        {slug === "slider" && <Slider config={config as unknown as SliderConfig} />}
        {slug === "search" && <Search config={config as unknown as SearchConfig} />}
        {slug === "time-picker" && <TimePicker config={config as unknown as TimePickerConfig} />}
        {slug === "tree-view" && <TreeView config={config as unknown as TreeViewConfig} />}
        {slug === "sortable-list" && <SortableList config={config as unknown as SortableListConfig} />}
        {slug === "drawer" && <Drawer config={config as unknown as DrawerConfig} />}
        {slug === "cookie-consent" && <CookieConsent config={config as unknown as CookieConsentConfig} />}
        {slug === "card-fields" && <CardFields config={config as unknown as CardFieldsConfig} />}
        {slug === "tour" && <Tour config={config as unknown as TourConfig} />}
        {slug === "feed" && <Feed config={config as unknown as FeedConfig} />}
        {slug === "lightbox" && <Lightbox config={config as unknown as LightboxConfig} />}
        {slug === "resizable-panels" && <ResizablePanels config={config as unknown as ResizablePanelsConfig} />}
        {slug === "switch" && <Switch config={config as unknown as SwitchConfig} />}
        {slug === "rating" && <Rating config={config as unknown as RatingConfig} />}
        {slug === "segmented" && <Segmented config={config as unknown as SegmentedConfig} />}
        {slug === "alert-banner" && <AlertBanner config={config as unknown as AlertBannerConfig} />}
        {slug === "skeleton" && <Skeleton config={config as unknown as SkeletonConfig} />}
        {slug === "empty-state" && <EmptyState config={config as unknown as EmptyStateConfig} />}
        {slug === "avatar-group" && <AvatarGroup config={config as unknown as AvatarGroupConfig} />}
        {slug === "badge" && <Badge config={config as unknown as BadgeConfig} />}
        {slug === "tag-input" && <TagInput config={config as unknown as TagInputConfig} />}
        {slug === "quantity" && <Quantity config={config as unknown as QuantityConfig} />}
        {slug === "currency-input" && <CurrencyInput config={config as unknown as CurrencyInputConfig} />}
        {slug === "phone-input" && <PhoneInput config={config as unknown as PhoneInputConfig} />}
        {slug === "inline-edit" && <InlineEdit config={config as unknown as InlineEditConfig} />}
        {slug === "color-picker" && <ColorPicker config={config as unknown as ColorPickerConfig} />}
        {slug === "back-to-top" && <BackToTop config={config as unknown as BackToTopConfig} />}
        {slug === "reading-progress" && <ReadingProgress config={config as unknown as ReadingProgressConfig} />}
        {slug === "language-switcher" && <LanguageSwitcher config={config as unknown as LanguageSwitcherConfig} />}
        {slug === "filter-bar" && <FilterBar config={config as unknown as FilterBarConfig} />}
        {slug === "data-grid" && <DataGrid config={config as unknown as DataGridConfig} />}
        {slug === "kanban" && <Kanban config={config as unknown as KanbanConfig} />}
        {slug === "confirm-dialog" && <ConfirmDialog config={config as unknown as ConfirmDialogConfig} />}
        {slug === "session-timeout" && <SessionTimeout config={config as unknown as SessionTimeoutConfig} />}
        {slug === "unsaved-changes" && <UnsavedChanges config={config as unknown as UnsavedChangesConfig} />}
        {slug === "offline-banner" && <OfflineBanner config={config as unknown as OfflineBannerConfig} />}
        {slug === "shortcut-help" && <ShortcutHelp config={config as unknown as ShortcutHelpConfig} />}
        {slug === "pricing-table" && <PricingTable config={config as unknown as PricingTableConfig} />}
        {slug === "stats-tiles" && <StatsTiles config={config as unknown as StatsTilesConfig} />}
        {slug === "timeline" && <Timeline config={config as unknown as TimelineConfig} />}
        {slug === "comment-thread" && <CommentThread config={config as unknown as CommentThreadConfig} />}
        {slug === "product-card" && <ProductCard config={config as unknown as ProductCardConfig} />}
        {slug === "date-picker" && <DatePicker config={config as unknown as DatePickerConfig} />}
        {slug === "carousel" && <Carousel config={config as unknown as CarouselConfig} />}
        {slug === "cart" && <Cart config={config as unknown as CartConfig} />}
        {slug === "cta" && <Cta config={config as unknown as CtaConfig} />}
        {slug === "header" && <HeaderPart config={config as unknown as HeaderConfig} />}
        {slug === "footer" && <FooterPart config={config as unknown as FooterConfig} />}
        {slug === "mega-menu" && <MegaMenu config={config as unknown as MegaMenuConfig} />}
        {slug === "form" && <ContactForm config={config as unknown as FormConfig} />}
        {slug === "searchable-select" && <SearchableSelect config={config as unknown as SearchableSelectConfig} />}
        {slug === "tabs" && <Tabs config={config as unknown as TabsConfig} />}
        {slug === "modal" && (
          <>
            <Modal config={config as unknown as ModalConfig} onAction={setLastAction} />
            <p className="mt-3 font-mono text-xs text-neutral-600" aria-live="polite">
              Last result: {lastAction ?? "not closed yet"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
