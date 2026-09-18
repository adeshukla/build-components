"use client";

import { useId, useRef, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type ModalConfig = {
  triggerText: string;
  title: string;
  body: string;
  primaryText: string;
  initialFocus: "title" | "primary";
  closeOnBackdrop: boolean;
  position: "center" | "bottom";
  animation: "none" | "fade" | "scale";
  closeButton: boolean;
  secondaryButton: boolean;
  secondaryText: string;
  theme: "light" | "dark" | "system";
  iosOnPhone: boolean;
  accentColor: string;
  radius: number;
  size: "sm" | "md" | "lg";
};

export type ModalAction = "primary" | "secondary" | "dismiss";

// @config-start
const defaultConfig: ModalConfig = {
  triggerText: "Open dialog",
  title: "Subscribe to updates",
  body: "Get an email when new components are released. Unsubscribe any time.",
  primaryText: "Confirm",
  initialFocus: "title",
  closeOnBackdrop: true,
  position: "center",
  animation: "fade",
  closeButton: true,
  secondaryButton: true,
  secondaryText: "Cancel",
  theme: "light",
  iosOnPhone: true,
  accentColor: "#2563eb",
  radius: 8,
  size: "md",
};
// @config-end

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--modal-ring)";
const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
const IOS_FONT = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const IOS_BLUE = { light: "#007aff", dark: "#0a84ff" };
const palettes = {
  light: { surface: "#ffffff", sunk: "#f2f2f7", text: "#171717", muted: "#535358", border: "#737373", line: "#d4d4d4", hover: "#f2f2f7" },
  dark: { surface: "#1c1c1e", sunk: "#2c2c2e", text: "#f5f5f7", muted: "#b0b0b8", border: "#8e8e93", line: "#48484a", hover: "#2c2c2e" },
};

const media = (query: string) => ({
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});
const darkMedia = media("(prefers-color-scheme: dark)");
const phoneMedia = media("(max-width: 480px)");
const isApplePhone = () =>
  /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
// Margins restated: Tailwind's reset sets margin: 0, which cancels the browser's dialog centring.
const positions = {
  center: "m-auto w-[calc(100%-2rem)] rounded-(--modal-radius)",
  bottom: "mx-auto mt-auto mb-0 w-full rounded-t-(--modal-radius)",
};
const animations = {
  none: "",
  fade: "transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none",
  scale: "transition-[opacity,scale] duration-200 starting:scale-95 starting:opacity-0 motion-reduce:transition-none",
};

// WCAG relative luminance, used to keep button text and focus rings readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function shift(hex: string, factor: number) {
  const channels = [1, 3, 5].map((i) =>
    Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** The accent used as text: darkened (or lightened on dark) until it clears 4.5:1. */
function readableAccent(hex: string, surface: string, dark: boolean) {
  let color = hex;
  const surfaceLuminance = luminance(surface);
  for (let i = 0; i < 14 && contrast(luminance(color), surfaceLuminance) < 4.5; i++) {
    color = shift(color, dark ? 1.15 : 0.85);
  }
  return color;
}

export function Modal({
  config = defaultConfig,
  onAction,
}: {
  config?: ModalConfig;
  /** Called after the dialog closes, with the button that closed it ("dismiss" = Escape, × or backdrop). */
  onAction?: (action: ModalAction) => void;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<ModalAction>("dismiss");
  const overflowRef = useRef("");

  // Theme and platform are read from the browser, so the exported file works anywhere.
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const onPhone = useSyncExternalStore(phoneMedia.subscribe, phoneMedia.get, () => false);
  const applePhone = useSyncExternalStore(phoneMedia.subscribe, () => onPhone && isApplePhone(), () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const ios = config.iosOnPhone && applePhone;
  const palette = dark ? palettes.dark : palettes.light;
  const accent =
    ios && config.accentColor === defaultConfig.accentColor ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
  const accentLuminance = luminance(accent);
  const style = {
    "--modal-accent": accent,
    "--modal-accent-text": readableAccent(accent, palette.surface, dark),
    "--modal-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--modal-ring": accentLuminance <= 0.35 || dark ? accent : "#000000",
    "--modal-radius": `${ios ? 14 : config.radius}px`,
    "--modal-surface": palette.surface,
    "--modal-text": palette.text,
    "--modal-muted": palette.muted,
    "--modal-border": palette.border,
    "--modal-line": palette.line,
    "--modal-hover": palette.hover,
    ...(ios ? { fontFamily: IOS_FONT } : null),
  } as CSSProperties;
  const primaryButton = `cursor-pointer rounded-(--modal-radius) bg-(--modal-accent) px-4 font-medium text-(--modal-on-accent) ${focusRing} ${ios ? "min-h-11 py-2.5" : "py-2"}`;

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    actionRef.current = "dismiss";
    dialog.showModal();
    // Stop the page behind the modal from scrolling.
    overflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    (config.initialFocus === "primary" ? primaryRef.current : titleRef.current)?.focus();
  }

  function close(action: ModalAction) {
    actionRef.current = action;
    dialogRef.current?.close();
  }

  function onClose() {
    document.documentElement.style.overflow = overflowRef.current;
    triggerRef.current?.focus();
    onAction?.(actionRef.current);
  }

  // Keep Tab inside the dialog (APG dialog pattern), including from the focused title.
  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea")];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (!event.shiftKey && index === items.length - 1) {
      event.preventDefault();
      items[0]?.focus();
    }
  }

  return (
    <div style={style}>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={open} className={primaryButton}>
        {config.triggerText}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        onClose={onClose}
        onKeyDown={onKeyDown}
        onMouseDown={(event) => {
          // A click on the backdrop must not pull keyboard focus out of the dialog.
          if (event.target === event.currentTarget) event.preventDefault();
        }}
        onClick={(event) => {
          if (config.closeOnBackdrop && event.target === event.currentTarget) close("dismiss");
        }}
        className={`max-h-[calc(100%-2rem)] overflow-auto border-0 bg-(--modal-surface) p-0 text-(--modal-text) shadow-xl backdrop:bg-black/50 ${widths[config.size]} ${
          ios
            ? "mx-auto mt-auto mb-0 w-full rounded-t-[1.25rem] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out starting:translate-y-full motion-reduce:transition-none"
            : `${positions[config.position]} ${animations[config.animation]}`
        }`}
      >
        <div className="p-6">
          {ios && <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-9 rounded-full bg-(--modal-line)" />}
          <div className="flex items-start justify-between gap-4">
            <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1} className="text-lg font-semibold outline-none">
              {config.title}
            </h2>
            {config.closeButton && (
              <button
                type="button"
                aria-label="Close"
                onClick={() => close("dismiss")}
                className={`-m-1 grid shrink-0 cursor-pointer place-items-center rounded-(--modal-radius) text-(--modal-muted) hover:bg-(--modal-hover) ${focusRing} ${ios ? "size-11" : "size-8"}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
          <p id={`${id}-body`} className="mt-2 text-(--modal-muted)">
            {config.body}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {config.secondaryButton && (
              <button
                type="button"
                onClick={() => close("secondary")}
                className={`cursor-pointer rounded-(--modal-radius) border border-(--modal-border) bg-transparent px-4 font-medium text-(--modal-text) hover:bg-(--modal-hover) ${focusRing} ${ios ? "min-h-11 py-2.5 border-0 text-(--modal-accent-text)" : "py-2"}`}
              >
                {config.secondaryText}
              </button>
            )}
            <button ref={primaryRef} type="button" onClick={() => close("primary")} className={primaryButton}>
              {config.primaryText}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
