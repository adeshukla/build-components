"use client";

import { Fragment, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { OptionsPanel } from "@/components/options-panel";
import { Segmented } from "@/components/segmented";
import { TabList, tabPanelProps } from "@/components/tabs";
import { applyConfig } from "@/lib/export";
import { partBySlug } from "@/lib/parts";
import { toSearchParams, type Schema } from "@/lib/schema";

export type Sources = { react: string; html: string; css: string; js: string };
export type KeyboardRow = [keys: string[], action: string];

type Props = {
  /** Registry name and file base name, e.g. "date-picker". */
  slug: string;
  schema: Schema;
  initialConfig: Record<string, unknown>;
  sources: Sources;
  renderPreview: (config: Record<string, unknown>) => ReactNode;
  /** The component's keyboard behaviour, shown as a pinout-style map. */
  keyboard: KeyboardRow[];
  /** Manual checks automated tests can't prove (screen readers, zoom, real devices). */
  checklist: string[];
};

type Output = "react" | "vanilla";

const widths = [
  { value: "375px", label: "Phone" },
  { value: "768px", label: "Tablet" },
  { value: "100%", label: "Desktop" },
];

const subscribeNever = () => () => {};

export function Editor({ slug, schema, initialConfig, sources, renderPreview, keyboard, checklist }: Props) {
  const idBase = useId();
  const part = partBySlug(slug);
  const [config, setConfig] = useState(initialConfig);
  const [output, setOutput] = useState<Output>("react");
  const [width, setWidth] = useState("100%");
  const [benchTab, setBenchTab] = useState("keyboard");
  const [codeTab, setCodeTab] = useState("install");
  const [flash, setFlash] = useState({ keys: [] as string[], count: 0 });
  const [checked, toggleCheck] = useChecklist(slug);
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");

  const query = toSearchParams(schema, config).toString();
  const js = applyConfig(sources.js, config);
  const files =
    output === "react"
      ? [{ name: `${slug}.tsx`, code: applyConfig(sources.react, config) }]
      : [
          { name: `${slug}.html`, code: sources.html },
          { name: `${slug}.css`, code: sources.css },
          { name: `${slug}.js`, code: js },
        ];
  const codeTabs = [
    ...(output === "react" ? [{ id: "install", label: "Install" }] : []),
    ...files.map((file) => ({ id: file.name, label: file.name })),
  ];
  const activeCode = codeTabs.some((tab) => tab.id === codeTab) ? codeTab : codeTabs[0].id;
  const activeFile = files.find((file) => file.name === activeCode);
  const outputName = output === "react" ? "React + Tailwind" : "HTML/CSS/JS";

  function apply(next: Record<string, unknown>) {
    const changedKeys = schema.map((option) => option.key).filter((key) => next[key] !== config[key]);
    setConfig(next);
    setFlash((previous) => ({ keys: changedKeys, count: previous.count + 1 }));
    const nextQuery = toSearchParams(schema, next).toString();
    window.history.replaceState(null, "", nextQuery ? `?${nextQuery}` : window.location.pathname);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside aria-label="Options" className="lg:sticky lg:top-4">
        <OptionsPanel
          schema={schema}
          config={config}
          onChange={(key, value) => apply({ ...config, [key]: value })}
          onResetAll={() => apply(Object.fromEntries(schema.map((option) => [option.key, option.default])))}
        />
      </aside>

      <div className="min-w-0 space-y-6">
        {/* Test bench */}
        <section aria-labelledby={`${idBase}-bench-heading`} className="overflow-hidden rounded-lg border border-rule bg-paper">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-rule p-4">
            <div>
              <h2 id={`${idBase}-bench-heading`} className="font-display text-2xl leading-none font-semibold uppercase">
                Test bench
              </h2>
              <p className="mt-1 text-sm text-ink-muted">Runs the exported code, not a mock-up.</p>
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <div className="w-72 max-w-full">
                <Segmented
                  name={`${idBase}-output`}
                  legend={<span className="text-sm">Output</span>}
                  value={output}
                  onChange={(value) => setOutput(value as Output)}
                  choices={[
                    { value: "react", label: "React + Tailwind" },
                    { value: "vanilla", label: "HTML/CSS/JS" },
                  ]}
                />
              </div>
              <div className="w-64 max-w-full">
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
                  {part.partNumber} · {outputName}
                </span>
                <span>{width === "100%" ? "Full width" : width}</span>
              </p>
              <div className="rounded-md border border-rule-strong bg-paper shadow-[0_14px_32px_-18px_rgb(22_18_31/0.4)]">
                {output === "react" ? (
                  // Remount on config change so internal state never mixes two configs.
                  <div key={query} className="min-h-44 p-6 sm:p-8">
                    {renderPreview(config)}
                  </div>
                ) : (
                  <iframe
                    key={query}
                    title={`${part.name}, HTML/CSS/JS output`}
                    sandbox="allow-scripts"
                    className="block h-[30rem] w-full rounded-md"
                    srcDoc={vanillaDocument(sources.html, sources.css, js)}
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
          <div className="p-4">
            <h2 id={`${idBase}-code-heading`} className="font-display text-2xl leading-none font-semibold uppercase">
              Take it home
            </h2>
            <p className="mt-1 text-sm text-pretty text-ink-muted">
              {output === "react"
                ? "React + Tailwind CSS v4: install with one command, or copy the file. Your options are already in it."
                : "Three plain files and no library. The HTML file shows where the CSS and JS go."}
            </p>
          </div>
          <TabList label="Code" idBase={`${idBase}-code`} value={activeCode} onChange={setCodeTab} tabs={codeTabs} />
          <div {...tabPanelProps(`${idBase}-code`, activeCode)}>
            {activeFile ? (
              <CodeView name={activeFile.name} code={activeFile.code} flash={flash} />
            ) : (
              <InstallPanel slug={slug} command={`npx shadcn@latest add "${origin}/r/${slug}.json${query ? `?${query}` : ""}"`} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Inlines the exported CSS and JS into the exported HTML page, so the frame runs the real files. */
function vanillaDocument(html: string, css: string, js: string) {
  return html
    .replace(
      /<link rel="stylesheet" href="[^"]+">/,
      () => `<style>body{margin:0;padding:32px;font-family:system-ui,sans-serif;color:#16121f}${css}</style>`,
    )
    .replace(/<script src="[^"]+"><\/script>/, () => `<script>${js}</script>`);
}

function InstallPanel({ slug, command }: { slug: string; command: string }) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="on-board flex flex-col items-stretch gap-3 rounded-md bg-board p-3 text-silk sm:flex-row sm:items-center sm:pl-4">
        <code className="min-w-0 flex-1 font-mono text-sm break-words">{command}</code>
        <CopyButton text={() => command} label="Copy install command" doneLabel="Command copied" tone="board" />
      </div>
      <p className="text-sm text-pretty text-ink-muted">
        Run it in your project root. It writes <code className="font-mono text-ink">components/{slug}.tsx</code> with
        the options you set here. Needs Tailwind CSS v4 and a project set up for the shadcn CLI (
        <code className="font-mono text-ink">npx shadcn@latest init</code>).
      </p>
    </div>
  );
}

function CodeView({ name, code, flash }: { name: string; code: string; flash: { keys: string[]; count: number } }) {
  const lines = code.split("\n");
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-sunk px-4 py-2">
        <span className="font-mono text-xs text-ink-muted">
          {lines.length} lines · changed options flash gold
        </span>
        <CopyButton text={() => code} label={`Copy ${name}`} doneLabel={`${name} copied`} />
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
}: {
  text: () => string;
  label: string;
  doneLabel: string;
  tone?: "paper" | "board";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={
          tone === "board"
            ? "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded bg-pad px-3 py-1.5 text-sm font-semibold text-board hover:bg-pad-strong"
            : "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:bg-paper-sunk"
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
          {copied ? (
            <path d="m5 12 5 5L20 7" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </>
          )}
        </svg>
        {copied ? "Copied" : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? doneLabel : ""}
      </span>
    </>
  );
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
        Automated tests already cover axe and keyboard flows on both outputs. These need a person: try them on both
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
                  className="mt-0.5 size-4 shrink-0 accent-board"
                />
                <span className="flex-1 text-pretty">{item}</span>
                {done && (
                  <span
                    aria-hidden="true"
                    className="stamp-in shrink-0 rounded border-2 border-pass px-1.5 font-display text-sm font-bold tracking-wider text-pass uppercase"
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
