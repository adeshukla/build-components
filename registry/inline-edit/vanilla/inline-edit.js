/**
 * Inline edit — plain JavaScript, no dependencies.
 * A value that turns into a field: Enter saves, Escape cancels, and focus follows the mode —
 * into the field to edit, back to the button when done. The root fires "inline-save".
 */
(function () {
  function createInlineEdit(root) {
    const show = root.querySelector("[data-show]");
    const form = root.querySelector("[data-form]");
    const field = root.querySelector("[data-field]");
    const valueText = root.querySelector("[data-value]");
    const srText = root.querySelector("[data-sr]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const label = root.dataset.label || "Value";
    const required = root.dataset.required !== "false";
    const multiline = root.dataset.multiline === "true";
    let value = field.value;

    function paint() {
      valueText.textContent = value || "Not set";
      srText.textContent = " " + label + ", currently " + (value || "not set");
    }

    function edit() {
      field.value = value;
      error.textContent = "";
      field.removeAttribute("aria-invalid");
      show.hidden = true;
      form.hidden = false;
      field.focus();
    }

    function done(message) {
      form.hidden = true;
      show.hidden = false;
      status.textContent = message;
      show.focus();
    }

    function save() {
      const next = field.value.trim();
      if (required && next === "") {
        error.textContent = label + " can't be empty.";
        field.setAttribute("aria-invalid", "true");
        field.focus();
        return;
      }
      value = next;
      paint();
      done("Saved. " + label + " is now " + next + ".");
      root.dispatchEvent(new CustomEvent("inline-save", { detail: { value: next } }));
    }

    show.addEventListener("click", edit);
    root.querySelector("[data-save]").addEventListener("click", save);
    root.querySelector("[data-cancel]").addEventListener("click", function () {
      done("Edit cancelled. Nothing changed.");
    });
    field.addEventListener("input", function () {
      if (error.textContent) {
        error.textContent = "";
        field.removeAttribute("aria-invalid");
      }
    });
    field.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        done("Edit cancelled. Nothing changed.");
      } else if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        save();
      }
    });

    paint();
  }

  document.querySelectorAll("[data-inline-edit]").forEach(createInlineEdit);
})();
