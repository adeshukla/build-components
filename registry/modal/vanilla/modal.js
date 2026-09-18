/**
 * Modal — plain JavaScript, no dependencies.
 * Markup: <div data-modal></div>  Styles: modal.css
 * Follows the WAI-ARIA APG "Dialog (Modal)" pattern.
 * After closing, the root element fires a "modal-action" event: event.detail.action is
 * "primary", "secondary" or "dismiss" (Escape, × or backdrop).
 */
(function () {
  // @config-start
  const defaultConfig = {
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

  // WCAG relative luminance, used to keep button text and focus rings readable on any accent colour.
  function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a, b) {
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  function shift(hex, factor) {
    const channels = [1, 3, 5].map((i) =>
      Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))),
    );
    return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  /** The accent used as text: darkened (or lightened on dark) until it clears 4.5:1. */
  function readableAccent(hex, surface, dark) {
    let color = hex;
    const surfaceLuminance = luminance(surface);
    for (let i = 0; i < 14 && contrast(luminance(color), surfaceLuminance) < 4.5; i++) {
      color = shift(color, dark ? 1.15 : 0.85);
    }
    return color;
  }

  const IOS_FONT = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
  const IOS_BLUE = { light: "#007aff", dark: "#0a84ff" };
  const palettes = {
    light: { surface: "#ffffff", text: "#171717", muted: "#535358", border: "#737373", line: "#d4d4d4", hover: "#f2f2f7" },
    dark: { surface: "#1c1c1e", text: "#f5f5f7", muted: "#b0b0b8", border: "#8e8e93", line: "#48484a", hover: "#2c2c2e" },
  };
  const isApplePhone = () =>
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let count = 0;

  function createModal(root, config) {
    const id = `modal-${++count}`;
    let action = "dismiss";
    let previousOverflow = "";

    root.classList.add("mdl");

    // Theme and platform come from the browser, so this file works anywhere it is dropped in.
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const phoneQuery = window.matchMedia("(max-width: 480px)");

    function applyAppearance() {
      const dark = config.theme === "dark" || (config.theme === "system" && darkQuery.matches);
      const ios = config.iosOnPhone && phoneQuery.matches && isApplePhone();
      const palette = dark ? palettes.dark : palettes.light;
      const accent = ios && config.accentColor === "#2563eb" ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
      const accentLuminance = luminance(accent);
      root.classList.toggle("mdl--dark", dark);
      root.classList.toggle("mdl--ios", ios);
      Object.keys(palette).forEach((key) => root.style.setProperty(`--modal-${key}`, palette[key]));
      root.style.setProperty("--modal-accent", accent);
      root.style.setProperty("--modal-accent-text", readableAccent(accent, palette.surface, dark));
      root.style.setProperty("--modal-on-accent", accentLuminance > 0.179 ? "#000000" : "#ffffff");
      root.style.setProperty("--modal-ring", accentLuminance <= 0.35 || dark ? accent : "#000000");
      root.style.setProperty("--modal-radius", `${ios ? 14 : config.radius}px`);
      root.style.setProperty("--modal-font", ios ? IOS_FONT : "inherit");
    }

    applyAppearance();
    darkQuery.addEventListener("change", applyAppearance);
    phoneQuery.addEventListener("change", applyAppearance);

    // Only ids and fixed markup are interpolated here; user-provided text is set with textContent below.
    root.innerHTML = `
      <button type="button" class="mdl-button mdl-button--primary" data-trigger aria-haspopup="dialog"></button>
      <dialog class="mdl-dialog mdl-dialog--${config.size} mdl-dialog--${config.position} mdl-dialog--${config.animation}"
        aria-labelledby="${id}-title" aria-describedby="${id}-body">
        <div class="mdl-inner">
          <span class="mdl-grabber" aria-hidden="true"></span>
          <div class="mdl-header">
            <h2 class="mdl-title" id="${id}-title" tabindex="-1"></h2>
            ${config.closeButton ? '<button type="button" class="mdl-close" data-close aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' : ""}
          </div>
          <p class="mdl-body" id="${id}-body"></p>
          <div class="mdl-actions">
            ${config.secondaryButton ? '<button type="button" class="mdl-button mdl-button--secondary" data-secondary></button>' : ""}
            <button type="button" class="mdl-button mdl-button--primary" data-primary></button>
          </div>
        </div>
      </dialog>`;

    const find = (selector) => root.querySelector(selector);
    const trigger = find("[data-trigger]");
    const dialog = find("dialog");
    const title = find(".mdl-title");
    const primary = find("[data-primary]");
    const secondary = find("[data-secondary]");
    const closeButton = find("[data-close]");

    trigger.textContent = config.triggerText;
    title.textContent = config.title;
    find(".mdl-body").textContent = config.body;
    primary.textContent = config.primaryText;
    if (secondary) secondary.textContent = config.secondaryText;

    function close(nextAction) {
      action = nextAction;
      dialog.close();
    }

    trigger.addEventListener("click", () => {
      if (dialog.open) return;
      action = "dismiss";
      dialog.showModal();
      // Stop the page behind the modal from scrolling.
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      (config.initialFocus === "primary" ? primary : title).focus();
    });

    primary.addEventListener("click", () => close("primary"));
    if (secondary) secondary.addEventListener("click", () => close("secondary"));
    if (closeButton) closeButton.addEventListener("click", () => close("dismiss"));

    dialog.addEventListener("mousedown", (event) => {
      // A click on the backdrop must not pull keyboard focus out of the dialog.
      if (event.target === dialog) event.preventDefault();
    });

    dialog.addEventListener("click", (event) => {
      if (config.closeOnBackdrop && event.target === dialog) close("dismiss");
    });

    // Keep Tab inside the dialog (APG dialog pattern), including from the focused title.
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...dialog.querySelectorAll("button, a[href], input, select, textarea")];
      const index = items.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    });

    dialog.addEventListener("close", () => {
      document.documentElement.style.overflow = previousOverflow;
      trigger.focus();
      root.dispatchEvent(new CustomEvent("modal-action", { detail: { action } }));
    });
  }

  document.querySelectorAll("[data-modal]").forEach((root) => createModal(root, defaultConfig));
})();
