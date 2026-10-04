"use client";

import { fullBleed } from "@/lib/parts";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DateRange, type DateRangeConfig } from "@/registry/date-range/react/date-range";
import { TimeRange, type TimeRangeConfig } from "@/registry/time-range/react/time-range";
import { DualSlider, type DualSliderConfig } from "@/registry/dual-slider/react/dual-slider";
import { PinPad, type PinPadConfig } from "@/registry/pin-pad/react/pin-pad";
import { AutosaveField, type AutosaveFieldConfig } from "@/registry/autosave-field/react/autosave-field";
import { ErrorSummary, type ErrorSummaryConfig } from "@/registry/error-summary/react/error-summary";
import { AddressFields, type AddressFieldsConfig } from "@/registry/address-fields/react/address-fields";
import { SkipLinks, type SkipLinksConfig } from "@/registry/skip-links/react/skip-links";
import { AnchorNav, type AnchorNavConfig } from "@/registry/anchor-nav/react/anchor-nav";
import { CommandMenu, type CommandMenuConfig } from "@/registry/command-menu/react/command-menu";
import { MenuBar, type MenuBarConfig } from "@/registry/menu-bar/react/menu-bar";
import { CursorPagination, type CursorPaginationConfig } from "@/registry/cursor-pagination/react/cursor-pagination";
import { NavProgress, type NavProgressConfig } from "@/registry/nav-progress/react/nav-progress";
import { StickyHeader, type StickyHeaderConfig } from "@/registry/sticky-header/react/sticky-header";
import { HoverCard, type HoverCardConfig } from "@/registry/hover-card/react/hover-card";
import { BottomSheet, type BottomSheetConfig } from "@/registry/bottom-sheet/react/bottom-sheet";
import { LoadingButton, type LoadingButtonConfig } from "@/registry/loading-button/react/loading-button";
import { UndoSnackbar, type UndoSnackbarConfig } from "@/registry/undo-snackbar/react/undo-snackbar";
import { InlineConfirm, type InlineConfirmConfig } from "@/registry/inline-confirm/react/inline-confirm";
import { CircularProgress, type CircularProgressConfig } from "@/registry/circular-progress/react/circular-progress";
import { ErrorState, type ErrorStateConfig } from "@/registry/error-state/react/error-state";
import { MaintenanceNotice, type MaintenanceNoticeConfig } from "@/registry/maintenance-notice/react/maintenance-notice";
import { HelpHint, type HelpHintConfig } from "@/registry/help-hint/react/help-hint";
import { Changelog, type ChangelogConfig } from "@/registry/changelog/react/changelog";
import { NotificationList, type NotificationListConfig } from "@/registry/notification-list/react/notification-list";
import { RowActions, type RowActionsConfig } from "@/registry/row-actions/react/row-actions";
import { OrderTracker, type OrderTrackerConfig } from "@/registry/order-tracker/react/order-tracker";
import { InvoiceSummary, type InvoiceSummaryConfig } from "@/registry/invoice-summary/react/invoice-summary";
import { ArticleCard, type ArticleCardConfig } from "@/registry/article-card/react/article-card";
import { AuthorByline, type AuthorBylineConfig } from "@/registry/author-byline/react/author-byline";
import { ImageGallery, type ImageGalleryConfig } from "@/registry/image-gallery/react/image-gallery";
import { VideoEmbed, type VideoEmbedConfig } from "@/registry/video-embed/react/video-embed";
import { PullQuote, type PullQuoteConfig } from "@/registry/pull-quote/react/pull-quote";
import { TeamGrid, type TeamGridConfig } from "@/registry/team-grid/react/team-grid";
import { LogoWall, type LogoWallConfig } from "@/registry/logo-wall/react/logo-wall";
import { PageHeader, type PageHeaderConfig } from "@/registry/page-header/react/page-header";
import { SplitFeature, type SplitFeatureConfig } from "@/registry/split-feature/react/split-feature";
import { StatComparison, type StatComparisonConfig } from "@/registry/stat-comparison/react/stat-comparison";
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

import { SignaturePad, type SignaturePadConfig } from "@/registry/signature-pad/react/signature-pad";

import { CodeBlock, type CodeBlockConfig } from "@/registry/code-block/react/code-block";

import { Toolbar, type ToolbarConfig } from "@/registry/toolbar/react/toolbar";

import { Countdown, type CountdownConfig } from "@/registry/countdown/react/countdown";

import { SlotPicker, type SlotPickerConfig } from "@/registry/slot-picker/react/slot-picker";

import { Wizard, type WizardConfig } from "@/registry/wizard/react/wizard";

