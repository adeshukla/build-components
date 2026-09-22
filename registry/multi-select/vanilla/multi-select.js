/**
 * Multi-select — plain JavaScript, no dependencies.
 * A combobox whose list allows several choices: the caret never leaves the box, so the
 * highlighted option is pointed at with aria-activedescendant rather than real focus.
 */
(function () {
  function createMultiSelect(root) {
    const input = root.querySelector("[data-input]");
    const list = root.querySelector("[data-list]");
    const chosenList = root.querySelector("[data-chosen]");
    const announce = root.querySelector("[data-announce]");
    const empty = root.querySelector("[data-empty]");
    const options = Array.from(root.querySelectorAll("[data-option]"));
    if (!input || !list) return;

    const startsWith = root.dataset.filter === "startsWith";
    const max = Number(root.dataset.max) || 0;
    const clearAll = root.dataset.clearAll !== "false";
    const label = root.dataset.label || "";
    let chosen = [];
    let active = 0;

    function matches() {
      return options.filter(function (option) {
        return !option.hidden;
      });
    }

    function say(text) {
      if (announce) announce.textContent = text;
    }

    function setOpen(open) {
      input.setAttribute("aria-expanded", String(open));
      const opening = open && list.hidden;
      list.hidden = !open;
      if (!open) input.removeAttribute("aria-activedescendant");
      else paintActive();
      // Opening says how many options there are, as the React output does.
      if (opening) {
        const count = matches().length;
        say(count + " option" + (count === 1 ? "" : "s") + " available.");
      }
    }

    function paintActive() {
      const shown = matches();
      if (shown.length === 0) {
        input.removeAttribute("aria-activedescendant");
        return;
      }
      active = Math.min(active, shown.length - 1);
      options.forEach(function (option) {
        option.classList.remove("ms-active");
      });
      shown[active].classList.add("ms-active");
      input.setAttribute("aria-activedescendant", shown[active].id);
    }

    function paintChosen() {
      if (!chosenList) return;
      chosenList.hidden = chosen.length === 0;
      chosenList.innerHTML = "";
      chosen.forEach(function (label) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ms-chip";
        // Named outright: joined text nodes would read "Testing , remove".
        button.setAttribute("aria-label", "Remove " + label);
        button.innerHTML =
          label.replace(/[<>&]/g, "") +
          '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        button.addEventListener("click", function () {
          toggle(label);
          input.focus();
        });
        item.appendChild(button);
        chosenList.appendChild(item);
      });

      if (clearAll && chosen.length > 0) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ms-clear";
        button.textContent = "Clear all";
        button.addEventListener("click", function () {
          chosen = [];
          paintChosen();
          paintOptions();
          say("All removed. 0 selected.");
          input.focus();
        });
        item.appendChild(button);
        chosenList.appendChild(item);
      }
    }

    function paintOptions() {
      const full = max > 0 && chosen.length >= max;
      options.forEach(function (option) {
        const selected = chosen.indexOf(option.dataset.option) !== -1;
        option.setAttribute("aria-selected", String(selected));
        option.classList.toggle("ms-full", full && !selected);
      });
    }

    function toggle(value) {
      const at = chosen.indexOf(value);
      if (at !== -1) {
        chosen.splice(at, 1);
        say(value + " removed. " + chosen.length + " selected.");
      } else if (max > 0 && chosen.length >= max) {
        say("You can choose " + max + " at most. Remove one first.");
        return;
      } else {
        chosen.push(value);
        say(value + " selected. " + chosen.length + " selected.");
        input.value = "";
        filter();
      }
      paintChosen();
      paintOptions();
    }

    function filter() {
      const search = input.value.trim().toLowerCase();
      options.forEach(function (option) {
        const text = option.dataset.option.toLowerCase();
        const hit = search === "" || (startsWith ? text.indexOf(search) === 0 : text.indexOf(search) !== -1);
        option.hidden = !hit;
      });
      const shown = matches();
      if (empty) {
        empty.hidden = shown.length > 0;
        empty.textContent = "No matches for “" + input.value + "”.";
      }
      active = 0;
      paintActive();
      say(shown.length + " option" + (shown.length === 1 ? "" : "s") + " available.");
    }

    input.addEventListener("input", function () {
      setOpen(true);
      filter();
    });
    input.addEventListener("focus", function () {
      setOpen(true);
    });

    input.addEventListener("keydown", function (event) {
      const shown = matches();
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) {
          setOpen(true);
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        active = (active + step + shown.length) % Math.max(1, shown.length);
        paintActive();
        return;
      }
      if (event.key === "Enter" && !list.hidden && shown[active]) {
        event.preventDefault();
        toggle(shown[active].dataset.option);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      // Backspace on an empty box takes the last one off, the way tag fields usually do.
      if (event.key === "Backspace" && input.value === "" && chosen.length > 0) {
        const last = chosen[chosen.length - 1];
        chosen.pop();
        paintChosen();
        paintOptions();
        say(last + " removed. " + chosen.length + " selected.");
      }
    });

    options.forEach(function (option, index) {
      option.addEventListener("mousedown", function (event) {
        // Keep the caret in the box: a mousedown elsewhere would take focus away.
        event.preventDefault();
        toggle(option.dataset.option);
      });
      option.addEventListener("mouseenter", function () {
        active = matches().indexOf(option);
        if (active < 0) active = index;
        paintActive();
      });
    });

    document.addEventListener("pointerdown", function (event) {
      if (!root.contains(event.target)) setOpen(false);
    });

    paintOptions();
    setOpen(false);
    if (label) list.setAttribute("aria-label", label);
  }

  document.querySelectorAll("[data-multi-select]").forEach(createMultiSelect);
})();
