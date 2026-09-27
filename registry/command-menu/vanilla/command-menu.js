/**
 * Command menu — plain JavaScript, no dependencies.
 * A combobox over a grouped listbox inside a native modal dialog. The input keeps focus the whole
 * time; aria-activedescendant is what moves, which is how a combobox is supposed to work.
 */
(function () {
  // @config-start
  const config = {
    hotkey: "k",
    emptyText: "No command matches that.",
  };
  // @config-end

  /** Matches on every word, in any order, so "copy react" finds "Copy the React file". */
  function matchesQuery(text, query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const haystack = text.toLowerCase();
    return words.every(function (word) {
      return haystack.indexOf(word) !== -1;
    });
  }

  function createCommandMenu(root) {
    const trigger = root.querySelector("[data-trigger]");
    const dialog = root.querySelector("[data-dialog]");
    const input = root.querySelector("[data-input]");
    const listbox = root.querySelector("[data-list]");
    const empty = root.querySelector("[data-empty]");
    const status = root.querySelector("[data-status]");
    const options = Array.from(root.querySelectorAll("[data-option]"));
    const groups = Array.from(root.querySelectorAll("[data-group]"));
    let shown = options.slice();
    let active = 0;
    let opener = null;

    function paint() {
      active = shown.length === 0 ? 0 : Math.min(active, shown.length - 1);
      options.forEach(function (option) {
        option.setAttribute("aria-selected", "false");
      });
      const chosen = shown[active];
      if (chosen) {
        chosen.setAttribute("aria-selected", "true");
        input.setAttribute("aria-activedescendant", chosen.id);
        // Keeps the active option in view when the arrows walk past the edge of the scroller.
        if (chosen.scrollIntoView) chosen.scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
      input.setAttribute("aria-expanded", shown.length > 0 ? "true" : "false");
      // With nothing in it there is no listbox: a listbox has to own at least one option. The name
      // goes with the role, because aria-label is prohibited on a plain div.
      if (shown.length > 0) {
        listbox.setAttribute("role", "listbox");
        listbox.setAttribute("aria-label", listbox.dataset.name || "");
      } else {
        listbox.removeAttribute("role");
        listbox.removeAttribute("aria-label");
      }
      if (empty) {
        empty.hidden = shown.length > 0;
        empty.textContent = config.emptyText;
      }
    }

    function filter() {
      const query = input.value;
      shown = options.filter(function (option) {
        const matches = matchesQuery(option.dataset.search || option.textContent, query);
        option.hidden = !matches;
        return matches;
      });
      // A group heading with nothing under it is noise, so it goes too.
      groups.forEach(function (group) {
        group.hidden =
          group.querySelectorAll("[data-option]:not([hidden])").length === 0;
      });
      active = 0;
      paint();
    }

    function open(from) {
      // Safari does not focus a button when it is clicked, so the opener is passed in rather than read
      // from document.activeElement.
      opener = from;
      input.value = "";
      if (status) status.textContent = "";
      filter();
      dialog.showModal();
      input.focus();
    }

    function close() {
      // Focus cannot leave a modal dialog that is still open, so it closes first.
      dialog.close();
      if (opener) opener.focus();
    }

    function run(option) {
      if (status) status.textContent = "Ran: " + (option.dataset.label || option.textContent.trim());
      close();
    }

    trigger.addEventListener("click", function () {
      open(trigger);
    });

    dialog.addEventListener("cancel", function (event) {
      // Escape is handled here so focus goes back to the opener rather than nowhere.
      event.preventDefault();
      close();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) close();
    });

    input.addEventListener("input", filter);
    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (shown.length > 0) active = (active + 1) % shown.length;
        paint();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (shown.length > 0) active = (active - 1 + shown.length) % shown.length;
        paint();
      } else if (event.key === "Home") {
        event.preventDefault();
        active = 0;
        paint();
      } else if (event.key === "End") {
        event.preventDefault();
        active = Math.max(shown.length - 1, 0);
        paint();
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (shown[active]) run(shown[active]);
      }
    });

    options.forEach(function (option, index) {
      // The pointer sets the active option too, so hovering and arrowing never disagree.
      option.addEventListener("mousemove", function () {
        const at = shown.indexOf(option);
        if (at === -1 || at === active) return;
        active = at;
        paint();
      });
      option.addEventListener("click", function () {
        run(option);
      });
      void index;
    });

    if (config.hotkey.trim() !== "") {
      const hotkey = config.hotkey.trim().toLowerCase();
      document.addEventListener("keydown", function (event) {
        if (event.key.toLowerCase() !== hotkey || !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        if (dialog.open) close();
        else open(trigger);
      });
    }

    filter();
  }

  document.querySelectorAll("[data-command-menu]").forEach(createCommandMenu);
})();