import { CheckboxGroup, type CheckboxGroupConfig } from "@/registry/checkbox-group/react/checkbox-group";

import { RadioCards, type RadioCardsConfig } from "@/registry/radio-cards/react/radio-cards";

import { TextareaCounter, type TextareaCounterConfig } from "@/registry/textarea-counter/react/textarea-counter";

import { SelectField, type SelectFieldConfig } from "@/registry/select-field/react/select-field";

import { Faq, type FaqConfig } from "@/registry/faq/react/faq";

import { DetailsList, type DetailsListConfig } from "@/registry/details-list/react/details-list";

import { ComparisonTable, type ComparisonTableConfig } from "@/registry/comparison-table/react/comparison-table";

import { Hero, type HeroConfig } from "@/registry/hero/react/hero";

import { FeatureGrid, type FeatureGridConfig } from "@/registry/feature-grid/react/feature-grid";

import { HowItWorks, type HowItWorksConfig } from "@/registry/how-it-works/react/how-it-works";

import { Newsletter, type NewsletterConfig } from "@/registry/newsletter/react/newsletter";

import { ToggleGroup, type ToggleGroupConfig } from "@/registry/toggle-group/react/toggle-group";

import { UnitInput, type UnitInputConfig } from "@/registry/unit-input/react/unit-input";

import { MaskedInput, type MaskedInputConfig } from "@/registry/masked-input/react/masked-input";
import { TextSection, type TextSectionConfig } from "@/registry/text-section/react/text-section";
import { PictureSection, type PictureSectionConfig } from "@/registry/picture-section/react/picture-section";
import { Testimonials, type TestimonialsConfig } from "@/registry/testimonials/react/testimonials";
import { ContactDetails, type ContactDetailsConfig } from "@/registry/contact-details/react/contact-details";
import { PostList, type PostListConfig } from "@/registry/post-list/react/post-list";
import { AnnouncementBar, type AnnouncementBarConfig } from "@/registry/announcement-bar/react/announcement-bar";

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

export function PreviewClient({ slug, initialConfig }: { slug: string; initialConfig: Config }) {
  const [config, setConfig] = useState(initialConfig);
  const [lastAction, setLastAction] = useState<ModalAction | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);

  // The editor sends new options as they change, instead of reloading this page.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "config") return;
      setConfig(event.data.config as Config);
      // The language the editor picked: the page's own lang and direction, as on a real page (D94).
      if (event.data.page) {
        document.documentElement.lang = event.data.page.lang;
        document.documentElement.dir = event.data.page.dir;
      }
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
        <Part slug={slug} config={config} />
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

/**
 * One part, rendered from its slug and options. Shared by this preview page and the template preview
 * (components/template-page.tsx), so a part looks and behaves the same in both.
 */
