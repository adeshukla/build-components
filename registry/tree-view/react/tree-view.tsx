"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type TreeViewConfig = {
  label: string;
  items: { path: string }[];
  startOpen: "none" | "top" | "all";
  showIcons: boolean;
  showSelection: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TreeViewConfig = {
  label: "Project files",
  items: [
    { path: "src/app/layout.tsx" },
    { path: "src/app/page.tsx" },
    { path: "src/app/settings/page.tsx" },
    { path: "src/components/button.tsx" },
    { path: "src/components/dialog.tsx" },
    { path: "src/lib/format.ts" },
    { path: "public/logo.svg" },
    { path: "package.json" },
    { path: "README.md" },
  ],
  startOpen: "top",
  showIcons: true,
  showSelection: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

type TreeNode = { id: string; name: string; level: number; parent: string; children: TreeNode[] };

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5", selected: "#e4e9fb" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438", selected: "#26304d" },
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

/** Paths like "src/app/page.tsx" become nested nodes; folders appear in the order first seen. */
function buildTree(items: { path: string }[]) {
  const root: TreeNode = { id: "", name: "", level: 0, parent: "", children: [] };
  for (const item of items) {
    let node = root;
    for (const name of item.path.split("/").map((part) => part.trim()).filter(Boolean)) {
      const id = node.id ? `${node.id}/${name}` : name;
      let child = node.children.find((candidate) => candidate.id === id);
      if (!child) {
        child = { id, name, level: node.level + 1, parent: node.id, children: [] };
        node.children.push(child);
      }
      node = child;
    }
  }
  return root.children;
}

function allNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children)]);
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-4 shrink-0">
      {open ? <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1H7.5a2 2 0 0 0-1.9 1.4L3 19V7Zm0 12 2.6-6.6A2 2 0 0 1 7.5 11H21l-2.7 7a2 2 0 0 1-1.9 1H3Z" /> : <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-4 shrink-0">
      <path d="M6 3h8l4 4v14H6V3Zm8 0v4h4" />
    </svg>
  );
}

