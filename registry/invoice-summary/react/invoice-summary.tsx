"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type InvoiceSummaryConfig = {
  caption: string;
  currency: string;
  items: { description: string; quantity: string; unitPrice: string }[];
  descriptionHeader: string;
  quantityHeader: string;
  unitHeader: string;
  amountHeader: string;
  subtotalLabel: string;
  taxLabel: string;
  taxPercent: number;
  totalLabel: string;
  note: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: InvoiceSummaryConfig = {
  caption: "Invoice 1042 — September",
  currency: "£",
  items: [
    { description: "Design review, 4 hours", quantity: "4", unitPrice: "95" },
    { description: "Accessibility audit", quantity: "1", unitPrice: "1200" },
    { description: "Follow-up session", quantity: "2", unitPrice: "95" },
  ],
  descriptionHeader: "Item",
  quantityHeader: "Qty",
  unitHeader: "Unit",
  amountHeader: "Amount",
  subtotalLabel: "Subtotal",
  taxLabel: "VAT",
  taxPercent: 20,
  totalLabel: "Total due",
  note: "Payable within 30 days. Bank details are on the last page.",
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/**
 * Money written out by hand, in whole pennies. Intl gives the server and the browser different strings,
 * and floating point gives 0.1 + 0.2 = 0.30000000000000004 — so every sum here is done in pennies.
 */
export function money(pence: number, currency: string) {
  const sign = pence < 0 ? "-" : "";
  const whole = Math.floor(Math.abs(pence) / 100);
  const part = (Math.abs(pence) % 100).toString().padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${currency}${grouped}.${part}`;
}

const pence = (value: string) => Math.round(Number.parseFloat(value.replace(/[^0-9.-]/g, "")) * 100) || 0;
const count = (value: string) => Math.round(Number.parseFloat(value.replace(/[^0-9.-]/g, ""))) || 0;

export function InvoiceSummary({ config = defaultConfig }: { config?: InvoiceSummaryConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--inv-accent": config.accentColor,
    "--inv-accent-text": readableAccent(config.accentColor, dark),
    "--inv-surface": palette.surface,
    "--inv-sunk": palette.sunk,
    "--inv-text": palette.text,
    "--inv-muted": palette.muted,
    "--inv-line": palette.line,
  } as CSSProperties;

  const lines = config.items.map((item) => ({ ...item, amount: count(item.quantity) * pence(item.unitPrice) }));
  // Every total is worked out here, so the numbers on the page always add up.
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const tax = Math.round((subtotal * config.taxPercent) / 100);
  const total = subtotal + tax;

  const rowLabel = "px-0 py-2 text-left font-normal";
  const rowNumber = "px-0 py-2 text-right tabular-nums";

  return (
    <div style={style} className="bg-(--inv-surface) p-1 text-(--inv-text)">
      {/*
        On a narrow screen the numbers stay in their columns and the item description wraps. The columns
        are kept, rather than stacked, because the whole point of an invoice is comparing the amounts
        down the right-hand edge.
      */}
      <table className="w-full border-collapse max-[30rem]:text-sm">
        <caption className="pb-3 text-left text-xl font-semibold">{config.caption}</caption>
        <thead>
          <tr className="border-b border-(--inv-line)">
            <th scope="col" className="px-0 py-2 text-left font-medium">
              {config.descriptionHeader}
            </th>
            <th scope="col" className="px-0 py-2 text-right font-medium">
              {config.quantityHeader}
            </th>
            <th scope="col" className="px-0 py-2 text-right font-medium">
              {config.unitHeader}
            </th>
            <th scope="col" className="px-0 py-2 text-right font-medium">
              {config.amountHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.description} className="border-b border-(--inv-line)">
              {/* The item is the row's header, so a screen reader says it with every number in the row. */}
              <th scope="row" className={`${rowLabel} break-words`}>
                {line.description}
              </th>
              <td className={rowNumber}>{count(line.quantity)}</td>
              <td className={rowNumber}>{money(pence(line.unitPrice), config.currency)}</td>
              <td className={`${rowNumber} font-medium`}>{money(line.amount, config.currency)}</td>
            </tr>
          ))}
        </tbody>
        {/* The totals are a real tfoot, so they are part of the table rather than loose text under it. */}
        <tfoot>
          <tr>
            <th scope="row" colSpan={3} className="px-0 pt-3 text-right font-normal">
              {config.subtotalLabel}
            </th>
            <td className={`${rowNumber} pt-3`} data-subtotal>
              {money(subtotal, config.currency)}
            </td>
          </tr>
          <tr>
            <th scope="row" colSpan={3} className="px-0 py-1 text-right font-normal">
              {/* The rate is in the label, so nobody has to work out where the number came from. */}
              {`${config.taxLabel} at ${config.taxPercent}%`}
            </th>
            <td className={`${rowNumber} py-1`} data-tax>
              {money(tax, config.currency)}
            </td>
          </tr>
          <tr className="border-t-2 border-(--inv-line)">
            <th scope="row" colSpan={3} className="px-0 pt-2 text-right font-semibold">
              {config.totalLabel}
            </th>
            <td className={`${rowNumber} pt-2 text-lg font-semibold`} data-total>
              {money(total, config.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      {config.note.trim() !== "" && <p className="mt-4 text-sm text-(--inv-muted)">{config.note}</p>}
    </div>
  );
}
