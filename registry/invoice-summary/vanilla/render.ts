import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { InvoiceSummaryConfig } from "../react/invoice-summary";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

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
 * Money written out by hand, in whole pennies — the same way the React output does it. Duplicated
 * rather than imported: that file is a client module. Every sum is in pennies so nothing rounds away.
 */
function money(pence: number, currency: string) {
  const sign = pence < 0 ? "-" : "";
  const whole = Math.floor(Math.abs(pence) / 100);
  const part = (Math.abs(pence) % 100).toString().padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${currency}${grouped}.${part}`;
}

const pence = (value: string) => Math.round(Number.parseFloat(value.replace(/[^0-9.-]/g, "")) * 100) || 0;
const count = (value: string) => Math.round(Number.parseFloat(value.replace(/[^0-9.-]/g, ""))) || 0;

export function renderInvoiceSummaryMarkup(config: InvoiceSummaryConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--inv-accent: ${config.accentColor}`,
    `--inv-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--inv-${key}: ${value}`),
  ].join("; ");

  const lines = config.items.map((item) => ({ ...item, amount: count(item.quantity) * pence(item.unitPrice) }));
  // Every total is worked out here, so the numbers on the page always add up.
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const tax = Math.round((subtotal * config.taxPercent) / 100);
  const total = subtotal + tax;

  const rows = lines
    .map(
      (line) => `          <tr>
            <!-- The item is the row's header, so a screen reader says it with every number in the row. -->
            <th class="inv-item" scope="row">${escapeHtml(line.description)}</th>
            <td class="inv-number">${count(line.quantity)}</td>
            <td class="inv-number">${escapeHtml(money(pence(line.unitPrice), config.currency))}</td>
            <td class="inv-number inv-amount">${escapeHtml(money(line.amount, config.currency))}</td>
          </tr>`,
    )
    .join("\n");

  return `    <div class="inv inv--theme-${config.theme}" style="${vars}">
      <!--
        On a narrow screen the numbers stay in their columns and the item description wraps. The columns
        are kept, rather than stacked, because the whole point of an invoice is comparing the amounts
        down the right-hand edge.
      -->
      <table class="inv-table">
        <caption class="inv-caption">${escapeHtml(config.caption)}</caption>
        <thead>
          <tr>
            <th class="inv-label" scope="col">${escapeHtml(config.descriptionHeader)}</th>
            <th class="inv-label inv-number" scope="col">${escapeHtml(config.quantityHeader)}</th>
            <th class="inv-label inv-number" scope="col">${escapeHtml(config.unitHeader)}</th>
            <th class="inv-label inv-number" scope="col">${escapeHtml(config.amountHeader)}</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
        <!-- The totals are a real tfoot, so they are part of the table rather than loose text under it. -->
        <tfoot>
          <tr>
            <th class="inv-foot-label" scope="row" colspan="3">${escapeHtml(config.subtotalLabel)}</th>
            <td class="inv-number" data-subtotal>${escapeHtml(money(subtotal, config.currency))}</td>
          </tr>
          <tr>
            <!-- The rate is in the label, so nobody has to work out where the number came from. -->
            <th class="inv-foot-label" scope="row" colspan="3">${escapeHtml(`${config.taxLabel} at ${config.taxPercent}%`)}</th>
            <td class="inv-number" data-tax>${escapeHtml(money(tax, config.currency))}</td>
          </tr>
          <tr class="inv-total-row">
            <th class="inv-foot-label" scope="row" colspan="3">${escapeHtml(config.totalLabel)}</th>
            <td class="inv-number" data-total>${escapeHtml(money(total, config.currency))}</td>
          </tr>
        </tfoot>
      </table>

      ${config.note.trim() === "" ? "" : `<p class="inv-note">${escapeHtml(config.note)}</p>`}
    </div>`;
}

export function renderInvoiceSummaryHtml(config: InvoiceSummaryConfig) {
  return htmlPage({ title: "Invoice summary", slug: "invoice-summary", body: renderInvoiceSummaryMarkup(config), script: false });
}
