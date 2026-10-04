"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Segmented } from "@/components/segmented";
import { luminance } from "@/lib/html";
import { encodePage, fromTemplate } from "@/lib/page-builder";
import { partBySlug } from "@/lib/parts";
import { countInBrowser } from "@/lib/count-beacon";
import { templateHtml, templateInstallCommand, templateReactSource } from "@/lib/template-output";
import { defaultOptions, optionsToParams, templateById, type TemplateOptions } from "@/lib/templates";

export type Check = { ok: boolean; text: string };

const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Checks the page in the frame as a whole: what a part on its own cannot get wrong, but a page can. The
 * full axe and keyboard tests run on every template in e2e/templates.spec.ts; these run live, here.
 */
export function checkPage(doc: Document, options: Pick<TemplateOptions, "brand" | "theme">): Check[] {
  const h1 = doc.querySelectorAll("h1").length;
  const levels = [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading) => Number(heading.tagName[1]));
  const jump = levels.find((level, index) => index > 0 && level - levels[index - 1] > 1);
  const banner = [...doc.querySelectorAll("header")].some((el) => !el.closest("main, article, aside, nav, section"));
  const footer = [...doc.querySelectorAll("footer")].some((el) => !el.closest("main, article, aside, nav, section"));
  const main = doc.querySelectorAll("main").length;
  const focusable = [
    ...doc.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, summary, [tabindex]"),
  ].filter((el) => el.tabIndex >= 0 && !el.closest("[hidden], [inert]"));
  const first = focusable[0];
  const skip = first?.getAttribute("href")?.startsWith("#") && doc.querySelector(first.getAttribute("href")!) !== null;
  const fields = [...doc.querySelectorAll<HTMLInputElement>("input:not([type=hidden]), select, textarea")];
  const unlabelled = fields.filter((field) => field.labels?.length === 0 && !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby"));
  const surface = options.theme === "dark" ? "#141019" : "#ffffff";
  const asText = ratio(options.brand, surface);
  const onBrand = Math.max(ratio(options.brand, "#000000"), ratio(options.brand, "#ffffff"));
  return [
    { ok: h1 === 1, text: h1 === 1 ? "One h1 on the page" : `${h1} h1 headings: a page needs exactly one` },
    { ok: !jump, text: jump ? `A heading jumps to h${jump}, skipping a level` : "Headings never skip a level" },
    {
      ok: main === 1,
      text: `Landmarks: ${[banner && "banner", main === 1 && "main", footer && "content info"].filter(Boolean).join(", ")}`,
    },
    { ok: Boolean(skip), text: skip ? "The first thing Tab reaches skips to the content" : "The first tab stop is not a skip link" },
    {
      ok: unlabelled.length === 0,
      text: unlabelled.length === 0 ? `Every field has a label (${fields.length} fields)` : `${unlabelled.length} fields have no label`,
    },
    { ok: true, text: `${focusable.length} tab stops` },
    { ok: onBrand >= 4.5, text: `Text on your colour: ${onBrand.toFixed(1)}:1 (each part picks black or white)` },
    {
      ok: asText >= 4.5,
      text:
        asText >= 4.5
          ? `Your colour as text on the page: ${asText.toFixed(1)}:1`
          : `Your colour as text on the page is only ${asText.toFixed(1)}:1. Choose a darker shade if links use it`,
    },
  ];
}

/**
 * Preview only, never exported: tells the editor how tall the HTML page is. To "*": a srcdoc page's own
 * origin reads as "null". The editor only listens to its own frame, and a height is no secret.
 */
const reportHeight = `<script>new ResizeObserver(function(){parent.postMessage({type:"template-height",height:Math.ceil(document.documentElement.scrollHeight)},"*")}).observe(document.body)</script>`;

type PageFieldValues = Pick<TemplateOptions, "name" | "brand" | "theme">;

