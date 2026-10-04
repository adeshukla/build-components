"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CartLine = { name: string; variant: string; price: string; quantity: string };

export type CartConfig = {
  title: string;
  lines: CartLine[];
  checkoutText: string;
  checkoutHref: string;
  continueText: string;
  emptyText: string;
  currency: "GBP" | "USD" | "EUR";
  layout: "panel" | "drawer";
  openText: string;
  quantityStepper: boolean;
  removeButton: boolean;
  shipping: boolean;
  shippingCost: string;
  freeShippingOver: number;
  taxNote: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  itemOneText: string;
  itemsText: string;
  eachText: string;
  decreaseLabel: string;
  increaseLabel: string;
  quantityLabel: string;
  quantityText: string;
  removeText: string;
  removeLabel: string;
  freeDeliveryText: string;
  spendMoreText: string;
  progressLabel: string;
  subtotalText: string;
  deliveryText: string;
  freeText: string;
  totalText: string;
  changedText: string;
  removedText: string;
  emptiedText: string;
  lineLeftText: string;
  linesLeftText: string;
};

// @config-start
const defaultConfig: CartConfig = {
  title: "Your basket",
  lines: [
    { name: "Field notebook", variant: "A5, dotted", price: "18.00", quantity: "2" },
    { name: "Drafting pencil", variant: "0.5 mm", price: "24.50", quantity: "1" },
    { name: "Ink refill", variant: "Black, pack of three", price: "9.00", quantity: "1" },
  ],
  checkoutText: "Checkout",
  checkoutHref: "/checkout",
  continueText: "Continue shopping",
  emptyText: "Your basket is empty.",
  currency: "GBP",
  layout: "panel",
  openText: "Basket",
  quantityStepper: true,
  removeButton: true,
  shipping: true,
  shippingCost: "4.95",
  freeShippingOver: 50,
  taxNote: "Tax included. Delivery calculated at checkout.",
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
  itemOneText: "{count} item",
  itemsText: "{count} items",
  eachText: "{price} each",
  decreaseLabel: "Decrease quantity of {name}",
  increaseLabel: "Increase quantity of {name}",
  quantityLabel: "Quantity of {name}",
  quantityText: "Quantity {count}",
  removeText: "Remove",
  removeLabel: "Remove {name} from the basket",
  freeDeliveryText: "Delivery is free on this order.",
  spendMoreText: "Spend {amount} more for free delivery.",
  progressLabel: "Progress towards free delivery",
  subtotalText: "Subtotal",
  deliveryText: "Delivery",
  freeText: "Free",
  totalText: "Total",
  changedText: "{name}, quantity {count}. Subtotal {subtotal}.",
  removedText: "{name} removed.",
  emptiedText: "Your basket is empty.",
  lineLeftText: "{count} line left.",
  linesLeftText: "{count} lines left.",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};

const symbols = { GBP: "£", USD: "$", EUR: "€" };

// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
};

// WCAG relative luminance, used to keep text on the accent readable.
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

