/**
 * Searchable select — plain JavaScript, no dependencies.
 * Markup: <div data-searchable-select></div>  Styles: searchable-select.css
 * Follows the WAI-ARIA APG "Editable Combobox With List Autocomplete" pattern.
 */
(function () {
  // @config-start
  const defaultConfig = {
    label: "Country",
    placeholder: "Start typing to search",
    options: [
      { label: "Australia" },
      { label: "Brazil" },
      { label: "Canada" },
      { label: "France" },
      { label: "Germany" },
      { label: "India" },
      { label: "Japan" },
      { label: "Kenya" },
      { label: "Mexico" },
      { label: "Netherlands" },
      { label: "New Zealand" },
      { label: "Spain" },
      { label: "United Kingdom" },
      { label: "United States" },
    ],
    noResultsText: "No matches. Try a different spelling.",
    name: "country",
    filter: "contains",
    maxVisible: 6,
    clearButton: false,
    helperText: false,
    helperTextContent: "Type to filter, then use the arrow keys or click to choose.",
    theme: "light",
    iosOnPhone: true,
    accentColor: "#2563eb",
    radius: 6,
    size: "md",
  };
  // @config-end

  // WCAG relative luminance, used to keep text and focus rings readable on any accent colour.
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
    light: {
      surface: "#ffffff",
      sunk: "#f2f2f7",
      text: "#171717",
      muted: "#535358",
      border: "#737373",
      line: "#d4d4d4",
      error: "#b3261e",
      hover: "#f2f2f7",
    },
    dark: {
      surface: "#1c1c1e",
      sunk: "#2c2c2e",
      text: "#f5f5f7",
      muted: "#b0b0b8",
      border: "#8e8e93",
      line: "#48484a",
      error: "#ff6b6b",
      hover: "#2c2c2e",
    },
  };
  const isApplePhone = () =>
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const svg = (body, className) =>
    `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"${className ? ` class="${className}"` : ""}>${body}</svg>`;

  let count = 0;

  function createSearchableSelect(root, config) {
    const id = `searchable-select-${++count}`;
    const labels = config.options.map((option) => option.label.trim()).filter(Boolean);
    const noun = config.label.trim().toLowerCase() || "option";
    const showHelper = config.helperText && config.helperTextContent !== "";
    let selected = "";
    let open = false;
    let active = -1;
    let matches = labels;

    root.classList.add("ss", `ss--${config.size}`);
    root.style.setProperty("--ss-visible", String(config.maxVisible));

    // Theme and platform come from the browser, so this file works anywhere it is dropped in.
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const phoneQuery = window.matchMedia("(max-width: 480px)");

    function applyAppearance() {
      const dark = config.theme === "dark" || (config.theme === "system" && darkQuery.matches);
      const ios = config.iosOnPhone && phoneQuery.matches && isApplePhone();
      const palette = dark ? palettes.dark : palettes.light;
      const accent = ios && config.accentColor === "#2563eb" ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
      const accentLuminance = luminance(accent);
      root.classList.toggle("ss--dark", dark);
      root.classList.toggle("ss--ios", ios);
      Object.keys(palette).forEach((key) => root.style.setProperty(`--ss-${key}`, palette[key]));
      root.style.setProperty("--ss-accent", accent);
      root.style.setProperty("--ss-accent-text", readableAccent(accent, palette.surface, dark));
      root.style.setProperty("--ss-on-accent", accentLuminance > 0.179 ? "#000000" : "#ffffff");
      root.style.setProperty("--ss-ring", accentLuminance <= 0.35 || dark ? accent : "#000000");
      root.style.setProperty("--ss-radius", `${ios ? 12 : config.radius}px`);
      root.style.setProperty("--ss-font", ios ? IOS_FONT : "inherit");
    }

    applyAppearance();
    darkQuery.addEventListener("change", applyAppearance);
    phoneQuery.addEventListener("change", applyAppearance);

    // Only ids and icons are interpolated here; user-provided text is set with textContent below.
    root.innerHTML = `
      <label class="ss-label" id="${id}-label" for="${id}-input"></label>
      <div class="ss-control">
        <div class="ss-field">
          <input class="ss-input" id="${id}-input" type="text" role="combobox" autocomplete="off"
            aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-listbox">
          ${config.clearButton ? `<button type="button" class="ss-icon-button" data-clear hidden>${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>` : ""}
          <button type="button" class="ss-icon-button" data-toggle tabindex="-1" aria-expanded="false" aria-controls="${id}-listbox">${svg('<path d="m6 9 6 6 6-6"/>', "ss-chevron")}</button>
        </div>
        <ul class="ss-listbox" id="${id}-listbox" role="listbox" aria-labelledby="${id}-label" hidden></ul>
        <p class="ss-no-results" data-no-results hidden></p>
      </div>
      ${showHelper ? `<p class="ss-helper" id="${id}-help"></p>` : ""}
      <p class="ss-error" id="${id}-error" role="alert"></p>
      <p class="ss-sr-only" aria-live="polite" data-status></p>
      ${config.name ? '<input type="hidden" data-value>' : ""}`;

    const find = (selector) => root.querySelector(selector);
    const field = find(".ss-field");
    const input = find(".ss-input");
    const clearButton = find("[data-clear]");
    const toggle = find("[data-toggle]");
    const listbox = find(".ss-listbox");
    const noResults = find(".ss-no-results");
    const errorText = find(".ss-error");
    const status = find("[data-status]");
    const valueInput = find("[data-value]");

    find(".ss-label").textContent = config.label;
    input.placeholder = config.placeholder;
    noResults.textContent = config.noResultsText;
    toggle.setAttribute("aria-label", `Show ${noun} options`);
    if (clearButton) clearButton.setAttribute("aria-label", `Clear ${noun}`);
    if (showHelper) find(".ss-helper").textContent = config.helperTextContent;
    if (valueInput) valueInput.name = config.name;

    function setError(message) {
      errorText.textContent = message;
      field.toggleAttribute("data-invalid", !!message);
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      const describedBy = [showHelper && `${id}-help`, message && `${id}-error`].filter(Boolean).join(" ");
      if (describedBy) input.setAttribute("aria-describedby", describedBy);
      else input.removeAttribute("aria-describedby");
    }

    function render() {
      const text = input.value;
      // The text of a chosen option lists every choice again; anything else filters.
      const filtering = text.trim() !== "" && text !== selected;
      const query = filtering ? text.trim().toLowerCase() : "";
      matches = filtering
        ? labels.filter((label) =>
            config.filter === "startsWith" ? label.toLowerCase().startsWith(query) : label.toLowerCase().includes(query),
          )
        : labels;
      const expanded = open && matches.length > 0;

      input.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-expanded", String(expanded));
      root.toggleAttribute("data-expanded", expanded);
      listbox.hidden = !expanded;
      listbox.replaceChildren();

      if (expanded) {
        matches.forEach((label, index) => {
          const option = document.createElement("li");
          option.id = `${id}-option-${index}`;
          option.className = "ss-option";
          option.dataset.index = String(index);
          option.setAttribute("role", "option");
          option.setAttribute("aria-selected", String(label === selected));
          if (index === active) option.dataset.active = "";

          const textSpan = document.createElement("span");
          textSpan.className = "ss-option-text";
          const at = query ? label.toLowerCase().indexOf(query) : -1;
          if (at < 0) {
            textSpan.textContent = label;
          } else {
            const mark = document.createElement("mark");
            mark.textContent = label.slice(at, at + query.length);
            textSpan.append(label.slice(0, at), mark, label.slice(at + query.length));
          }
          option.append(textSpan);
          if (label === selected) option.insertAdjacentHTML("beforeend", svg('<path d="m5 12 5 5L20 7"/>', "ss-check"));
          listbox.append(option);
        });
      }

      if (expanded && active >= 0) {
        input.setAttribute("aria-activedescendant", `${id}-option-${active}`);
        listbox.children[active].scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }

      noResults.hidden = !(open && filtering && matches.length === 0);
      status.textContent =
        open && filtering
          ? matches.length
            ? `${matches.length} ${matches.length === 1 ? "result" : "results"} available.`
            : config.noResultsText
          : "";
      if (clearButton) clearButton.hidden = text === "";
      if (valueInput) valueInput.value = selected;
    }

    function choose(label) {
      input.value = label;
      selected = label;
      open = false;
      active = -1;
      setError("");
      render();
    }

    function close() {
      open = false;
      active = -1;
      render();
    }

    input.addEventListener("input", () => {
      open = true;
      active = -1;
      setError("");
      render();
    });

    input.addEventListener("click", () => {
      open = true;
      render();
    });

    input.addEventListener("keydown", (event) => {
      const expanded = open && matches.length > 0;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        open = true;
        render();
        if (event.altKey || matches.length === 0) return;
        const total = matches.length;
        active = event.key === "ArrowDown" ? (active + 1) % total : active <= 0 ? total - 1 : active - 1;
        render();
      } else if (event.key === "Enter") {
        if (expanded && active >= 0) {
          event.preventDefault();
          choose(matches[active]);
        }
      } else if (event.key === "Escape") {
        // First Escape closes the list; the next clears the field (APG combobox).
        if (open && (expanded || !noResults.hidden)) {
          event.preventDefault();
          close();
        } else if (input.value) {
          event.preventDefault();
          input.value = "";
          selected = "";
          setError("");
          render();
        }
      } else if (event.key === "Tab") {
        close();
      }
    });

    input.addEventListener("blur", () => {
      open = false;
      active = -1;
      const typed = input.value.trim();
      if (!typed) {
        selected = "";
        setError("");
        render();
        return;
      }
      const match = labels.find((label) => label.toLowerCase() === typed.toLowerCase());
      if (match) {
        choose(match);
      } else {
        selected = "";
        setError(`Choose ${/^[aeiou]/.test(noun) ? "an" : "a"} ${noun} from the list.`);
        render();
      }
    });

    listbox.addEventListener("mousedown", (event) => event.preventDefault());
    listbox.addEventListener("mousemove", (event) => {
      const option = event.target.closest('[role="option"]');
      if (option && Number(option.dataset.index) !== active) {
        active = Number(option.dataset.index);
        render();
      }
    });
    listbox.addEventListener("click", (event) => {
      const option = event.target.closest('[role="option"]');
      if (option) choose(matches[Number(option.dataset.index)]);
    });

    toggle.addEventListener("mousedown", (event) => event.preventDefault());
    toggle.addEventListener("click", () => {
      if (open) {
        close();
      } else {
        open = true;
        render();
      }
      input.focus();
    });

    if (clearButton) {
      clearButton.addEventListener("mousedown", (event) => event.preventDefault());
      clearButton.addEventListener("click", () => {
        input.value = "";
        selected = "";
        setError("");
        render();
        input.focus();
      });
    }

    setError("");
    render();
  }

  document.querySelectorAll("[data-searchable-select]").forEach((root) => createSearchableSelect(root, defaultConfig));
})();