export function Part({ slug, config }: { slug: string; config: Config }) {
  return (
    <>
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
      {slug === "signature-pad" && <SignaturePad config={config as unknown as SignaturePadConfig} />}
      {slug === "code-block" && <CodeBlock config={config as unknown as CodeBlockConfig} />}
      {slug === "toolbar" && <Toolbar config={config as unknown as ToolbarConfig} />}
      {slug === "countdown" && <Countdown config={config as unknown as CountdownConfig} />}
      {slug === "slot-picker" && <SlotPicker config={config as unknown as SlotPickerConfig} />}
      {slug === "wizard" && <Wizard config={config as unknown as WizardConfig} />}
      {slug === "checkbox-group" && <CheckboxGroup config={config as unknown as CheckboxGroupConfig} />}
      {slug === "radio-cards" && <RadioCards config={config as unknown as RadioCardsConfig} />}
      {slug === "textarea-counter" && <TextareaCounter config={config as unknown as TextareaCounterConfig} />}
      {slug === "select-field" && <SelectField config={config as unknown as SelectFieldConfig} />}
      {slug === "faq" && <Faq config={config as unknown as FaqConfig} />}
      {slug === "details-list" && <DetailsList config={config as unknown as DetailsListConfig} />}
      {slug === "comparison-table" && <ComparisonTable config={config as unknown as ComparisonTableConfig} />}
      {slug === "hero" && <Hero config={config as unknown as HeroConfig} />}
      {slug === "feature-grid" && <FeatureGrid config={config as unknown as FeatureGridConfig} />}
      {slug === "how-it-works" && <HowItWorks config={config as unknown as HowItWorksConfig} />}
      {slug === "newsletter" && <Newsletter config={config as unknown as NewsletterConfig} />}
      {slug === "toggle-group" && <ToggleGroup config={config as unknown as ToggleGroupConfig} />}
      {slug === "unit-input" && <UnitInput config={config as unknown as UnitInputConfig} />}
      {slug === "masked-input" && <MaskedInput config={config as unknown as MaskedInputConfig} />}
      {slug === "date-range" && <DateRange config={config as unknown as DateRangeConfig} />}
      {slug === "time-range" && <TimeRange config={config as unknown as TimeRangeConfig} />}
      {slug === "dual-slider" && <DualSlider config={config as unknown as DualSliderConfig} />}
      {slug === "pin-pad" && <PinPad config={config as unknown as PinPadConfig} />}
      {slug === "autosave-field" && <AutosaveField config={config as unknown as AutosaveFieldConfig} />}
      {slug === "error-summary" && <ErrorSummary config={config as unknown as ErrorSummaryConfig} />}
      {slug === "address-fields" && <AddressFields config={config as unknown as AddressFieldsConfig} />}
      {slug === "skip-links" && <SkipLinks config={config as unknown as SkipLinksConfig} />}
      {slug === "anchor-nav" && <AnchorNav config={config as unknown as AnchorNavConfig} />}
      {slug === "command-menu" && <CommandMenu config={config as unknown as CommandMenuConfig} />}
      {slug === "menu-bar" && <MenuBar config={config as unknown as MenuBarConfig} />}
      {slug === "cursor-pagination" && <CursorPagination config={config as unknown as CursorPaginationConfig} />}
      {slug === "nav-progress" && <NavProgress config={config as unknown as NavProgressConfig} />}
      {slug === "sticky-header" && <StickyHeader config={config as unknown as StickyHeaderConfig} />}
      {slug === "hover-card" && <HoverCard config={config as unknown as HoverCardConfig} />}
      {slug === "bottom-sheet" && <BottomSheet config={config as unknown as BottomSheetConfig} />}
      {slug === "loading-button" && <LoadingButton config={config as unknown as LoadingButtonConfig} />}
      {slug === "undo-snackbar" && <UndoSnackbar config={config as unknown as UndoSnackbarConfig} />}
      {slug === "inline-confirm" && <InlineConfirm config={config as unknown as InlineConfirmConfig} />}
      {slug === "circular-progress" && <CircularProgress config={config as unknown as CircularProgressConfig} />}
      {slug === "error-state" && <ErrorState config={config as unknown as ErrorStateConfig} />}
      {slug === "maintenance-notice" && <MaintenanceNotice config={config as unknown as MaintenanceNoticeConfig} />}
      {slug === "help-hint" && <HelpHint config={config as unknown as HelpHintConfig} />}
      {slug === "changelog" && <Changelog config={config as unknown as ChangelogConfig} />}
      {slug === "notification-list" && <NotificationList config={config as unknown as NotificationListConfig} />}
      {slug === "row-actions" && <RowActions config={config as unknown as RowActionsConfig} />}
      {slug === "order-tracker" && <OrderTracker config={config as unknown as OrderTrackerConfig} />}
      {slug === "invoice-summary" && <InvoiceSummary config={config as unknown as InvoiceSummaryConfig} />}
      {slug === "article-card" && <ArticleCard config={config as unknown as ArticleCardConfig} />}
      {slug === "author-byline" && <AuthorByline config={config as unknown as AuthorBylineConfig} />}
      {slug === "image-gallery" && <ImageGallery config={config as unknown as ImageGalleryConfig} />}
      {slug === "video-embed" && <VideoEmbed config={config as unknown as VideoEmbedConfig} />}
      {slug === "pull-quote" && <PullQuote config={config as unknown as PullQuoteConfig} />}
      {slug === "team-grid" && <TeamGrid config={config as unknown as TeamGridConfig} />}
      {slug === "logo-wall" && <LogoWall config={config as unknown as LogoWallConfig} />}
      {slug === "page-header" && <PageHeader config={config as unknown as PageHeaderConfig} />}
      {slug === "split-feature" && <SplitFeature config={config as unknown as SplitFeatureConfig} />}
      {slug === "stat-comparison" && <StatComparison config={config as unknown as StatComparisonConfig} />}
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
      {slug === "text-section" && <TextSection config={config as unknown as TextSectionConfig} />}
      {slug === "picture-section" && <PictureSection config={config as unknown as PictureSectionConfig} />}
      {slug === "testimonials" && <Testimonials config={config as unknown as TestimonialsConfig} />}
      {slug === "contact-details" && <ContactDetails config={config as unknown as ContactDetailsConfig} />}
      {slug === "post-list" && <PostList config={config as unknown as PostListConfig} />}
      {slug === "announcement-bar" && <AnnouncementBar config={config as unknown as AnnouncementBarConfig} />}
    </>
  );
}