const amount = (value: string) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);
const count = (value: string) => Math.min(99, Math.max(1, Math.round(amount(value)) || 1));
/** Formatted by hand, not by locale, so the server and the browser always agree. */
const money = (value: number, currency: CartConfig["currency"]) => `${symbols[currency]}${value.toFixed(2)}`;

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function Cart({ config = defaultConfig }: { config?: CartConfig }) {
  const id = useId();
  const [lines, setLines] = useState(() =>
    config.lines
      .filter((line) => line.name.trim() !== "")
      .map((line, index) => ({ ...line, id: index, quantity: count(line.quantity) })),
  );
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);

  const items = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = lines.reduce((total, line) => total + amount(line.price) * line.quantity, 0);
  const flatShipping = amount(config.shippingCost);
  const freeOver = config.freeShippingOver;
  const shippingFree = freeOver > 0 && subtotal >= freeOver;
  const shipping = !config.shipping || lines.length === 0 ? 0 : shippingFree ? 0 : flatShipping;
  const missing = Math.max(0, freeOver - subtotal);

  // A native dialog gives the drawer its top layer, its Escape key and an inert page behind it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function setQuantity(id: number, next: number) {
    const line = lines.find((entry) => entry.id === id);
    if (!line) return;
    const quantity = Math.min(99, Math.max(1, next));
    setLines(lines.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)));
    const nextSubtotal = lines.reduce((total, entry) => total + amount(entry.price) * (entry.id === id ? quantity : entry.quantity), 0);
    setMessage(fill(config.changedText, { name: line.name, count: quantity, subtotal: money(nextSubtotal, config.currency) }));
  }

  function remove(id: number) {
    const line = lines.find((entry) => entry.id === id);
    if (!line) return;
    const rest = lines.filter((entry) => entry.id !== id);
    setLines(rest);
    const left = rest.length === 0 ? config.emptiedText : fill(rest.length === 1 ? config.lineLeftText : config.linesLeftText, { count: rest.length });
    setMessage(`${fill(config.removedText, { name: line.name })} ${left}`);
  }

  const style = {
    "--ct-accent": config.accentColor,
    "--ct-accent-text": readableAccent(config.accentColor, dark),
    "--ct-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--ct-radius": `var(--bc-radius-md, ${config.radius}px)`,
    "--ct-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--ct-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--ct-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--ct-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--ct-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ct-accent-text)";
  const stepper = `grid size-8 cursor-pointer place-items-center rounded-(--ct-radius) border border-(--ct-line) text-(--ct-text) disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;

  const body = (
    <div className="flex h-full flex-col gap-5 bg-(--ct-surface) text-(--ct-text)">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${id}-cart-title`} className="text-xl font-semibold">
          {config.title}
        </h2>
        <p className="text-sm text-(--ct-muted)">
          {fill(items === 1 ? config.itemOneText : config.itemsText, { count: items })}
        </p>
      </div>

      {/* Changes are announced once, politely, instead of re-reading the whole basket. */}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>

      {lines.length === 0 ? (
        <p className="text-(--ct-muted)">{config.emptyText}</p>
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-wrap items-start gap-3 border-b border-(--ct-line) pb-4">
              <div className="min-w-40 flex-1 basis-full sm:basis-auto">
                <p className="font-medium">{line.name}</p>
                {line.variant.trim() !== "" && <p className="text-sm text-(--ct-muted)">{line.variant}</p>}
                <p className="mt-1 text-sm text-(--ct-muted)">
                  {fill(config.eachText, { price: money(amount(line.price), config.currency) })}
                </p>
              </div>

              {config.quantityStepper ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.id, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                    className={stepper}
                  >
                    <span className="sr-only">{fill(config.decreaseLabel, { name: line.name })}</span>
                    <span aria-hidden="true">−</span>
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={fill(config.quantityLabel, { name: line.name })}
                    value={line.quantity}
                    onChange={(event) => setQuantity(line.id, count(event.target.value))}
                    className="w-12 rounded-(--ct-radius) border border-(--ct-line) bg-(--ct-surface) px-2 py-1 text-center text-(--ct-text)"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(line.id, line.quantity + 1)}
                    disabled={line.quantity >= 99}
                    className={stepper}
                  >
                    <span className="sr-only">{fill(config.increaseLabel, { name: line.name })}</span>
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              ) : (
                <p className="text-sm text-(--ct-muted)">{fill(config.quantityText, { count: line.quantity })}</p>
              )}

              <div className="ml-auto flex flex-col items-end gap-1 sm:min-w-24">
                <p className="font-semibold">{money(amount(line.price) * line.quantity, config.currency)}</p>
                {config.removeButton && (
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    className={`min-h-6 cursor-pointer rounded-(--ct-radius) p-1 text-sm text-(--ct-accent-text) underline ${focus}`}
                  >
                    <span className="sr-only">{fill(config.removeLabel, { name: line.name })}</span>
                    <span aria-hidden="true">{config.removeText}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {config.shipping && freeOver > 0 && lines.length > 0 && (
        <div className="rounded-(--ct-radius) bg-(--ct-sunk) p-3">
          <p className="text-sm">
            {shippingFree
              ? config.freeDeliveryText
              : fill(config.spendMoreText, { amount: money(missing, config.currency) })}
          </p>
          {/* A native progress bar: the browser already tells assistive tech what it means. */}
          <progress
            value={Math.min(subtotal, freeOver)}
            max={freeOver}
            aria-label={config.progressLabel}
            className="mt-2 block h-2 w-full appearance-none overflow-hidden rounded-full border-0 bg-(--ct-line) [&::-moz-progress-bar]:bg-(--ct-accent) [&::-webkit-progress-bar]:bg-(--ct-line) [&::-webkit-progress-value]:bg-(--ct-accent)"
          />
        </div>
      )}

      <dl className="mt-auto flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <dt className="text-(--ct-muted)">{config.subtotalText}</dt>
          <dd className="font-medium">{money(subtotal, config.currency)}</dd>
        </div>
        {config.shipping && (
          <div className="flex justify-between gap-4">
            <dt className="text-(--ct-muted)">{config.deliveryText}</dt>
            <dd className="font-medium">{shipping === 0 ? config.freeText : money(shipping, config.currency)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-(--ct-line) pt-2 text-lg">
          <dt className="font-semibold">{config.totalText}</dt>
          <dd className="font-semibold">{money(subtotal + shipping, config.currency)}</dd>
        </div>
      </dl>

      {config.taxNote.trim() !== "" && <p className="text-sm text-(--ct-muted)">{config.taxNote}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={safeHref(config.checkoutHref)}
          aria-disabled={lines.length === 0 ? "true" : undefined}
          className={`rounded-(--ct-radius) bg-(--ct-accent) px-5 py-3 font-semibold text-(--ct-on-accent) no-underline ${focus} ${
            lines.length === 0 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {config.checkoutText}
        </a>
        {config.layout === "drawer" ? (
          <button type="button" onClick={() => setOpen(false)} className={`cursor-pointer px-2 py-2 underline ${focus}`}>
            {config.continueText}
          </button>
        ) : (
          <a href={safeHref("/")} className={`px-2 py-2 text-(--ct-text) underline ${focus}`}>
            {config.continueText}
          </a>
        )}
      </div>
    </div>
  );

  if (config.layout === "panel") {
    return (
      <section aria-labelledby={`${id}-cart-title`} style={style} className="rounded-(--ct-radius) border border-(--ct-line) bg-(--ct-surface) p-5">
        {body}
      </section>
    );
  }

  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`cursor-pointer rounded-(--ct-radius) bg-(--ct-accent) px-4 py-2 font-semibold text-(--ct-on-accent) ${focus}`}
      >
        {config.openText} ({items})
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-cart-title`}
        onClose={() => setOpen(false)}
        onMouseDown={(event) => {
          // Clicking the backdrop closes; clicking inside must not steal focus from the drawer.
          if (event.target === dialogRef.current) setOpen(false);
          else event.stopPropagation();
        }}
        // Tailwind's reset zeroes the margins a dialog centres itself with, so the drawer sets
        // its own: pinned to the right, full height.
        className="mt-0 mr-0 mb-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto bg-(--ct-surface) p-5 text-(--ct-text) backdrop:bg-black/40 transition-transform duration-300 ease-out starting:translate-x-full motion-reduce:transition-none sm:p-6"
      >
        {body}
      </dialog>
    </div>
  );
}
