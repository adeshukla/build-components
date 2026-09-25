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
import { searchSchema } from "@/registry/search/schema";
import * as searchDocs from "@/registry/search/docs";
import { renderSearchHtml } from "@/registry/search/vanilla/render";
import { timePickerSchema } from "@/registry/time-picker/schema";
import * as timePickerDocs from "@/registry/time-picker/docs";
import { renderTimePickerHtml } from "@/registry/time-picker/vanilla/render";
import { treeViewSchema } from "@/registry/tree-view/schema";
import * as treeViewDocs from "@/registry/tree-view/docs";
import { renderTreeViewHtml } from "@/registry/tree-view/vanilla/render";
import { sortableListSchema } from "@/registry/sortable-list/schema";
import * as sortableListDocs from "@/registry/sortable-list/docs";
import { renderSortableListHtml } from "@/registry/sortable-list/vanilla/render";
import { drawerSchema } from "@/registry/drawer/schema";
import * as drawerDocs from "@/registry/drawer/docs";
import { renderDrawerHtml } from "@/registry/drawer/vanilla/render";
import { cookieConsentSchema } from "@/registry/cookie-consent/schema";
import * as cookieConsentDocs from "@/registry/cookie-consent/docs";
import { renderCookieConsentHtml } from "@/registry/cookie-consent/vanilla/render";
import { cardFieldsSchema } from "@/registry/card-fields/schema";
import * as cardFieldsDocs from "@/registry/card-fields/docs";
import { renderCardFieldsHtml } from "@/registry/card-fields/vanilla/render";
import { tourSchema } from "@/registry/tour/schema";
import * as tourDocs from "@/registry/tour/docs";
import { renderTourHtml } from "@/registry/tour/vanilla/render";
import { feedSchema } from "@/registry/feed/schema";
import * as feedDocs from "@/registry/feed/docs";
import { renderFeedHtml } from "@/registry/feed/vanilla/render";
import { lightboxSchema } from "@/registry/lightbox/schema";
import * as lightboxDocs from "@/registry/lightbox/docs";
import { renderLightboxHtml } from "@/registry/lightbox/vanilla/render";
import { resizablePanelsSchema } from "@/registry/resizable-panels/schema";
import * as resizablePanelsDocs from "@/registry/resizable-panels/docs";
import { renderResizablePanelsHtml } from "@/registry/resizable-panels/vanilla/render";
import { switchSchema } from "@/registry/switch/schema";
import * as switchDocs from "@/registry/switch/docs";
import { renderSwitchHtml } from "@/registry/switch/vanilla/render";
import { ratingSchema } from "@/registry/rating/schema";
import * as ratingDocs from "@/registry/rating/docs";
import { renderRatingHtml } from "@/registry/rating/vanilla/render";
import { segmentedSchema } from "@/registry/segmented/schema";
import * as segmentedDocs from "@/registry/segmented/docs";
import { renderSegmentedHtml } from "@/registry/segmented/vanilla/render";
import { alertBannerSchema } from "@/registry/alert-banner/schema";
import * as alertBannerDocs from "@/registry/alert-banner/docs";
import { renderAlertBannerHtml } from "@/registry/alert-banner/vanilla/render";
import { skeletonSchema } from "@/registry/skeleton/schema";
import * as skeletonDocs from "@/registry/skeleton/docs";
import { renderSkeletonHtml } from "@/registry/skeleton/vanilla/render";
import { emptyStateSchema } from "@/registry/empty-state/schema";
import * as emptyStateDocs from "@/registry/empty-state/docs";
import { renderEmptyStateHtml } from "@/registry/empty-state/vanilla/render";
import { avatarGroupSchema } from "@/registry/avatar-group/schema";
import * as avatarGroupDocs from "@/registry/avatar-group/docs";
import { renderAvatarGroupHtml } from "@/registry/avatar-group/vanilla/render";
import { badgeSchema } from "@/registry/badge/schema";
import * as badgeDocs from "@/registry/badge/docs";
import { renderBadgeHtml } from "@/registry/badge/vanilla/render";
import { tagInputSchema } from "@/registry/tag-input/schema";
import * as tagInputDocs from "@/registry/tag-input/docs";
import { renderTagInputHtml } from "@/registry/tag-input/vanilla/render";
import { quantitySchema } from "@/registry/quantity/schema";
import * as quantityDocs from "@/registry/quantity/docs";
import { renderQuantityHtml } from "@/registry/quantity/vanilla/render";
import { currencyInputSchema } from "@/registry/currency-input/schema";
import * as currencyInputDocs from "@/registry/currency-input/docs";
import { renderCurrencyInputHtml } from "@/registry/currency-input/vanilla/render";
import { phoneInputSchema } from "@/registry/phone-input/schema";
import * as phoneInputDocs from "@/registry/phone-input/docs";
import { renderPhoneInputHtml } from "@/registry/phone-input/vanilla/render";
import { inlineEditSchema } from "@/registry/inline-edit/schema";
import * as inlineEditDocs from "@/registry/inline-edit/docs";
import { renderInlineEditHtml } from "@/registry/inline-edit/vanilla/render";
import { colorPickerSchema } from "@/registry/color-picker/schema";
import * as colorPickerDocs from "@/registry/color-picker/docs";
import { renderColorPickerHtml } from "@/registry/color-picker/vanilla/render";
import { backToTopSchema } from "@/registry/back-to-top/schema";
import * as backToTopDocs from "@/registry/back-to-top/docs";
import { renderBackToTopHtml } from "@/registry/back-to-top/vanilla/render";
import { readingProgressSchema } from "@/registry/reading-progress/schema";
import * as readingProgressDocs from "@/registry/reading-progress/docs";
import { renderReadingProgressHtml } from "@/registry/reading-progress/vanilla/render";
import { languageSwitcherSchema } from "@/registry/language-switcher/schema";
import * as languageSwitcherDocs from "@/registry/language-switcher/docs";
import { renderLanguageSwitcherHtml } from "@/registry/language-switcher/vanilla/render";
import { filterBarSchema } from "@/registry/filter-bar/schema";
import * as filterBarDocs from "@/registry/filter-bar/docs";
import { renderFilterBarHtml } from "@/registry/filter-bar/vanilla/render";
import { dataGridSchema } from "@/registry/data-grid/schema";
import * as dataGridDocs from "@/registry/data-grid/docs";
import { renderDataGridHtml } from "@/registry/data-grid/vanilla/render";
import { kanbanSchema } from "@/registry/kanban/schema";
import * as kanbanDocs from "@/registry/kanban/docs";
import { renderKanbanHtml } from "@/registry/kanban/vanilla/render";
import { confirmDialogSchema } from "@/registry/confirm-dialog/schema";
import * as confirmDialogDocs from "@/registry/confirm-dialog/docs";
import { renderConfirmDialogHtml } from "@/registry/confirm-dialog/vanilla/render";
import { sessionTimeoutSchema } from "@/registry/session-timeout/schema";
import * as sessionTimeoutDocs from "@/registry/session-timeout/docs";
import { renderSessionTimeoutHtml } from "@/registry/session-timeout/vanilla/render";
import { unsavedChangesSchema } from "@/registry/unsaved-changes/schema";
import * as unsavedChangesDocs from "@/registry/unsaved-changes/docs";
import { renderUnsavedChangesHtml } from "@/registry/unsaved-changes/vanilla/render";
import { offlineBannerSchema } from "@/registry/offline-banner/schema";
import * as offlineBannerDocs from "@/registry/offline-banner/docs";
import { renderOfflineBannerHtml } from "@/registry/offline-banner/vanilla/render";
import { shortcutHelpSchema } from "@/registry/shortcut-help/schema";
import * as shortcutHelpDocs from "@/registry/shortcut-help/docs";
import { renderShortcutHelpHtml } from "@/registry/shortcut-help/vanilla/render";
import { pricingTableSchema } from "@/registry/pricing-table/schema";
import * as pricingTableDocs from "@/registry/pricing-table/docs";
import { renderPricingTableHtml } from "@/registry/pricing-table/vanilla/render";
import { statsTilesSchema } from "@/registry/stats-tiles/schema";
import * as statsTilesDocs from "@/registry/stats-tiles/docs";
import { renderStatsTilesHtml } from "@/registry/stats-tiles/vanilla/render";
import { timelineSchema } from "@/registry/timeline/schema";
import * as timelineDocs from "@/registry/timeline/docs";
import { renderTimelineHtml } from "@/registry/timeline/vanilla/render";
import { commentThreadSchema } from "@/registry/comment-thread/schema";
import * as commentThreadDocs from "@/registry/comment-thread/docs";
import { renderCommentThreadHtml } from "@/registry/comment-thread/vanilla/render";
import { productCardSchema } from "@/registry/product-card/schema";
import * as productCardDocs from "@/registry/product-card/docs";
import { renderProductCardHtml } from "@/registry/product-card/vanilla/render";
import { signaturePadSchema } from "@/registry/signature-pad/schema";
import * as signaturePadDocs from "@/registry/signature-pad/docs";
import { renderSignaturePadHtml } from "@/registry/signature-pad/vanilla/render";
import { codeBlockSchema } from "@/registry/code-block/schema";
import * as codeBlockDocs from "@/registry/code-block/docs";
import { renderCodeBlockHtml } from "@/registry/code-block/vanilla/render";
import { toolbarSchema } from "@/registry/toolbar/schema";
import * as toolbarDocs from "@/registry/toolbar/docs";
import { renderToolbarHtml } from "@/registry/toolbar/vanilla/render";
import { countdownSchema } from "@/registry/countdown/schema";
import * as countdownDocs from "@/registry/countdown/docs";
import { renderCountdownHtml } from "@/registry/countdown/vanilla/render";
import { slotPickerSchema } from "@/registry/slot-picker/schema";
import * as slotPickerDocs from "@/registry/slot-picker/docs";
import { renderSlotPickerHtml } from "@/registry/slot-picker/vanilla/render";
import { wizardSchema } from "@/registry/wizard/schema";
import * as wizardDocs from "@/registry/wizard/docs";
import { renderWizardHtml } from "@/registry/wizard/vanilla/render";

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
  "search": {
    title: "Global search",
    description: "A global search: give it any JSON, nested as deep as you like, and search it with ⌘K.",
    schema: searchSchema,
    ...searchDocs,
    renderHtml: (config) => renderSearchHtml(config as never),
  },
  "time-picker": {
    title: "Time picker",
    description: "An accessible time picker: type a time or pick one from a list of slots.",
    schema: timePickerSchema,
    ...timePickerDocs,
    renderHtml: (config) => renderTimePickerHtml(config as never),
  },
  "tree-view": {
    title: "Tree view",
    description: "An accessible tree view (WAI-ARIA tree pattern) built from simple paths.",
    schema: treeViewSchema,
    ...treeViewDocs,
    renderHtml: (config) => renderTreeViewHtml(config as never),
  },
  "sortable-list": {
    title: "Sortable list",
    description: "A list people can reorder by dragging, by keyboard or with buttons.",
    schema: sortableListSchema,
    ...sortableListDocs,
    renderHtml: (config) => renderSortableListHtml(config as never),
  },
  "drawer": {
    title: "Drawer",
    description: "An accessible drawer (side sheet or bottom sheet) on a native modal dialog.",
    schema: drawerSchema,
    ...drawerDocs,
    renderHtml: (config) => renderDrawerHtml(config as never),
  },
  "cookie-consent": {
    title: "Cookie consent",
    description: "A cookie consent banner with equal accept and reject, and saved preferences.",
    schema: cookieConsentSchema,
    ...cookieConsentDocs,
    renderHtml: (config) => renderCookieConsentHtml(config as never),
  },
  "card-fields": {
    title: "Card payment fields",
    description: "Accessible card payment fields with formatting, card type and Luhn checks.",
    schema: cardFieldsSchema,
    ...cardFieldsDocs,
    renderHtml: (config) => renderCardFieldsHtml(config as never),
  },
  "tour": {
    title: "Guided tour",
    description: "An accessible product tour: step-by-step pointers with focus management.",
    schema: tourSchema,
    ...tourDocs,
    renderHtml: (config) => renderTourHtml(config as never),
  },
  "feed": {
    title: "Load-more feed",
    description: "An accessible feed (WAI-ARIA feed pattern) with a load-more button or scroll loading.",
    schema: feedSchema,
    ...feedDocs,
    renderHtml: (config) => renderFeedHtml(config as never),
  },
  "lightbox": {
    title: "Lightbox",
    description: "An accessible image gallery and full-screen viewer.",
    schema: lightboxSchema,
    ...lightboxDocs,
    renderHtml: (config) => renderLightboxHtml(config as never),
  },
  "resizable-panels": {
    title: "Resizable panels",
    description: "Resizable split panels on the WAI-ARIA window splitter pattern.",
    schema: resizablePanelsSchema,
    ...resizablePanelsDocs,
    renderHtml: (config) => renderResizablePanelsHtml(config as never),
  },
  "switch": {
    title: "Switch",
    description: "An accessible on/off switch built on a native checkbox.",
    schema: switchSchema,
    ...switchDocs,
    renderHtml: (config) => renderSwitchHtml(config as never),
  },
  "rating": {
    title: "Rating",
    description: "An accessible star rating for picking or for showing an average.",
    schema: ratingSchema,
    ...ratingDocs,
    renderHtml: (config) => renderRatingHtml(config as never),
  },
  "segmented": {
    title: "Segmented control",
    description: "An accessible segmented control on native radio buttons.",
    schema: segmentedSchema,
    ...segmentedDocs,
    renderHtml: (config) => renderSegmentedHtml(config as never),
  },
  "alert-banner": {
    title: "Alert banner",
    description: "An accessible inline alert with tones, an action and a safe dismiss.",
    schema: alertBannerSchema,
    ...alertBannerDocs,
    renderHtml: (config) => renderAlertBannerHtml(config as never),
  },
  "skeleton": {
    title: "Skeleton",
    description: "Loading placeholders that say what is loading, once.",
    schema: skeletonSchema,
    ...skeletonDocs,
    renderHtml: (config) => renderSkeletonHtml(config as never),
  },
  "empty-state": {
    title: "Empty state",
    description: "An empty state that explains what is missing and what to do next.",
    schema: emptyStateSchema,
    ...emptyStateDocs,
    renderHtml: (config) => renderEmptyStateHtml(config as never),
  },
  "avatar-group": {
    title: "Avatar group",
    description: "Stacked avatars that read out as names, including the hidden ones.",
    schema: avatarGroupSchema,
    ...avatarGroupDocs,
    renderHtml: (config) => renderAvatarGroupHtml(config as never),
  },
  "badge": {
    title: "Badges",
    description: "Status badges in tones that never rely on colour alone.",
    schema: badgeSchema,
    ...badgeDocs,
    renderHtml: (config) => renderBadgeHtml(config as never),
  },
  "tag-input": {
    title: "Tag input",
    description: "An accessible tag field with removable chips and announced changes.",
    schema: tagInputSchema,
    ...tagInputDocs,
    renderHtml: (config) => renderTagInputHtml(config as never),
  },
  "quantity": {
    title: "Quantity stepper",
    description: "A quantity stepper with a typeable field and announced limits.",
    schema: quantitySchema,
    ...quantityDocs,
    renderHtml: (config) => renderQuantityHtml(config as never),
  },
  "currency-input": {
    title: "Currency input",
    description: "A money field that tidies on blur and submits a plain number.",
    schema: currencyInputSchema,
    ...currencyInputDocs,
    renderHtml: (config) => renderCurrencyInputHtml(config as never),
  },
  "phone-input": {
    title: "Phone input",
    description: "A phone field with country codes and local grouping.",
    schema: phoneInputSchema,
    ...phoneInputDocs,
    renderHtml: (config) => renderPhoneInputHtml(config as never),
  },
  "inline-edit": {
    title: "Inline edit",
    description: "Edit a value in place without losing focus or context.",
    schema: inlineEditSchema,
    ...inlineEditDocs,
    renderHtml: (config) => renderInlineEditHtml(config as never),
  },
  "color-picker": {
    title: "Colour picker",
    description: "Named colour swatches with an optional custom colour.",
    schema: colorPickerSchema,
    ...colorPickerDocs,
    renderHtml: (config) => renderColorPickerHtml(config as never),
  },
  "back-to-top": {
    title: "Back to top",
    description: "A back-to-top button that moves focus, not just the scroll position.",
    schema: backToTopSchema,
    ...backToTopDocs,
    renderHtml: (config) => renderBackToTopHtml(config as never),
  },
  "reading-progress": {
    title: "Reading progress",
    description: "Reading progress with a contents list that follows the page.",
    schema: readingProgressSchema,
    ...readingProgressDocs,
    renderHtml: (config) => renderReadingProgressHtml(config as never),
  },
  "language-switcher": {
    title: "Language switcher",
    description: "A language menu of real links, each named in its own language.",
    schema: languageSwitcherSchema,
    ...languageSwitcherDocs,
    renderHtml: (config) => renderLanguageSwitcherHtml(config as never),
  },
  "filter-bar": {
    title: "Filter bar",
    description: "Filter chips with removable pills and a spoken summary.",
    schema: filterBarSchema,
    ...filterBarDocs,
    renderHtml: (config) => renderFilterBarHtml(config as never),
  },
  "data-grid": {
    title: "Data grid",
    description: "Sortable table with a frozen header and keyboard-resizable columns.",
    schema: dataGridSchema,
    ...dataGridDocs,
    renderHtml: (config) => renderDataGridHtml(config as never),
  },
  "kanban": {
    title: "Kanban board",
    description: "A board whose cards move by keyboard, not only by dragging.",
    schema: kanbanSchema,
    ...kanbanDocs,
    renderHtml: (config) => renderKanbanHtml(config as never),
  },
  "confirm-dialog": {
    title: "Typed confirmation",
    description: "A destructive confirm dialog that asks you to type the phrase.",
    schema: confirmDialogSchema,
    ...confirmDialogDocs,
    renderHtml: (config) => renderConfirmDialogHtml(config as never),
  },
  "session-timeout": {
    title: "Session timeout",
    description: "An idle warning with a countdown and a way to stay signed in.",
    schema: sessionTimeoutSchema,
    ...sessionTimeoutDocs,
    renderHtml: (config) => renderSessionTimeoutHtml(config as never),
  },
  "unsaved-changes": {
    title: "Unsaved changes guard",
    description: "A guard that asks before leaving a form with unsaved text.",
    schema: unsavedChangesSchema,
    ...unsavedChangesDocs,
    renderHtml: (config) => renderUnsavedChangesHtml(config as never),
  },
  "offline-banner": {
    title: "Offline banner",
    description: "A polite offline notice with a retry and a back-online line.",
    schema: offlineBannerSchema,
    ...offlineBannerDocs,
    renderHtml: (config) => renderOfflineBannerHtml(config as never),
  },
  "shortcut-help": {
    title: "Shortcut help",
    description: "A keyboard shortcut sheet that opens on ? and stays out of fields.",
    schema: shortcutHelpSchema,
    ...shortcutHelpDocs,
    renderHtml: (config) => renderShortcutHelpHtml(config as never),
  },
  "pricing-table": {
    title: "Pricing table",
    description: "Plans with a billing cycle switch and no invented discounts.",
    schema: pricingTableSchema,
    ...pricingTableDocs,
    renderHtml: (config) => renderPricingTableHtml(config as never),
  },
  "stats-tiles": {
    title: "Stats tiles",
    description: "Dashboard tiles with changes written in words.",
    schema: statsTilesSchema,
    ...statsTilesDocs,
    renderHtml: (config) => renderStatsTilesHtml(config as never),
  },
  "timeline": {
    title: "Activity timeline",
    description: "An activity log with real time elements and a reveal button.",
    schema: timelineSchema,
    ...timelineDocs,
    renderHtml: (config) => renderTimelineHtml(config as never),
  },
  "comment-thread": {
    title: "Comment thread",
    description: "A comment thread with replies, a post box and announcements.",
    schema: commentThreadSchema,
    ...commentThreadDocs,
    renderHtml: (config) => renderCommentThreadHtml(config as never),
  },
  "product-card": {
    title: "Product card",
    description: "A product card with variant radio groups and stock in words.",
    schema: productCardSchema,
    ...productCardDocs,
    renderHtml: (config) => renderProductCardHtml(config as never),
  },
  "signature-pad": {
    title: "Signature pad",
    description: "A signature canvas with a typed name as a real alternative.",
    schema: signaturePadSchema,
    ...signaturePadDocs,
    renderHtml: (config) => renderSignaturePadHtml(config as never),
  },
  "code-block": {
    title: "Code block",
    description: "A copyable code block with a fallback when the clipboard is refused.",
    schema: codeBlockSchema,
    ...codeBlockDocs,
    renderHtml: (config) => renderCodeBlockHtml(config as never),
  },
  "toolbar": {
    title: "Toolbar",
    description: "A toolbar with one tab stop and arrow-key navigation.",
    schema: toolbarSchema,
    ...toolbarDocs,
    renderHtml: (config) => renderToolbarHtml(config as never),
  },
  "countdown": {
    title: "Countdown",
    description: "A countdown whose announcements do not talk over the reader.",
    schema: countdownSchema,
    ...countdownDocs,
    renderHtml: (config) => renderCountdownHtml(config as never),
  },
  "slot-picker": {
    title: "Booking slots",
    description: "A booking slot picker that is one choice, however many days it spans.",
    schema: slotPickerSchema,
    ...slotPickerDocs,
    renderHtml: (config) => renderSlotPickerHtml(config as never),
  },
  "wizard": {
    title: "Multi-step wizard",
    description: "A multi-step form with focus management and per-step validation.",
    schema: wizardSchema,
    ...wizardDocs,
    renderHtml: (config) => renderWizardHtml(config as never),
  },
} satisfies Record<string, RegistryEntry>;

export type RegistrySlug = keyof typeof registry;
export const isRegistrySlug = (slug: string): slug is RegistrySlug => Object.hasOwn(registry, slug);