export function TreeView({ config = defaultConfig }: { config?: TreeViewConfig }) {
  const id = useId();
  const tree = buildTree(config.items);
  const nodes = allNodes(tree);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const [expanded, setExpanded] = useState(
    () =>
      new Set(
        nodes
          .filter((node) => node.children.length > 0 && (config.startOpen === "all" || (config.startOpen === "top" && node.level === 1)))
          .map((node) => node.id),
      ),
  );
  const [focused, setFocused] = useState(tree[0]?.id ?? "");
  const [selected, setSelected] = useState("");
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const moveFocus = useRef(false);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tv-accent": config.accentColor,
    "--tv-accent-text": readableAccent(config.accentColor, dark),
    "--tv-surface": palette.surface,
    "--tv-text": palette.text,
    "--tv-muted": palette.muted,
    "--tv-line": palette.line,
    "--tv-hover": palette.hover,
    "--tv-selected": palette.selected,
  } as CSSProperties;

  // Only nodes whose every ancestor is open can be reached with the arrow keys.
  const visible = nodes.filter((node) => {
    for (let parent = node.parent; parent; parent = byId.get(parent)?.parent ?? "") {
      if (!expanded.has(parent)) return false;
    }
    return true;
  });
  const current = byId.has(focused) ? focused : (tree[0]?.id ?? "");

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    itemRefs.current.get(current)?.focus();
  }, [current, expanded]);

  function focusNode(nodeId: string) {
    moveFocus.current = true;
    setFocused(nodeId);
  }

  function toggle(nodeId: string, open: boolean) {
    setExpanded((before) => {
      const after = new Set(before);
      if (open) after.add(nodeId);
      else after.delete(nodeId);
      return after;
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, node: TreeNode) {
    // Keys from a nested item bubble up through its parents; only the focused one answers.
    if (event.target !== event.currentTarget) return;
    const index = visible.findIndex((candidate) => candidate.id === node.id);
    const isParent = node.children.length > 0;
    const isOpen = expanded.has(node.id);
    let handled = true;

    if (event.key === "ArrowDown") {
      if (visible[index + 1]) focusNode(visible[index + 1].id);
    } else if (event.key === "ArrowUp") {
      if (index > 0) focusNode(visible[index - 1].id);
    } else if (event.key === "ArrowRight") {
      if (isParent && !isOpen) toggle(node.id, true);
      else if (isParent) focusNode(node.children[0].id);
    } else if (event.key === "ArrowLeft") {
      if (isParent && isOpen) toggle(node.id, false);
      else if (node.parent) focusNode(node.parent);
    } else if (event.key === "Home") {
      focusNode(visible[0].id);
    } else if (event.key === "End") {
      focusNode(visible[visible.length - 1].id);
    } else if (event.key === "Enter" || event.key === " ") {
      setSelected(node.id);
    } else if (event.key === "*") {
      // Opens every folder at this level, as in the APG tree pattern.
      const siblings = node.parent ? byId.get(node.parent)!.children : tree;
      setExpanded((before) => new Set([...before, ...siblings.filter((sibling) => sibling.children.length).map((sibling) => sibling.id)]));
    } else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Type-ahead: the next visible item starting with that character.
      const char = event.key.toLowerCase();
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
      const match = ordered.find((candidate) => candidate.name.toLowerCase().startsWith(char));
      if (match) focusNode(match.id);
    } else {
      handled = false;
    }
    if (handled) event.preventDefault();
  }

  function renderNodes(list: TreeNode[]) {
    return list.map((node, position) => {
      const isParent = node.children.length > 0;
      const isOpen = expanded.has(node.id);
      const isSelected = selected === node.id;
      const labelId = `${id}-${nodes.indexOf(node)}`;
      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) itemRefs.current.set(node.id, element);
            else itemRefs.current.delete(node.id);
          }}
          role="treeitem"
          aria-labelledby={labelId}
          aria-level={node.level}
          aria-setsize={list.length}
          aria-posinset={position + 1}
          aria-expanded={isParent ? isOpen : undefined}
          aria-selected={isSelected}
          tabIndex={node.id === current ? 0 : -1}
          onKeyDown={(event) => onKeyDown(event, node)}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setFocused(node.id);
          }}
          className="outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-(--tv-accent-text)"
        >
          <div
            onClick={() => {
              focusNode(node.id);
              setSelected(node.id);
              if (isParent) toggle(node.id, !isOpen);
            }}
            style={{ paddingLeft: `${(node.level - 1) * 1.25 + 0.5}rem` }}
            className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-md pr-2 text-sm select-none ${isSelected ? "bg-(--tv-selected) font-medium" : "hover:bg-(--tv-hover)"}`}
          >
            <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center text-(--tv-muted)">
              {isParent && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`size-3.5 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              )}
            </span>
            {config.showIcons && <span className="text-(--tv-muted)">{isParent ? <FolderIcon open={isOpen} /> : <FileIcon />}</span>}
            <span id={labelId} className="truncate">
              {node.name}
            </span>
          </div>
          {isParent && isOpen && <ul role="group">{renderNodes(node.children)}</ul>}
        </li>
      );
    });
  }

  return (
    <div style={style} className="max-w-sm bg-(--tv-surface) text-(--tv-text)">
      <p id={`${id}-label`} className="mb-2 font-medium">
        {config.label}
      </p>
      <ul role="tree" aria-labelledby={`${id}-label`} className="rounded-lg border border-(--tv-line) p-1">
        {renderNodes(tree)}
      </ul>
      {config.showSelection && (
        <p aria-live="polite" className="mt-2 text-sm text-(--tv-muted)">
          {selected ? `Selected: ${selected}` : "Nothing selected yet."}
        </p>
      )}
    </div>
  );
}
