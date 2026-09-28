"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type RowActionsConfig = {
  caption: string;
  nameHeader: string;
  metaHeader: string;
  actionsHeader: string;
  records: { name: string; meta: string }[];
  actions: { label: string; kind: string }[];
  doneTemplate: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: RowActionsConfig = {
  caption: "Saved reports",
  nameHeader: "Report",
  metaHeader: "Last run",
  actionsHeader: "Actions",
  records: [
    { name: "Quarterly revenue", meta: "18 September 2026" },
    { name: "Churn by cohort", meta: "12 September 2026" },
    { name: "Support backlog", meta: "2 September 2026" },
  ],
  actions: [
    { label: "Run", kind: "normal" },
    { label: "Duplicate", kind: "normal" },
    { label: "Delete", kind: "danger" },
  ],
  doneTemplate: "{action} — {record}",
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", danger: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", danger: "#ff9d95" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Darkens or lightens the accent until it clears 4.5:1 against the surface it sits on. */
function readableAccent(hex: string, onDark: boolean) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const surface = onDark ? 0.02 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

export function RowActions({ config = defaultConfig }: { config?: RowActionsConfig }) {
  const [done, setDone] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--rwa-accent": config.accentColor,
    "--rwa-accent-text": readableAccent(config.accentColor, dark),
    "--rwa-surface": palette.surface,
    "--rwa-sunk": palette.sunk,
    "--rwa-text": palette.text,
    "--rwa-muted": palette.muted,
    "--rwa-line": palette.line,
    "--rwa-danger": palette.danger,
  } as CSSProperties;

  return (
    <div style={style} className="bg-(--rwa-surface) p-1 text-(--rwa-text)">
      <table className="w-full border-collapse text-left">
        <caption className="pb-3 text-left text-xl font-semibold">{config.caption}</caption>
        <thead>
          <tr className="border-b border-(--rwa-line)">
            <th scope="col" className="py-2 pr-3 font-medium">
              {config.nameHeader}
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              {config.metaHeader}
            </th>
            {/* The column has a real name. An empty header cell leaves the column unexplained. */}
            <th scope="col" className="py-2 font-medium">
              {config.actionsHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {config.records.map((record) => (
            <tr key={record.name} className="border-b border-(--rwa-line)">
              {/* The name is the row's header, which is what lets a screen reader say it with each cell. */}
              <th scope="row" data-row-name className="py-3 pr-3 font-normal">
                {record.name}
              </th>
              <td className="py-3 pr-3 text-sm text-(--rwa-muted)">{record.meta}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  {config.actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      // Named with the record, so twelve buttons are not all called "Delete".
                      aria-label={`${action.label} ${record.name}`}
                      onClick={() =>
                        setDone(config.doneTemplate.replace("{action}", action.label).replace("{record}", record.name))
                      }
                      className={`inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--rwa-accent-text) ${
                        action.kind === "danger" ? "text-(--rwa-danger)" : "text-(--rwa-accent-text)"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p role="status" className="mt-3 text-sm text-(--rwa-muted)">
        {done}
      </p>
    </div>
  );
}
