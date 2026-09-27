import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CommandMenuConfig } from "../react/command-menu";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderCommandMenuMarkup(config: CommandMenuConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cmd-accent: ${config.accentColor}`,
    `--cmd-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cmd-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--cmd-${key}: ${value}`),
  ].join("; ");

  // Grouped for the eye; one flat run of options for the keyboard, which is what activedescendant walks.
  const order: { name: string; items: CommandMenuConfig["commands"] }[] = [];
  for (const command of config.commands) {
    const last = order[order.length - 1];
    if (last !== undefined && last.name === command.group) last.items.push(command);
    else order.push({ name: command.group, items: [command] });
  }

  let index = -1;
  const groups = order
    .map((group) => {
      const items = group.items
        .map((command) => {
          index += 1;
          return `            <div class="cmd-option" id="cmd-option-${index}" role="option" aria-selected="false" data-option data-label="${escapeHtml(command.label)}" data-search="${escapeHtml(`${command.label} ${command.group}`)}">
              <span>${escapeHtml(command.label)}</span>
              ${
                config.showShortcuts && command.shortcut !== ""
                  ? `<kbd class="cmd-kbd cmd-option-shortcut">${escapeHtml(command.shortcut)}</kbd>`
                  : ""
              }
            </div>`;
        })
        .join("\n");
      return `          <div role="group" aria-label="${escapeHtml(group.name)}" data-group>
            <p class="cmd-group-name" aria-hidden="true">${escapeHtml(group.name)}</p>
${items}
          </div>`;
    })
    .join("\n");

  const hotkey = config.hotkey.trim().toUpperCase();

  return `    <div class="cmd cmd--theme-${config.theme}" style="${vars}" data-command-menu>
      <button class="cmd-trigger" type="button" data-trigger>
        ${escapeHtml(config.triggerLabel)}
        ${config.showHint && hotkey !== "" ? `<kbd class="cmd-kbd">Ctrl ${escapeHtml(hotkey)}</kbd>` : ""}
      </button>

      <p class="cmd-status" role="status" data-status></p>

      <dialog class="cmd-dialog" aria-label="${escapeHtml(config.triggerLabel)}" data-dialog>
        <div class="cmd-field">
          <label class="cmd-sr" for="cmd-input">${escapeHtml(config.placeholder)}</label>
          <input class="cmd-input" id="cmd-input" type="text" role="combobox" autocomplete="off" aria-expanded="false" aria-controls="cmd-list" placeholder="${escapeHtml(config.placeholder)}" data-input>
        </div>

        <!--
          A listbox may only own options, and groups of options. The group heading is therefore a
          picture of the group's own aria-label, and the empty message lives outside the listbox.
        -->
        <div class="cmd-list" id="cmd-list" role="listbox" aria-label="${escapeHtml(config.triggerLabel)}" data-name="${escapeHtml(config.triggerLabel)}" data-list>
${groups}
        </div>
        <p class="cmd-empty" role="status" hidden data-empty></p>
      </dialog>
    </div>`;
}

export function renderCommandMenuHtml(config: CommandMenuConfig) {
  return htmlPage({ title: "Command menu", slug: "command-menu", body: renderCommandMenuMarkup(config), script: true });
}
