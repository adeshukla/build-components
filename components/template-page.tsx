"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Part } from "@/components/preview-client";
import { partBySlug } from "@/lib/parts";
import { decodePage, pageTemplate, type BuiltPage } from "@/lib/page-builder";
import { resolve, sectionFrame, templateById, type Template, type TemplateOptions } from "@/lib/templates";

const surfaces = { light: { background: "#ffffff", color: "#16121f" }, dark: { background: "#141019", color: "#f6f5fa" } };
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

const subscribeNever = () => () => {};

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
    const frame = sectionFrame(section);
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
        {frame.outer || frame.inner ? <div className={frame.outer}>{frame.inner ? <div className={frame.inner}>{part}</div> : part}</div> : part}
      </div>
    );
  };
  const region = (name: string) => sections.filter((section) => section.region === name).map(render);
  const side = region("side");
  const main = (
    <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
      {region("main")}
    </main>
  );

  return (
    // A column, so the footer sits at the bottom of a page shorter than the screen.
    <div style={surfaces[dark ? "dark" : "light"]} className="flex min-h-dvh flex-col">
      {region("top")}
      {side.length > 0 ? (
        <div className="flex-1 md:grid md:grid-cols-[auto_1fr]">
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
 * The frame side of an editor's preview: says when it is ready, takes new state by postMessage, and
 * reports its height so the frame fits it. Shared by the template editor and the page builder.
 */
function useFrameState<T>(type: string, initial: T) {
  const [state, setState] = useState(initial);
  const [xray, setXray] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== type) return;
      setState(event.data.state);
      setXray(Boolean(event.data.xray));
    }
    window.addEventListener("message", onMessage);
    boxRef.current?.setAttribute("data-ready", "true");
    window.parent?.postMessage({ type: "template-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [type]);

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

  return { state, xray, boxRef };
}

/** The preview page inside the template editor's frame. It opens with the options in its address. */
export function TemplatePreview({ id, initialOptions }: { id: string; initialOptions: TemplateOptions }) {
  // By id: a template holds functions, which cannot cross from the server page to this component.
  const template = templateById(id)!;
  const { state: options, xray, boxRef } = useFrameState("template-options", initialOptions);
  return (
    <div ref={boxRef}>
      <TemplatePage template={template} options={options} xray={xray} />
    </div>
  );
}

/** The preview page inside the page builder's frame (D80). It opens empty and waits for the page. */
export function BuiltPagePreview() {
  const { state, xray, boxRef } = useFrameState<BuiltPage | null>("built-page", null);
  // Opened in a tab of its own ("Open in a new tab"), the page comes in the address instead.
  const hash = useSyncExternalStore(subscribeNever, () => window.location.hash, () => "");
  const page = state ?? (hash ? decodePage(new URLSearchParams(hash.slice(1)).get("p") ?? "") : null);
  const built = page && pageTemplate(page);
  return (
    <div ref={boxRef}>
      {built && built.template.sections.length > 0 ? (
        <TemplatePage template={built.template} options={built.options} xray={xray} />
      ) : (
        <p className="grid min-h-[480px] place-items-center p-8 text-center text-[#56514a]">
          Your page shows here. Add a part to start.
        </p>
      )}
    </div>
  );
}
