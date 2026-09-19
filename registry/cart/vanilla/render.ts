import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { CartConfig } from "../react/cart";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};

const symbols = { GBP: "£", USD: "$", EUR: "€" };

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

const amount = (value: string) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);
const count = (value: string) => Math.min(99, Math.max(1, Math.round(amount(value)) || 1));

/**
 * The basket ships as real HTML with its lines and totals already worked out, so it reads
 * correctly before the script runs. The script handles quantities, removing and the drawer.
 */
export function renderCartMarkup(config: CartConfig) {
  const lines = config.lines
    .filter((line) => line.name.trim() !== "")
    .map((line) => ({ ...line, count: count(line.quantity), each: amount(line.price) }));
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const symbol = symbols[config.currency];
  const money = (value: number) => `${symbol}${value.toFixed(2)}`;

  const items = lines.reduce((total, line) => total + line.count, 0);
  const subtotal = lines.reduce((total, line) => total + line.each * line.count, 0);
  const freeOver = config.freeShippingOver;
  const shippingFree = freeOver > 0 && subtotal >= freeOver;
  const shipping = !config.shipping || lines.length === 0 ? 0 : shippingFree ? 0 : amount(config.shippingCost);

  const vars = [
    `--ct-accent: ${config.accentColor}`,
    `--ct-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ct-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    `--ct-radius: ${config.radius}px`,
    `--ct-surface: ${palette.surface}`,
    `--ct-sunk: ${palette.sunk}`,
    `--ct-text: ${palette.text}`,
    `--ct-muted: ${palette.muted}`,
    `--ct-line: ${palette.line}`,
  ].join("; ");

  const rows = lines
    .map((line, index) => {
      const quantity = config.quantityStepper
        ? `            <div class="ct-stepper">
              <button class="ct-step" type="button" data-step="-1"${line.count <= 1 ? " disabled" : ""}><span class="ct-sr">Decrease quantity of ${escapeHtml(line.name)}</span><span aria-hidden="true">&minus;</span></button>
              <input class="ct-quantity" type="text" inputmode="numeric" value="${line.count}" aria-label="Quantity of ${escapeHtml(line.name)}" data-quantity>
              <button class="ct-step" type="button" data-step="1"${line.count >= 99 ? " disabled" : ""}><span class="ct-sr">Increase quantity of ${escapeHtml(line.name)}</span><span aria-hidden="true">+</span></button>
            </div>`
        : `            <p class="ct-muted ct-small">Quantity <span data-quantity-text>${line.count}</span></p>`;
      const remove = config.removeButton
        ? `              <button class="ct-remove" type="button" data-remove><span class="ct-sr">Remove ${escapeHtml(line.name)} from the basket</span><span aria-hidden="true">Remove</span></button>\n`
        : "";

      return `          <li class="ct-line" data-line data-price="${line.each}" data-name="${escapeHtml(line.name)}" data-index="${index}">
            <div class="ct-details">
              <p class="ct-name">${escapeHtml(line.name)}</p>
${line.variant.trim() ? `              <p class="ct-muted ct-small">${escapeHtml(line.variant)}</p>\n` : ""}              <p class="ct-muted ct-small">${money(line.each)} each</p>
            </div>
${quantity}
            <div class="ct-line-end">
              <p class="ct-line-total" data-line-total>${money(line.each * line.count)}</p>
${remove}            </div>
          </li>`;
    })
    .join("\n");

  const progress =
    config.shipping && freeOver > 0 && lines.length > 0
      ? `        <div class="ct-progress-box" data-progress-box>
          <p class="ct-small" data-progress-text>${
            shippingFree ? "Delivery is free on this order." : `Spend ${money(Math.max(0, freeOver - subtotal))} more for free delivery.`
          }</p>
          <progress class="ct-progress" value="${Math.min(subtotal, freeOver)}" max="${freeOver}" aria-label="Progress towards free delivery" data-progress></progress>
        </div>\n`
      : "";

  const shippingRow = config.shipping
    ? `          <div class="ct-total-row"><dt class="ct-muted">Delivery</dt><dd data-shipping>${shipping === 0 ? "Free" : money(shipping)}</dd></div>\n`
    : "";

  const second =
    config.layout === "drawer"
      ? `          <button class="ct-continue" type="button" data-close>${escapeHtml(config.continueText)}</button>\n`
      : `          <a class="ct-continue" href="/">${escapeHtml(config.continueText)}</a>\n`;

  const body = `      <div class="ct-head">
        <h2 class="ct-title" id="cart-title">${escapeHtml(config.title)}</h2>
        <p class="ct-muted ct-small"><span data-items>${items}</span> item${items === 1 ? "" : "s"}</p>
      </div>
      <p class="ct-sr" role="status" aria-live="polite" data-announce></p>
      <p class="ct-empty" data-empty${lines.length === 0 ? "" : " hidden"}>${escapeHtml(config.emptyText)}</p>
      <ul class="ct-lines" data-lines${lines.length === 0 ? " hidden" : ""}>
${rows}
      </ul>
${progress}      <dl class="ct-totals">
        <div class="ct-total-row"><dt class="ct-muted">Subtotal</dt><dd data-subtotal>${money(subtotal)}</dd></div>
${shippingRow}        <div class="ct-total-row ct-total-row--grand"><dt>Total</dt><dd data-total>${money(subtotal + shipping)}</dd></div>
      </dl>
${config.taxNote.trim() ? `      <p class="ct-muted ct-small">${escapeHtml(config.taxNote)}</p>\n` : ""}      <div class="ct-actions">
        <a class="ct-checkout" href="${escapeHtml(safeHref(config.checkoutHref))}"${lines.length === 0 ? ' aria-disabled="true"' : ""} data-checkout>${escapeHtml(config.checkoutText)}</a>
${second}      </div>`;

  const settings = `data-cart data-symbol="${symbol}" data-shipping-cost="${amount(config.shippingCost)}" data-free-over="${freeOver}" data-has-shipping="${config.shipping}"`;

  if (config.layout === "drawer") {
    return `    <div class="ct ct--theme-${config.theme}" style="${vars}" ${settings}>
      <button class="ct-open" type="button" data-open>${escapeHtml(config.openText)} (<span data-items>${items}</span>)</button>
      <dialog class="ct-drawer" aria-labelledby="cart-title" data-drawer>
${body}
      </dialog>
    </div>`;
  }

  return `    <section class="ct ct--panel ct--theme-${config.theme}" style="${vars}" aria-labelledby="cart-title" ${settings}>
${body}
    </section>`;
}

export function renderCartHtml(config: CartConfig) {
  return htmlPage({ title: "Basket", slug: "cart", body: renderCartMarkup(config), script: true });
}
