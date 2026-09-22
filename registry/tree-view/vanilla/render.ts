import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TreeViewConfig } from "../react/tree-view";

type TreeNode = { id: string; name: string; level: number; children: TreeNode[] };

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5", selected: "#e4e9fb" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438", selected: "#26304d" },
};

const icons = {
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>',
  folder:
    '<svg class="tv-folder-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg><svg class="tv-folder-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1H7.5a2 2 0 0 0-1.9 1.4L3 19V7Zm0 12 2.6-6.6A2 2 0 0 1 7.5 11H21l-2.7 7a2 2 0 0 1-1.9 1H3Z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 3h8l4 4v14H6V3Zm8 0v4h4"/></svg>',
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

function buildTree(items: { path: string }[]) {
  const root: TreeNode = { id: "", name: "", level: 0, children: [] };
  for (const item of items) {
    let node = root;
    for (const name of item.path.split("/").map((part) => part.trim()).filter(Boolean)) {
      const id = node.id ? `${node.id}/${name}` : name;
      let child = node.children.find((candidate) => candidate.id === id);
      if (!child) {
        child = { id, name, level: node.level + 1, children: [] };
        node.children.push(child);
      }
      node = child;
    }
  }
  return root.children;
}

/**
 * The whole tree ships in the HTML: closed folders keep their items in a hidden group, so the
 * script only moves focus and flips aria-expanded.
 */
export function renderTreeViewMarkup(config: TreeViewConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tv-accent: ${config.accentColor}`,
    `--tv-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--tv-${key}: ${value}`),
  ].join("; ");
  let count = 0;
  let first = true;

  function items(list: TreeNode[], depth: number): string {
    const pad = "  ".repeat(depth);
    return list
      .map((node, position) => {
        const isParent = node.children.length > 0;
        const open = isParent && (config.startOpen === "all" || (config.startOpen === "top" && node.level === 1));
        const labelId = `tree-view-${count++}`;
        const tabindex = first ? "0" : "-1";
        first = false;
        const icon = config.showIcons ? `<span class="tv-icon" aria-hidden="true">${isParent ? icons.folder : icons.file}</span>` : "";
        return `${pad}<li class="tv-item" role="treeitem" aria-labelledby="${labelId}" aria-level="${node.level}" aria-setsize="${list.length}" aria-posinset="${position + 1}"${isParent ? ` aria-expanded="${open}"` : ""} aria-selected="false" tabindex="${tabindex}" data-path="${escapeHtml(node.id)}">
${pad}  <div class="tv-row" style="padding-left: ${(node.level - 1) * 1.25 + 0.5}rem"><span class="tv-chevron" aria-hidden="true">${isParent ? icons.chevron : ""}</span>${icon}<span class="tv-name" id="${labelId}">${escapeHtml(node.name)}</span></div>
${isParent ? `${pad}  <ul class="tv-group" role="group"${open ? "" : " hidden"}>\n${items(node.children, depth + 2)}\n${pad}  </ul>\n` : ""}${pad}</li>`;
      })
      .join("\n");
  }

  return `    <div class="tv tv--theme-${config.theme}" style="${vars}" data-tree-view>
      <p class="tv-label" id="tree-view-label">${escapeHtml(config.label)}</p>
      <ul class="tv-tree" role="tree" aria-labelledby="tree-view-label">
${items(buildTree(config.items), 4)}
      </ul>
${config.showSelection ? `      <p class="tv-selection" aria-live="polite" data-selection>Nothing selected yet.</p>\n` : ""}    </div>`;
}

export function renderTreeViewHtml(config: TreeViewConfig) {
  return htmlPage({ title: "Tree view", slug: "tree-view", body: renderTreeViewMarkup(config), script: true });
}
