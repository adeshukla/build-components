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

  let count = 0;

  function createModal(root, config) {
    const id = `modal-${++count}`;
    let action = "dismiss";
    let previousOverflow = "";

    const accentLuminance = luminance(config.accentColor);
    root.classList.add("mdl");
    root.style.setProperty("--modal-accent", config.accentColor);
    root.style.setProperty("--modal-on-accent", accentLuminance > 0.179 ? "#000000" : "#ffffff");
    root.style.setProperty("--modal-ring", accentLuminance <= 0.3 ? config.accentColor : "#000000");
    root.style.setProperty("--modal-radius", `${config.radius}px`);

    // Only ids and fixed markup are interpolated here; user-provided text is set with textContent below.
    root.innerHTML = `
      <button type="button" class="mdl-button mdl-button--primary" data-trigger aria-haspopup="dialog"></button>
      <dialog class="mdl-dialog mdl-dialog--${config.size} mdl-dialog--${config.position} mdl-dialog--${config.animation}"
        aria-labelledby="${id}-title" aria-describedby="${id}-body">
        <div class="mdl-inner">
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
