"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { OptionsPanel } from "@/components/options-panel";
import { Segmented } from "@/components/segmented";
import { TabList, tabPanelProps } from "@/components/tabs";
import { countInBrowser } from "@/lib/count-beacon";
import { applyConfig } from "@/lib/export";
import { frameworkFiles, frameworks, mainFile, markupOf, type FrameworkId } from "@/lib/framework-output";
import { directionOf, languageOf, translate } from "@/lib/languages";
import { fullBleed, partBySlug } from "@/lib/parts";
import { toSearchParams, type Schema } from "@/lib/schema";
import { zipInBrowser } from "@/lib/zip-browser";

export type Sources = { react: string; html: string; css: string; js: string };
export type KeyboardRow = [keys: string[], action: string];

type Props = {
  /** Registry name and file base name, e.g. "date-picker". */
  slug: string;
  schema: Schema;
  initialConfig: Record<string, unknown>;
  sources: Sources;
  /** The component's keyboard behaviour, shown as a pinout-style map. */
  keyboard: KeyboardRow[];
  /** Manual checks automated tests can't prove (screen readers, zoom, real devices). */
  checklist: string[];
  /** HTML-first components generate their markup from the options instead of shipping a fixed file. */
  vanillaHtml?: (config: Record<string, unknown>) => string;
};

type Output = "react" | "vanilla" | "frameworks";

/*
 * Only ever narrower than the bench, never wider, so this works on a phone too — where 320 is the
 * width WCAG 1.4.10 asks a page to survive, and the one worth checking a part at.
 */
const widths = [
  { value: "320px", label: "320" },
  { value: "375px", label: "Phone" },
  { value: "768px", label: "Tablet" },
  { value: "100%", label: "Full" },
];

const subscribeNever = () => () => {};

