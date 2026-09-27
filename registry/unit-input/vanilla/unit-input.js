/**
 * Value with unit — plain JavaScript, no dependencies.
 * The number and the unit are two fields and one answer: the status line reads them back together,
 * which is how they will be used.
 */
(function () {
  function createUnitInput(root) {
    const amount = root.querySelector("[data-amount]");
    const unit = root.querySelector("[data-unit]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const base = amount.getAttribute("aria-describedby") || "";
    const min = Number(root.dataset.min);
    const max = Number(root.dataset.max);

    function problem(value) {
      if (value.trim() === "") return false;
      const number = Number(value);
      return !isFinite(number) || number < min || number > max;
    }

    function showError(show) {
      if (!error) return;
      error.hidden = !show;
      if (show) {
        amount.setAttribute("aria-invalid", "true");
        amount.setAttribute("aria-describedby", (base ? base + " " : "") + "ui-error");
      } else {
        amount.removeAttribute("aria-invalid");
        if (base) amount.setAttribute("aria-describedby", base);
        else amount.removeAttribute("aria-describedby");
      }
    }

    function say() {
      if (!status) return;
      const chosen = unit.options[unit.selectedIndex];
      status.textContent = amount.value.trim() === "" ? "" : amount.value + " " + chosen.textContent;
    }

    amount.addEventListener("input", function () {
      // Once an error is showing, check as they type rather than waiting for them to leave.
      if (error && !error.hidden) showError(problem(amount.value));
      say();
    });
    amount.addEventListener("blur", function () {
      showError(problem(amount.value));
    });
    unit.addEventListener("change", say);

    say();
  }

  document.querySelectorAll("[data-unit-input]").forEach(createUnitInput);
})();
