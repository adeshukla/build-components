"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Part } from "@/components/preview-client";
import { partBySlug } from "@/lib/parts";
import { resolve, templateById, type Template, type TemplateOptions } from "@/lib/templates";

const surfaces = { light: { background: "#ffffff", color: "#16121f" }, dark: { background: "#141019", color: "#f6f5fa" } };
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

/**
 * A template rendered from its real parts: the React output, laid out exactly as the exported page.tsx
 * lays it out (lib/template-output.ts). With the X-ray on, every part is outlined and named.
 */
export function TemplatePage({ template, options, xray = false }: { template: Template; options: TemplateOptions; xray?: boolean }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = options.theme === "dark" || (options.theme === "system" && systemDark);
  const sections = resolve(template, options);

  const render = (section: (typeof sections)[number]) => {
    const part = <Part slug={section.slug} config={section.config} />;
    return (
      <div
        key={section.slug}
        data-part={section.slug}
        className={`relative min-w-0 ${xray ? "outline-2 -outline-offset-2 outline-[#c2410c] outline-dashed" : ""}`}
      >
        {xray && (
          <span className="pointer-events-none absolute top-2 left-2 z-50 rounded-full bg-[#1c1a17] px-2.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-white">
            {partBySlug(section.slug).name}
          </span>
        )}
        {section.bleed ? (
          part
        ) : (
          <div className="px-6 py-10 sm:px-8">{section.narrow ? <div className="mx-auto max-w-2xl">{part}</div> : part}</div>
        )}
      </div>
    );
  };
  const region = (name: string) => sections.filter((section) => section.region === name).map(render);
  const side = region("side");
  const main = (
    <main id="main" tabIndex={-1} className="min-w-0 outline-none">
      {region("main")}
    </main>
  );

  return (
    <div style={surfaces[dark ? "dark" : "light"]} className="min-h-dvh">
      {region("top")}
      {side.length > 0 ? (
        <div className="md:grid md:grid-cols-[auto_1fr]">
          <div>{side}</div>
          {main}
        </div>
      ) : (
        main
      )}
      {region("bottom")}
    </div>
  );
}

/**
 * The preview page inside the template editor's frame. It opens with the options in its address, then
 * takes new ones from the editor by postMessage, and reports its height so the frame fits it.
 */
export function TemplatePreview({ id, initialOptions }: { id: string; initialOptions: TemplateOptions }) {
  // By id: a template holds functions, which cannot cross from the server page to this component.
  const template = templateById(id)!;
  const [options, setOptions] = useState(initialOptions);
  const [xray, setXray] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "template-options") return;
      setOptions(event.data.options);
      setXray(Boolean(event.data.xray));
    }
    window.addEventListener("message", onMessage);
    boxRef.current?.setAttribute("data-ready", "true");
    window.parent?.postMessage({ type: "template-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const report = () =>
      window.parent?.postMessage(
        { type: "template-height", height: Math.ceil(box.getBoundingClientRect().height) },
        window.location.origin,
      );
    const observer = new ResizeObserver(report);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef}>
      <TemplatePage template={template} options={options} xray={xray} />
    </div>
  );
}