export function Editor({ slug, schema, initialConfig, sources, keyboard, checklist, vanillaHtml }: Props) {
  const idBase = useId();
  const part = partBySlug(slug);
  const [config, setConfig] = useState(initialConfig);
  const [output, setOutput] = useState<Output>("react");
  const [framework, setFramework] = useState<FrameworkId>("vue");
  const [width, setWidth] = useState("100%");
  const [benchTab, setBenchTab] = useState("keyboard");
  const [codeTab, setCodeTab] = useState("install");
  const [flash, setFlash] = useState({ keys: [] as string[], count: 0 });
  const [checked, toggleCheck] = useChecklist(slug);
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");

  const query = toSearchParams(schema, config).toString();
  // Captured once: the frame loads with the options the page opened with.
  const [initialQuery] = useState(() => toSearchParams(schema, initialConfig).toString());
  const js = sources.js === "" ? "" : applyConfig(sources.js, config);
  // The preview page says which language the part speaks, as the page it goes on would (D94).
  const language = languageOf(schema, config) ?? "en";
  const page = useMemo(() => ({ lang: language, dir: directionOf(language) }), [language]);
  const html = vanillaHtml ? vanillaHtml(config) : sources.html;
  // The component's name, as the React file exports it, names the framework files too (D92).
  const componentName = /export function ([A-Z]\w*)\(/.exec(sources.react)?.[1] ?? "Part";
  const frameworkName = frameworks.find((candidate) => candidate.id === framework)!.name;
  const files =
    output === "react"
      ? [{ name: `${slug}.tsx`, code: applyConfig(sources.react, config) }]
      : output === "frameworks"
        ? Object.entries(frameworkFiles(framework, slug, { name: componentName, markup: markupOf(html), css: sources.css, js }))
            .map(([name, code]) => ({ name, code }))
            // The component first: it is the file people open.
            .sort((a, b) => Number(b.name === mainFile(framework, slug, componentName)) - Number(a.name === mainFile(framework, slug, componentName)))
        : [
            { name: `${slug}.html`, code: html },
            { name: `${slug}.css`, code: sources.css },
            ...(js === "" ? [] : [{ name: `${slug}.js`, code: js }]),
          ];
  const codeTabs = [
    ...(output === "react" ? [{ id: "install", label: "Install" }] : []),
    ...files.map((file) => ({ id: file.name, label: file.name })),
  ];
  const activeCode = codeTabs.some((tab) => tab.id === codeTab) ? codeTab : codeTabs[0].id;
  const activeFile = files.find((file) => file.name === activeCode);
  const outputName = output === "react" ? "React + Tailwind" : output === "frameworks" ? frameworkName : "HTML/CSS/JS";

  function downloadFiles() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipInBrowser(Object.fromEntries(files.map((file) => [file.name, file.code]))));
    link.download = `${slug}-${framework}.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    countInBrowser("download", slug);
  }

  function apply(next: Record<string, unknown>) {
    const changedKeys = schema.map((option) => option.key).filter((key) => next[key] !== config[key]);
    setConfig(next);
    setFlash((previous) => ({ keys: changedKeys, count: previous.count + 1 }));
    const nextQuery = toSearchParams(schema, next).toString();
    window.history.replaceState(null, "", nextQuery ? `?${nextQuery}` : window.location.pathname);
  }

  return (
    <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside aria-label="Options" className="order-2 lg:sticky lg:top-4 lg:order-1">
        <OptionsPanel
          schema={schema}
          config={config}
          onChange={(key, value) => apply({ ...config, [key]: value })}
          onResetAll={() => apply(Object.fromEntries(schema.map((option) => [option.key, option.default])))}
          onLanguage={(next) => apply(translate(schema, config, next))}
        />
      </aside>

      <div className="order-1 min-w-0 space-y-4 sm:space-y-6 lg:order-2">
        {/* Test bench */}
        <section aria-labelledby={`${idBase}-bench-heading`} className="overflow-hidden rounded-lg border border-rule bg-paper">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-rule p-4">
            <div>
              <h2 id={`${idBase}-bench-heading`} className="font-display text-2xl leading-[1.05]">
                Test bench
              </h2>
              <p className="mt-1 text-sm text-ink-muted">Runs the exported code, not a mock-up.</p>
            </div>
            <div className="flex w-full flex-wrap items-end gap-x-4 gap-y-3 sm:w-auto">
              <div className="w-full max-w-full sm:w-[27rem]">
                <Segmented
                  name={`${idBase}-output`}
                  legend={<span className="text-sm">Output</span>}
                  value={output}
                  onChange={(value) => setOutput(value as Output)}
                  choices={[
                    { value: "react", label: "React + Tailwind" },
                    { value: "vanilla", label: "HTML/CSS/JS" },
                    { value: "frameworks", label: "Vue, Svelte, more" },
                  ]}
                />
              </div>
              {output === "frameworks" && (
                <div className="grid w-full max-w-full gap-1 text-sm sm:w-48">
                  <label htmlFor={`${idBase}-framework`}>Framework</label>
                  <select
                    id={`${idBase}-framework`}
                    value={framework}
                    onChange={(event) => setFramework(event.target.value as FrameworkId)}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-paper px-2 text-base"
                  >
                    {frameworks.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-full max-w-full sm:w-72">
                <Segmented
                  name={`${idBase}-width`}
                  legend={<span className="text-sm">Screen width</span>}
                  value={width}
                  onChange={setWidth}
                  choices={widths}
                />
              </div>
              <CopyButton text={() => window.location.href} label="Copy link" doneLabel="Link copied" />
            </div>
          </div>

          <div className="paper-grid px-4 py-10 sm:px-8">
            <div className="mx-auto transition-[max-width] duration-700 ease-out-expo" style={{ maxWidth: width }}>
              <p className="mb-2 flex justify-between gap-4 font-mono text-xs text-ink-muted">
                <span>
                  {part.name} · {outputName}
                </span>
                <span>{width === "100%" ? "Full width" : width}</span>
              </p>
              <div className="rounded-md border border-rule-strong bg-paper shadow-[0_14px_32px_-18px_rgb(22_18_31/0.4)]">
                {output === "react" ? (
                  <PreviewFrame slug={slug} title={part.name} config={config} page={page} initialQuery={initialQuery} />
                ) : (
                  <VanillaFrame
                    key={query}
                    // Every framework file wraps this same markup and script, so it is what they run.
                    title={`${part.name}, HTML/CSS/JS output`}
                    srcDoc={vanillaDocument(html, sources.css, js, config.theme === "dark", fullBleed.includes(slug), page)}
                  />
                )}
              </div>
            </div>
          </div>

          <TabList
            label="Accessibility"
            idBase={`${idBase}-bench`}
            value={benchTab}
            onChange={setBenchTab}
            tabs={[
              { id: "keyboard", label: "Keyboard map" },
              {
                id: "checklist",
                label: (
                  <>
                    Manual checks
                    <span className="font-mono text-xs text-ink-muted">
                      {checked.length}/{checklist.length}
                    </span>
                  </>
                ),
              },
            ]}
          />
          <div {...tabPanelProps(`${idBase}-bench`, benchTab)} className="p-4 sm:p-6">
            {benchTab === "keyboard" ? (
              <KeyboardMap rows={keyboard} />
            ) : (
              <Checklist items={checklist} checked={checked} onToggle={toggleCheck} />
            )}
          </div>
        </section>

        {/* Take it home */}
        <section aria-labelledby={`${idBase}-code-heading`} className="overflow-hidden rounded-lg border border-rule bg-paper">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 p-4">
            <div>
              <h2 id={`${idBase}-code-heading`} className="font-display text-2xl leading-[1.05]">
                Take it home
              </h2>
              <p className="mt-1 text-sm text-pretty text-ink-muted">
                {output === "react"
                  ? "React + Tailwind CSS v4: install with one command, or copy the file. Your options are already in it."
                  : output === "frameworks"
                    ? `A ${frameworkName} ${framework === "web-component" ? "custom element in one file" : "component"} with your options in it. It runs the HTML/CSS/JS output shown above, and passes the same tests. No library to install.`
                    : js === ""
                    ? "Plain HTML and CSS, no JavaScript at all. Paste the markup, ship the stylesheet."
                    : "Three plain files and no library. The HTML file shows where the CSS and JS go."}
              </p>
            </div>
            {/* Every file at once, as the one page they make: paste it into a file and it runs. */}
            {output === "frameworks" && (
              <button type="button" onClick={downloadFiles} className="btn-glass cursor-pointer text-sm">
                {files.length === 1 ? `Download ${files[0].name}` : `Download the ${files.length} files`}
              </button>
            )}
            {output === "vanilla" && (
              <CopyButton
                text={() => onePage(html, sources.css, js)}
                counted={slug}
                label={`Copy all ${files.length === 3 ? "three" : "two"} as one page`}
                doneLabel="The whole page is on the clipboard"
              />
            )}
          </div>
          <TabList label="Code" idBase={`${idBase}-code`} value={activeCode} onChange={setCodeTab} tabs={codeTabs} />
          <div {...tabPanelProps(`${idBase}-code`, activeCode)}>
            {activeFile ? (
              <CodeView slug={slug} name={activeFile.name} code={activeFile.code} flash={flash} />
            ) : (
              <InstallPanel slug={slug} command={`npx shadcn@latest add "${origin}/r/${slug}.json${query ? `?${query}` : ""}"`} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


/** Both outputs start at the same height, so switching between them does not move the page. */
const MIN_PREVIEW_HEIGHT = 480;

/** The React output runs on its own page in a frame, so its dialogs stay inside the bench. */
function PreviewFrame({
  slug,
  title,
  config,
  page,
  initialQuery,
}: {
  slug: string;
  title: string;
  config: Record<string, unknown>;
  page: { lang: string; dir: string };
  initialQuery: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_PREVIEW_HEIGHT);
  const [ready, setReady] = useState(false);
  // The frame keeps one URL for the session; later changes arrive by message.
  const [src] = useState(`/preview/${slug}${initialQuery ? `?${initialQuery}` : ""}`);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "preview-ready") setReady(true);
      if (event.data?.type === "preview-height") {
        setHeight(Math.min(760, Math.max(MIN_PREVIEW_HEIGHT, Number(event.data.height) + 4)));
      }
    }
    window.addEventListener("message", onMessage);
    // The frame says it is ready when it starts, which can be before this page listens (a production build
    // is quick): ask again, so the frame answers whichever of the two started first.
    frameRef.current?.contentWindow?.postMessage({ type: "preview-hello" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage({ type: "config", config, page }, window.location.origin);
  }, [config, page, ready]);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={`${title}, React + Tailwind output`}
      style={{ height: `${height}px` }}
      className="block w-full rounded-md"
    />
  );
}

/**
 * The HTML/CSS/JS output in a sandboxed frame. It can't be measured from outside (no shared origin),
 * so a preview-only script inside reports its content height, and the frame grows like the React one.
 */
function VanillaFrame({ title, srcDoc }: { title: string; srcDoc: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_PREVIEW_HEIGHT);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // A sandboxed frame's origin is "null", so check which window sent it instead.
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== "vanilla-height") return;
      setHeight(Math.min(760, Math.max(MIN_PREVIEW_HEIGHT, Number(event.data.height) + 4)));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      title={title}
      // Scripts and forms, but never this site's origin: the exported code runs as it would on a
      // plain page (forms and <form method="dialog"> included) and can't touch the editor.
      sandbox="allow-scripts allow-forms"
      style={{ height: `${height}px` }}
      className="block w-full rounded-md"
      srcDoc={srcDoc}
    />
  );
}

/** Preview only, never exported: reports the height of the page's content (not of the frame). */
const reportHeight = `<script>(function(){function send(){var b=document.body,bottom=0;for(var i=0;i<b.children.length;i++){var c=b.children[i];if(c.tagName==="SCRIPT"||getComputedStyle(c).position==="fixed")continue;bottom=Math.max(bottom,c.getBoundingClientRect().bottom+window.scrollY)}parent.postMessage({type:"vanilla-height",height:Math.ceil(bottom+parseFloat(getComputedStyle(b).paddingBottom))},"*")}var o=new ResizeObserver(send);for(var i=0;i<document.body.children.length;i++)o.observe(document.body.children[i]);send()})()</script>`;

/**
 * The exported files as the single page they add up to: the same markup, with the stylesheet and the
 * script written in where the two tags pointed at them. Nothing is added that was not exported.
 */
function onePage(html: string, css: string, js: string) {
  return html
    .replace(/ *<link rel="stylesheet" href="[^"]+">/, () => `    <style>
${css}
    </style>`)
    .replace(/ *<script src="[^"]+"><\/script>/, () => (js === "" ? "" : `    <script>
${js}
    </script>`));
}

/** Inlines the exported CSS and JS into the exported HTML page, so the frame runs the real files. */
function vanillaDocument(html: string, css: string, js: string, dark: boolean, bleed: boolean, page: { lang: string; dir: string }) {
  const colours = dark ? "background:#141019;color:#f6f5fa" : "background:#ffffff;color:#16121f";
  // The same padding as the React frame (24px, 32px from 640px), none for full-width parts.
  const padding = bleed ? "" : "body{padding:24px}@media (min-width:640px){body{padding:32px}}";
  return html
    .replace('<html lang="en">', () => `<html lang="${page.lang}" dir="${page.dir}">`)
    .replace(
      /<link rel="stylesheet" href="[^"]+">/,
      () => `<style>body{box-sizing:border-box;margin:0;min-height:100dvh;font-family:system-ui,sans-serif;${colours}}${padding}${css}</style>`,
    )
    .replace(/<script src="[^"]+"><\/script>/, () => (js === "" ? "" : `<script>${js}</script>`))
    .replace("</body>", () => `${reportHeight}\n  </body>`);
}

function InstallPanel({ slug, command }: { slug: string; command: string }) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="glass flex flex-col items-stretch gap-3 rounded-2xl p-3 text-ink sm:flex-row sm:items-center sm:pl-4">
        <code className="min-w-0 flex-1 font-mono text-sm break-words">{command}</code>
        <CopyButton text={() => command} label="Copy install command" doneLabel="Command copied" tone="accent" counted={slug} />
      </div>
      <p className="text-sm text-pretty text-ink-muted">
        Run it in your project root. It writes <code className="font-mono text-ink">components/{slug}.tsx</code> with
        the options you set here. Needs Tailwind CSS v4 and a project set up for the shadcn CLI (
        <code className="font-mono text-ink">npx shadcn@latest init</code>).
      </p>
    </div>
  );
}

function CodeView({ slug, name, code, flash }: { slug: string; name: string; code: string; flash: { keys: string[]; count: number } }) {
  const lines = code.split("\n");
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-sunk px-4 py-2">
        <span className="font-mono text-xs text-ink-muted">
          {lines.length} lines · changed options flash orange
        </span>
        <CopyButton text={() => code} label={`Copy ${name}`} doneLabel={`${name} copied`} counted={slug} />
      </div>
      <pre
        tabIndex={0}
        aria-label={`${name} source code`}
        className="max-h-[32rem] overflow-auto py-3 text-xs leading-5 [counter-reset:line]"
      >
        <code>
          {lines.map((line, i) => {
            const changed = flash.keys.some((key) => line.trimStart().startsWith(`"${key}":`));
            return (
              <span
                // A new key restarts the flash animation on every change.
                key={changed ? `${i}-${flash.count}` : i}
                className={`relative block pr-4 pl-14 [counter-increment:line] before:absolute before:left-0 before:w-10 before:pr-1 before:text-right before:text-ink-muted before:content-[counter(line)] ${changed ? "flash-line" : ""}`}
              >
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

function CopyButton({
  text,
  label,
  doneLabel,
  tone = "paper",
  counted,
}: {
  text: () => string;
  label: string;
  doneLabel: string;
  tone?: "paper" | "accent";
  /** The part to count a copy for (D90); unset, nothing is counted (a link, say). */
  counted?: string;
}) {
  const [said, setSaid] = useState<"" | "done" | "failed">("");

  async function copy() {
    const value = text();
    try {
      await navigator.clipboard.writeText(value);
      setSaid("done");
    } catch {
      /*
       * There is no clipboard API at all on a page served over plain http — which is what you get
       * opening the dev server from a phone on the same network — and it can be refused anywhere.
       * The old selection copy still works in both cases.
       */
      if (!oldWayCopy(value)) {
        setSaid("failed");
        setTimeout(() => setSaid(""), 2500);
        return;
      }
      setSaid("done");
    }
    if (counted) countInBrowser("copy", counted);
    setTimeout(() => setSaid(""), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={
          tone === "accent"
            ? "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-strong"
            : "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-rule-strong bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:bg-paper-sunk"
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
          {said === "done" ? (
            <path d="m5 12 5 5L20 7" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </>
          )}
        </svg>
        {said === "done" ? "Copied" : said === "failed" ? "Press Ctrl+C instead" : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {said === "done" ? doneLabel : said === "failed" ? "The browser refused the clipboard. Select the text and copy it by hand." : ""}
      </span>
    </>
  );
}

/** The pre-clipboard-API copy: a field off the side of the page, selected and copied. */
function oldWayCopy(value: string) {
  const field = document.createElement("textarea");
  field.value = value;
  field.readOnly = true;
  field.style.cssText = "position:fixed;top:0;left:-9999px";
  document.body.append(field);
  field.select();
  let done = false;
  try {
    done = document.execCommand("copy");
  } catch {
    done = false;
  }
  field.remove();
  return done;
}

function KeyboardMap({ rows }: { rows: KeyboardRow[] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Keyboard map</caption>
      <thead>
        <tr className="border-b border-rule font-mono text-xs text-ink-muted uppercase">
          <th scope="col" className="pr-4 pb-2 font-medium">
            Keys
          </th>
          <th scope="col" className="pb-2 font-medium">
            What happens
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([keys, action]) => (
          <tr key={action} className="border-b border-rule last:border-0">
            <td className="py-2.5 pr-4 align-top">
              <span className="flex flex-wrap items-center gap-1">
                {keys.map((key, i) => (
                  <Fragment key={key}>
                    {i > 0 && <span className="text-ink-muted">or</span>}
                    <kbd className="rounded border border-rule-strong bg-paper-sunk px-1.5 py-0.5 font-mono text-xs whitespace-nowrap shadow-[inset_0_-1px_0_var(--color-rule-strong)]">
                      {key}
                    </kbd>
                  </Fragment>
                ))}
              </span>
            </td>
            <td className="py-2.5 text-pretty text-ink-muted">{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Checklist({ items, checked, onToggle }: { items: string[]; checked: number[]; onToggle: (index: number) => void }) {
  return (
    <div>
      <p className="text-sm text-pretty text-ink-muted">
        Automated tests already cover axe and keyboard flows on every output. These need a person: try them on both
        outputs. Ticks are saved in this browser.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => {
          const done = checked.includes(index);
          return (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(index)}
                  className="mt-0.5 size-4 shrink-0 accent-(--color-accent)"
                />
                <span className="flex-1 text-pretty">{item}</span>
                {done && (
                  <span
                    aria-hidden="true"
                    className="stamp-in shrink-0 rounded border-2 border-pass px-1.5 font-mono text-xs font-bold tracking-wider text-pass uppercase"
                  >
                    Pass
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Checklist ticks: per-browser convenience only. Falls back to memory when storage is blocked.
const storageListeners = new Set<() => void>();
const memoryStore = new Map<string, string>();

function subscribeStorage(listener: () => void) {
  storageListeners.add(listener);
  return () => {
    storageListeners.delete(listener);
  };
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return memoryStore.get(key) ?? "[]";
  }
}

function useChecklist(slug: string) {
  const key = `checklist:${slug}`;
  const checked: number[] = JSON.parse(useSyncExternalStore(subscribeStorage, () => readStorage(key), () => "[]"));

  function toggle(index: number) {
    const next = JSON.stringify(checked.includes(index) ? checked.filter((i) => i !== index) : [...checked, index]);
    try {
      localStorage.setItem(key, next);
    } catch {
      memoryStore.set(key, next);
    }
    storageListeners.forEach((listener) => listener());
  }

  return [checked, toggle] as const;
}
