"use client";

import { useState, useSyncExternalStore } from "react";
import { OptionsPanel } from "@/components/options-panel";
import { applyConfig } from "@/lib/export";
import { toSearchParams } from "@/lib/schema";
import { DatePicker, type DatePickerConfig } from "@/registry/date-picker/react/date-picker";
import { datePickerSchema } from "@/registry/date-picker/schema";

type Sources = { react: string; html: string; css: string; js: string };
type Output = "react" | "vanilla";

const subscribeNever = () => () => {};

export function DatePickerEditor({ initialConfig, sources }: { initialConfig: DatePickerConfig; sources: Sources }) {
  const [config, setConfig] = useState(initialConfig);
  const [output, setOutput] = useState<Output>("react");
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");

  const query = toSearchParams(datePickerSchema, config).toString();
  const js = applyConfig(sources.js, config);
  const files =
    output === "react"
      ? [{ name: "date-picker.tsx", code: applyConfig(sources.react, config) }]
      : [
          { name: "date-picker.html", code: sources.html },
          { name: "date-picker.css", code: sources.css },
          { name: "date-picker.js", code: js },
        ];

  function update(key: string, value: unknown) {
    const next = { ...config, [key]: value };
    setConfig(next);
    const nextQuery = toSearchParams(datePickerSchema, next).toString();
    window.history.replaceState(null, "", nextQuery ? `?${nextQuery}` : window.location.pathname);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside aria-label="Options">
        <OptionsPanel schema={datePickerSchema} config={config} onChange={update} />
      </aside>

      <div className="min-w-0 space-y-6">
        <div role="group" aria-label="Output" className="inline-flex rounded-md border border-neutral-400 p-0.5">
          {(["react", "vanilla"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={output === value}
              onClick={() => setOutput(value)}
              className="rounded px-3 py-1.5 text-sm aria-pressed:bg-neutral-900 aria-pressed:text-white"
            >
              {value === "react" ? "React + Tailwind" : "HTML/CSS/JS"}
            </button>
          ))}
        </div>

        <section aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="mb-2 text-sm font-semibold">
            Preview
          </h2>
          <div className="rounded-lg border border-neutral-300 bg-white p-6 text-neutral-900">
            {output === "react" ? (
              // Remount on config change so internal state never mixes two configs.
              <DatePicker key={query} config={config} />
            ) : (
              <iframe
                title="HTML/CSS/JS preview"
                sandbox="allow-scripts"
                className="h-96 w-full"
                srcDoc={`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui,sans-serif;color:#171717;background:#fff}${sources.css}</style></head><body><div data-date-picker></div><script>${js}</script></body></html>`}
              />
            )}
          </div>
        </section>

        {output === "react" && (
          <section aria-labelledby="install-heading">
            <h2 id="install-heading" className="mb-2 text-sm font-semibold">
              Install with the shadcn CLI
            </h2>
            <CodeBlock
              title="terminal"
              code={`npx shadcn@latest add "${origin}/r/date-picker.json${query ? `?${query}` : ""}"`}
            />
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
          Copy<span className="sr-only"> {title}</span>
        </button>
        <span aria-live="polite" className="sr-only">
          {copied ? `${title} copied` : ""}
        </span>
      </div>
      <pre tabIndex={0} className="max-h-96 overflow-auto bg-white p-3 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}
