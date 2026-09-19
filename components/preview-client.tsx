"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Cta, type CtaConfig } from "@/registry/cta/react/cta";
import { DatePicker, type DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { SiteFooter as FooterPart, type FooterConfig } from "@/registry/footer/react/footer";
import { ContactForm, type FormConfig } from "@/registry/form/react/form";
import { SiteHeader as HeaderPart, type HeaderConfig } from "@/registry/header/react/header";
import { MegaMenu, type MegaMenuConfig } from "@/registry/mega-menu/react/mega-menu";
import { Modal, type ModalAction, type ModalConfig } from "@/registry/modal/react/modal";
import { SearchableSelect, type SearchableSelectConfig } from "@/registry/searchable-select/react/searchable-select";
import { Tabs, type TabsConfig } from "@/registry/tabs/react/tabs";

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
        {slug === "date-picker" && <DatePicker config={config as unknown as DatePickerConfig} />}
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