/** What every part on a page shares: the name, a brand colour and a theme. The template editor and the page builder both ask. */
export function PageFields({ options, onChange }: { options: PageFieldValues; onChange: (patch: Partial<PageFieldValues>) => void }) {
  const uid = useId();
  return (
    <>
      <label className="grid gap-1.5 text-sm font-medium">
        Product name
        <input
          value={options.name}
          maxLength={40}
          onChange={(event) => onChange({ name: event.target.value })}
          className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-3 text-base font-normal"
        />
      </label>
      <div className="grid gap-1.5 text-sm font-medium">
        <label htmlFor={`${uid}-brand`}>Brand colour</label>
        <div className="flex items-center gap-2">
          <input
            id={`${uid}-brand`}
            type="color"
            value={options.brand}
            onChange={(event) => onChange({ brand: event.target.value })}
            className="h-11 w-16 cursor-pointer rounded-lg border border-rule-strong bg-paper p-1"
          />
          <span className="font-mono text-sm font-normal text-ink-muted">{options.brand}</span>
        </div>
        <p className="text-xs font-normal text-ink-muted">Every part takes it as its accent.</p>
      </div>
      <Segmented
        name={`${uid}-theme`}
        legend="Colour scheme"
        value={options.theme}
        columns={3}
        choices={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
        onChange={(theme) => onChange({ theme: theme as TemplateOptions["theme"] })}
      />
    </>
  );
}

const subscribeNever = () => () => {};

export function TemplateEditor({
  id,
  sources,
  exportNames,
}: {
  id: string;
  sources: Record<string, { css: string; js: string }>;
  exportNames: Record<string, string>;
}) {
  // By id: a template holds functions, which cannot cross from the server page to this component.
  const template = templateById(id)!;
  const uid = useId();
  const [options, setOptions] = useState(() => defaultOptions(template));
  const [output, setOutput] = useState<"react" | "html">("react");
  const [width, setWidth] = useState("100%");
  const [xray, setXray] = useState(false);
  const [codeTab, setCodeTab] = useState<"install" | "page" | "html">("install");
  const [height, setHeight] = useState(900);
  const [checks, setChecks] = useState<Check[]>([]);
  const [copied, setCopied] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");
  const [initialQuery] = useState(() => optionsToParams(defaultOptions(template)).toString());

  const html = templateHtml(template, options, sources);
  const code = {
    install: templateInstallCommand(template, options, origin || "https://build-components.devstash.me"),
    page: templateReactSource(template, options, exportNames),
    html,
  }[codeTab];
  const optional = template.sections.filter((section) => section.optional);

  // The React frame takes new options by message; it says when it is ready for the first lot.
  useEffect(() => {
    const send = () =>
      frameRef.current?.contentWindow?.postMessage({ type: "template-options", state: options, xray }, window.location.origin);
    send();
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "template-ready") send();
      if (event.data?.type === "template-height") setHeight(Math.max(480, event.data.height));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [options, xray, output]);

  // Checks the page a moment after it settles, whichever output is showing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const doc = frameRef.current?.contentDocument;
      if (doc?.body) setChecks(checkPage(doc, options));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [options, output, height]);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      countInBrowser("copy", `template:${template.id}`);
    } catch {
      setCopied("Copying is blocked here: select the code instead");
    }
    window.setTimeout(() => setCopied(""), 2500);
  }

  function download() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    link.download = `${template.id}.html`;
    link.click();
    countInBrowser("download", `template:${template.id}`);
    URL.revokeObjectURL(link.href);
  }

  const set = (patch: Partial<TemplateOptions>) => setOptions((current) => ({ ...current, ...patch }));

  return (
    <div className="page-wrap grid grid-cols-[minmax(0,1fr)] gap-10 pt-10 pb-[clamp(4rem,9vw,8rem)] lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-6 self-start lg:sticky lg:top-4">
      <form onSubmit={(event) => event.preventDefault()} className="glass grid grid-cols-[minmax(0,1fr)] content-start gap-6 rounded-2xl p-6">
        <h2 className="font-display text-3xl leading-none">Set it up</h2>
        <PageFields options={options} onChange={set} />
        {optional.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Sections</legend>
            {optional.map((section) => (
              <label key={section.slug} className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={options.sections.includes(section.slug)}
                  onChange={(event) =>
                    set({
                      sections: event.target.checked
                        ? [...options.sections, section.slug]
                        : options.sections.filter((slug) => slug !== section.slug),
                    })
                  }
                  className="size-4.5 accent-(--color-accent)"
                />
                {partBySlug(section.slug).name}
              </label>
            ))}
          </fieldset>
        )}
      </form>
        <section aria-labelledby={`${uid}-checks`} className="glass rounded-2xl p-6">
          <h2 id={`${uid}-checks`} className="font-display text-3xl leading-none">
            Page checks
          </h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {checks.map((check) => (
              <li key={check.text} className="flex gap-2.5">
                <span
                  className={`shrink-0 self-start rounded border-2 px-1.5 font-mono text-[0.6875rem] font-bold tracking-wider uppercase ${check.ok ? "border-pass text-pass" : "border-accent text-link"}`}
                >
                  {check.ok ? "Pass" : "Look"}
                </span>
                {check.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">
            Run here on the page above, as you change it. Every template is also tested with axe and the
            keyboard, as React and as HTML, in Chromium, WebKit and an emulated iPhone.
          </p>
        </section>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <Segmented
              name={`${uid}-output`}
              legend="Output"
              value={output}
              choices={[
                { value: "react", label: "React + Tailwind" },
                { value: "html", label: "One HTML file" },
              ]}
              onChange={(value) => setOutput(value as "react" | "html")}
            />
            <Segmented
              name={`${uid}-width`}
              legend="Screen width"
              value={width}
              choices={[
                { value: "375px", label: "Phone" },
                { value: "768px", label: "Tablet" },
                { value: "100%", label: "Full" },
              ]}
              onChange={setWidth}
            />
          </div>
          {output === "react" && (
            <label className="glass flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium">
              <input type="checkbox" checked={xray} onChange={(event) => setXray(event.target.checked)} className="size-4 accent-(--color-accent)" />
              X-ray: name every part
            </label>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_30px_60px_-30px_var(--color-shadow)]">
          <iframe
            key={output}
            ref={frameRef}
            title={`${template.name} preview, ${output === "react" ? "React" : "HTML"} output`}
            src={output === "react" ? `/preview-template/${template.id}?${initialQuery}` : undefined}
            srcDoc={output === "html" ? html.replace("</body>", `${reportHeight}</body>`) : undefined}
            style={{ width, height: `min(78vh, ${height}px)`, maxWidth: "100%" }}
            className="mx-auto block border-0 transition-[width] duration-500 ease-spring"
          />
        </div>

        <div className="mt-8">

          <section aria-labelledby={`${uid}-take`} className="glass min-w-0 rounded-2xl p-6">
            <h2 id={`${uid}-take`} className="font-display text-3xl leading-none">
              Take it home
            </h2>
            <Segmented
              name={`${uid}-code`}
              legend="Show"
              hideLegend
              value={codeTab}
              choices={[
                { value: "install", label: "Install" },
                { value: "page", label: "page.tsx" },
                { value: "html", label: `${template.id}.html` },
              ]}
              onChange={(value) => setCodeTab(value as typeof codeTab)}
            />
            <pre
              tabIndex={0}
              aria-label="Code, scrollable"
              className="mt-3 max-h-72 overflow-auto rounded-xl bg-[#1c1a17] p-4 font-mono text-xs leading-relaxed text-[#f1ede6]"
            >
              <code>{code}</code>
            </pre>
            {codeTab === "install" && (
              <p className="mt-2 text-xs text-ink-muted">
                Installs every part with your options already set, and writes app/{template.id}/page.tsx. Needs
                Tailwind CSS v4 and a project set up for the shadcn CLI.
              </p>
            )}
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => copy(code, "Copied")} className="btn-accent cursor-pointer text-sm">
                Copy
              </button>
              <button type="button" onClick={download} className="btn-glass cursor-pointer text-sm">
                Download the HTML page
              </button>
              <a href={`/build#p=${encodePage(fromTemplate(template, options))}`} className="btn-glass text-sm">
                Keep building it
              </a>
              <span role="status" className="text-sm text-ink-muted">
                {copied}
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
