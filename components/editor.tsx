"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { OptionsPanel } from "@/components/options-panel";
import { applyConfig } from "@/lib/export";
import { toSearchParams, type Schema } from "@/lib/schema";

export type Sources = { react: string; html: string; css: string; js: string };

type Props = {
  /** Registry name and file base name, e.g. "date-picker". */
  slug: string;
  schema: Schema;
  initialConfig: Record<string, unknown>;
  sources: Sources;
  renderPreview: (config: Record<string, unknown>) => ReactNode;
  /** Manual checks automated tests can't prove (screen readers, zoom, touch). */
  checklist: string[];
};

type Output = "react" | "vanilla";

const widths = [
  { label: "Phone", value: "375px" },
  { label: "Tablet", value: "768px" },
  { label: "Full", value: "100%" },
];

const subscribeNever = () => () => {};

export function Editor({ slug, schema, initialConfig, sources, renderPreview, checklist }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [output, setOutput] = useState<Output>("react");
  const [width, setWidth] = useState("100%");
  const [submitted, setSubmitted] = useState<[string, string][] | null>(null);
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

  function update(key: string, value: unknown) {
    const next = { ...config, [key]: value };
    setConfig(next);
    setSubmitted(null);
    const nextQuery = toSearchParams(schema, next).toString();
    window.history.replaceState(null, "", nextQuery ? `?${nextQuery}` : window.location.pathname);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted([...new FormData(event.currentTarget)].map(([key, value]) => [key, String(value)]));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="Options" className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
        <OptionsPanel schema={schema} config={config} onChange={update} />
      </aside>

      <div className="min-w-0 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToggleGroup
            label="Output"
            value={output}
            options={[
              { label: "React + Tailwind", value: "react" },
              { label: "HTML/CSS/JS", value: "vanilla" },
            ]}
            onChange={(value) => {
              setOutput(value as Output);
              setSubmitted(null);
            }}
          />
          <ToggleGroup label="Preview width" value={width} options={widths} onChange={setWidth} />
        </div>

        <section aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="mb-2 text-sm font-semibold">
            Live test
          </h2>
          <div className="rounded-lg border border-dashed border-neutral-400 bg-neutral-100 p-3">
            <div className="mx-auto rounded-md bg-white text-neutral-900 shadow-sm" style={{ maxWidth: width }}>
              {output === "react" ? (
                <form onSubmit={onSubmit} className="space-y-4 p-6">
                  {/* Remount on config change so internal state never mixes two configs. */}
                  <div key={query}>{renderPreview(config)}</div>
                  <TestFormFooter submitted={submitted} />
                </form>
              ) : (
                <iframe
                  key={query}
                  title="HTML/CSS/JS live test"
                  sandbox="allow-scripts"
                  className="h-[28rem] w-full rounded-md"
                  srcDoc={vanillaTestDocument(sources.html, sources.css, js)}
                />
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            The HTML/CSS/JS test runs the exported files in an isolated frame, with a test form around them.
          </p>
        </section>

        <Checklist slug={slug} items={checklist} />

        {output === "react" && (
          <section aria-labelledby="install-heading">
            <h2 id="install-heading" className="mb-2 text-sm font-semibold">
              Install with the shadcn CLI
            </h2>
            <CodeBlock title="terminal" code={`npx shadcn@latest add "${origin}/r/${slug}.json${query ? `?${query}` : ""}"`} />
          </section>
        )}

        <section aria-labelledby="code-heading">
          <h2 id="code-heading" className="mb-2 text-sm font-semibold">
            Code
          </h2>
          {files.map((file) => (
            <CodeBlock key={file.name} title={file.name} code={file.code} />
          ))}
        </section>
      </div>
    </div>
  );
}

function TestFormFooter({ submitted }: { submitted: [string, string][] | null }) {
  return (
    <div className="border-t border-neutral-200 pt-4">
      <button type="submit" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white">
        Submit test form
      </button>
      <output className="mt-3 block text-sm" aria-live="polite">
        {submitted &&
          (submitted.length === 0 ? (
            "Submitted: no form values."
          ) : (
            <>
              Submitted:
              <code className="ml-1 font-mono">{submitted.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("  ")}</code>
            </>
          ))}
      </output>
    </div>
  );
}

/** Inlines the exported CSS/JS into the exported HTML page and wraps its <main> in a test form. */
function vanillaTestDocument(html: string, css: string, js: string) {
  const formScript = `document.getElementById("test-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var pairs = Array.from(new FormData(e.target)).map(function (p) { return p[0] + "=" + JSON.stringify(p[1]); });
  document.getElementById("test-output").textContent = pairs.length ? "Submitted: " + pairs.join("  ") : "Submitted: no form values.";
});`;
  return html
    .replace(/<link rel="stylesheet" href="[^"]+">/, () => `<style>body{margin:0;padding:24px;font-family:system-ui,sans-serif;color:#171717}${css}</style>`)
    .replace("<main>", '<main><form id="test-form">')
    .replace(
      "</main>",
      '<p><button type="submit">Submit test form</button></p><output id="test-output" aria-live="polite"></output></form></main>',
    )
    .replace(/<script src="[^"]+"><\/script>/, () => `<script>${js}</script><script>${formScript}</script>`);
}

function ToggleGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase" aria-hidden="true">
        {label}
      </span>
      <span className="inline-flex rounded-md border border-neutral-400 bg-white p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className="rounded px-3 py-1.5 text-sm aria-pressed:bg-neutral-900 aria-pressed:text-white"
          >
            {option.label}
          </button>
        ))}
      </span>
    </div>
  );
}

// Checklist state: per-browser convenience only. Falls back to memory when storage is blocked.
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

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
  storageListeners.forEach((listener) => listener());
}

function Checklist({ slug, items }: { slug: string; items: string[] }) {
  const storageKey = `checklist:${slug}`;
  const checked: number[] = JSON.parse(
    useSyncExternalStore(subscribeStorage, () => readStorage(storageKey), () => "[]"),
  );

  function toggle(index: number) {
    const next = checked.includes(index) ? checked.filter((i) => i !== index) : [...checked, index];
    writeStorage(storageKey, JSON.stringify(next));
  }

  return (
    <section aria-labelledby="checklist-heading" className="rounded-lg border border-neutral-300 p-4">
      <h2 id="checklist-heading" className="text-sm font-semibold">
        Manual test checklist{" "}
        <span className="font-normal text-neutral-600">
          ({checked.length}/{items.length})
        </span>
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Automated tests cover axe and keyboard flows. These need a person. Run them on both outputs.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked.includes(index)}
                onChange={() => toggle(index)}
                className="mt-0.5 size-4 shrink-0"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-neutral-300">
      <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-50 px-3 py-1.5">
        <span className="font-mono text-xs">{title}</span>
        <button type="button" onClick={copy} className="rounded border border-neutral-500 bg-white px-2 py-0.5 text-xs">
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {title}</span>
        </button>
      </div>
      <pre tabIndex={0} className="max-h-96 overflow-auto bg-white p-3 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}
