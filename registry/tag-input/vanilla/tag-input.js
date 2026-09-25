/**
 * Tag input — plain JavaScript, no dependencies.
 * Enter or a comma adds what was typed; Backspace in an empty field removes the last chip. Every
 * add and remove is announced, and the chips submit as name[] hidden fields.
 */
(function () {
  const CROSS =
    '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function createTagInput(root) {
    const field = root.querySelector("[data-field]");
    const chips = root.querySelector("[data-chips]");
    const count = root.querySelector("[data-count]");
    const status = root.querySelector("[data-status]");
    const values = root.querySelector("[data-values]");
    const max = Number(root.dataset.max) || 8;
    const duplicates = root.dataset.duplicates === "true";
    const name = root.dataset.name || "";

    const tags = () => Array.from(chips.querySelectorAll(".ti-chip")).map((chip) => chip.firstChild.textContent.trim());

    function paint() {
      const all = tags();
      count.textContent = all.length + " of " + max + " added";
      field.placeholder = all.length >= max ? "" : field.dataset.placeholder || field.placeholder;
      if (!name) return;
      values.textContent = "";
      all.forEach(function (tag) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name + "[]";
        hidden.value = tag;
        values.appendChild(hidden);
      });
    }

    function remove(chip) {
      const gone = chip.firstChild.textContent.trim();
      chip.closest("li").remove();
      paint();
      status.textContent = gone + " removed. " + tags().length + " of " + max + ".";
      field.focus();
    }

    function add(raw) {
      const value = String(raw).trim().replace(/,$/, "").trim();
      if (value === "") return;
      const all = tags();
      if (all.length >= max) {
        status.textContent = "You can add " + max + " at most. Remove one first.";
        return;
      }
      if (!duplicates && all.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
        status.textContent = value + " is already in the list.";
        field.value = "";
        return;
      }
      const item = document.createElement("li");
      const chip = document.createElement("span");
      chip.className = "ti-chip";
      chip.appendChild(document.createTextNode(value));
      const button = document.createElement("button");
      button.className = "ti-remove";
      button.type = "button";
      button.setAttribute("aria-label", "Remove " + value);
      button.setAttribute("data-remove", "");
      button.innerHTML = CROSS;
      chip.appendChild(button);
      item.appendChild(chip);
      chips.appendChild(item);
      field.value = "";
      paint();
      status.textContent = value + " added. " + tags().length + " of " + max + ".";
    }

    field.dataset.placeholder = field.placeholder;
    field.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === ",") {
        // Enter belongs to the tag, not to the form around it.
        event.preventDefault();
        add(field.value);
      } else if (event.key === "Backspace" && field.value === "") {
        const last = chips.querySelector("li:last-child .ti-chip");
        if (last) remove(last);
      }
    });
    field.addEventListener("blur", function () {
      add(field.value);
    });
    chips.addEventListener("click", function (event) {
      const button = event.target.closest("[data-remove]");
      if (button) remove(button.closest(".ti-chip"));
    });

    paint();
  }

  document.querySelectorAll("[data-tag-input]").forEach(createTagInput);
})();
