/**
 * Currency input — plain JavaScript, no dependencies.
 * Type freely; leaving the field tidies the amount and fills a hidden field with a plain number
 * for your server. Money is written by hand, never by locale, so it never differs between pages.
 */
(function () {
  function format(amount, decimals) {
    const fixed = Math.abs(amount).toFixed(decimals);
    const parts = fixed.split(".");
    const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (amount < 0 ? "-" : "") + grouped + (parts[1] ? "." + parts[1] : "");
  }

  /** What was typed, as a number: anything that isn't a digit, dot or minus is ignored. */
  function parse(text, allowNegative) {
    const cleaned = String(text).replace(/[^0-9.-]/g, "");
    const negative = allowNegative && cleaned.trim().indexOf("-") === 0;
    const digits = cleaned.replace(/-/g, "");
    if (digits === "" || digits === ".") return null;
    const value = Number(digits);
    return isFinite(value) ? (negative ? -value : value) : null;
  }

  function createCurrencyInput(root) {
    const input = root.querySelector("[data-input]");
    const error = root.querySelector("[data-error]");
    const hidden = root.querySelector("[data-value]");
    const decimals = Number(root.dataset.decimals) || 0;
    const allowNegative = root.dataset.negative === "true";

    input.addEventListener("input", function () {
      if (error.textContent) {
        error.textContent = "";
        input.removeAttribute("aria-invalid");
      }
    });

    input.addEventListener("blur", function () {
      const typed = parse(input.value, allowNegative);
      if (input.value.trim() === "") {
        error.textContent = "";
        input.removeAttribute("aria-invalid");
        if (hidden) hidden.value = "";
        return;
      }
      if (typed === null) {
        error.textContent = "Enter an amount, for example 12.50.";
        input.setAttribute("aria-invalid", "true");
        if (hidden) hidden.value = "";
        return;
      }
      error.textContent = "";
      input.removeAttribute("aria-invalid");
      input.value = format(typed, decimals);
      if (hidden) hidden.value = typed.toFixed(decimals);
      root.dispatchEvent(new CustomEvent("currency-change", { detail: { value: typed } }));
    });
  }

  document.querySelectorAll("[data-currency-input]").forEach(createCurrencyInput);
})();
