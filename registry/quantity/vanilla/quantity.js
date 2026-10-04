/**
 * Quantity stepper — plain JavaScript, no dependencies.
 * The number input keeps its own keyboard; this adds the two buttons, the limits and the words
 * that say what happened. The root fires "quantity-change" with event.detail.value.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createQuantity(root) {
    const input = root.querySelector("[data-input]");
    const less = root.querySelector("[data-less]");
    const more = root.querySelector("[data-more]");
    const status = root.querySelector("[data-status]");
    const unit = root.dataset.unit || "";
    const min = Number(input.min);
    const max = Number(input.max);
    const step = Number(input.step) || 1;

    const say = (amount) => amount + (unit ? " " + unit : "");
    const clamp = (value) => Math.min(max, Math.max(min, value));

    function paint() {
      const value = Number(input.value);
      [
        [less, value <= min],
        [more, value >= max],
      ].forEach(function (pair) {
        if (pair[1]) pair[0].setAttribute("aria-disabled", "true");
        else pair[0].removeAttribute("aria-disabled");
      });
      root.dispatchEvent(new CustomEvent("quantity-change", { detail: { value: value } }));
    }

    function nudge(by) {
      const value = Number(input.value);
      const next = clamp(value + by);
      if (next === value) {
        status.textContent = fill(by > 0 ? root.dataset.most : root.dataset.fewest, { amount: say(value) });
        return;
      }
      input.value = String(next);
      status.textContent = say(next);
      paint();
    }

    less.addEventListener("click", function () {
      nudge(-step);
    });
    more.addEventListener("click", function () {
      nudge(step);
    });
    input.addEventListener("change", paint);
    input.addEventListener("blur", function () {
      const typed = Number(input.value);
      const next = clamp(Number.isFinite(typed) ? typed : min);
      if (next !== typed) {
        input.value = String(next);
        status.textContent = fill(root.dataset.allowed, { amount: say(next), min: min, max: max });
      }
      paint();
    });

    paint();
  }

  document.querySelectorAll("[data-quantity]").forEach(createQuantity);
})();
