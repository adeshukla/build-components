"use client";

import { useId, useRef, type CSSProperties, type KeyboardEvent } from "react";

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
  accentColor: "#2563eb",
  radius: 8,
  size: "md",
};
// @config-end

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--modal-ring)";
const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
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

  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--modal-accent": config.accentColor,
    "--modal-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--modal-ring": accentLuminance <= 0.3 ? config.accentColor : "#000000",
    "--modal-radius": `${config.radius}px`,
  } as CSSProperties;
  const primaryButton = `cursor-pointer rounded-(--modal-radius) bg-(--modal-accent) px-4 py-2 font-medium text-(--modal-on-accent) ${focusRing}`;

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
        className={`max-h-[calc(100%-2rem)] overflow-auto border-0 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/50 ${widths[config.size]} ${positions[config.position]} ${animations[config.animation]}`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1} className="text-lg font-semibold outline-none">
              {config.title}
            </h2>
            {config.closeButton && (
              <button
                type="button"
                aria-label="Close"
                onClick={() => close("dismiss")}
                className={`-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-(--modal-radius) text-neutral-700 hover:bg-neutral-100 ${focusRing}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
          <p id={`${id}-body`} className="mt-2 text-neutral-700">
            {config.body}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {config.secondaryButton && (
              <button
                type="button"
                onClick={() => close("secondary")}
                className={`cursor-pointer rounded-(--modal-radius) border border-neutral-500 bg-white px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-100 ${focusRing}`}
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
