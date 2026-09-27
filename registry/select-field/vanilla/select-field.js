/**
 * Select field — plain JavaScript, no dependencies.
 * The select does its own work; this only handles the "needed" check and says what was chosen.
 */
(function () {
  function createSelectField(root) {
    const field = root.querySelector("[data-field]");
    const error = root.querySelector("[data-error]");
    const go = root.querySelector("[data-go]");
    const status = root.querySelector("[data-status]");
    const base = field.getAttribute("aria-describedby") || "";
    const required = root.dataset.required === "true";

    function clearError() {
      if (!error) return;
      error.hidden = true;
      field.removeAttribute("aria-invalid");
      // The message joins the field's description only while it is showing.
      if (base) field.setAttribute("aria-describedby", base);
      else field.removeAttribute("aria-describedby");
    }

    field.addEventListener("change", function () {
      if (field.value !== "") clearError();
      if (status) status.textContent = field.value === "" ? "" : field.value + " chosen";
    });

    if (go) {
      go.addEventListener("click", function () {
        if (required && field.value === "" && error) {
          error.hidden = false;
          field.setAttribute("aria-invalid", "true");
          field.setAttribute("aria-describedby", (base ? base + " " : "") + "sf-error");
          field.focus();
        } else {
          clearError();
        }
      });
    }
  }

  document.querySelectorAll("[data-select-field]").forEach(createSelectField);
})();
