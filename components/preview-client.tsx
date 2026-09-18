"use client";

import { useEffect, useRef, useState } from "react";
import { Cta, type CtaConfig } from "@/registry/cta/react/cta";
import { DatePicker, type DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { ContactForm, type FormConfig } from "@/registry/form/react/form";
import { SiteHeader as HeaderPart, type HeaderConfig } from "@/registry/header/react/header";
import { Modal, type ModalAction, type ModalConfig } from "@/registry/modal/react/modal";
import { SearchableSelect, type SearchableSelectConfig } from "@/registry/searchable-select/react/searchable-select";

type Config = Record<string, unknown>;

export function PreviewClient({ slug, initialConfig }: { slug: string; initialConfig: Config }) {
  const [config, setConfig] = useState(initialConfig);
  const [lastAction, setLastAction] = useState<ModalAction | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // The editor sends new options as they change, instead of reloading this page.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "config") setConfig(event.data.config as Config);
    }
    window.addEventListener("message", onMessage);
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
    <div ref={boxRef} className={slug === "cta" || slug === "header" ? "" : "p-6 sm:p-8"}>
      {slug === "date-picker" && <DatePicker config={config as unknown as DatePickerConfig} />}
      {slug === "cta" && <Cta config={config as unknown as CtaConfig} />}
      {slug === "header" && <HeaderPart config={config as unknown as HeaderConfig} />}
      {slug === "form" && <ContactForm config={config as unknown as FormConfig} />}
      {slug === "searchable-select" && <SearchableSelect config={config as unknown as SearchableSelectConfig} />}
      {slug === "modal" && (
        <>
          <Modal config={config as unknown as ModalConfig} onAction={setLastAction} />
          <p className="mt-3 font-mono text-xs text-neutral-600" aria-live="polite">
            Last result: {lastAction ?? "not closed yet"}
          </p>
        </>
      )}
    </div>
  );
}
