"use client";

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
      if (event.data?.type === "config") setConfig(event.data.config as Config);
    }
    window.addEventListener("message", onMessage);
    // Tell the editor we are listening; a config sent before this would be lost.
    window.parent?.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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
        className={["cta", "header", "footer", "mega-menu"].includes(slug) ? "" : "p-6 sm:p-8"}
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
