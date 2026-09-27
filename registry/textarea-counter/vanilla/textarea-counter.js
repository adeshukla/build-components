/**
 * Textarea with counter — plain JavaScript, no dependencies.
 * The counter is read out at the marks that matter, never on every keystroke: a live counter would
 * repeat the whole number for every letter typed.
 */
(function () {
  function plural(n) {
    return n + " character" + (n === 1 ? "" : "s");
  }

  function createTextareaCounter(root) {
    const field = root.querySelector("[data-field]");
    const counter = root.querySelector("[data-counter]");
    const raw = root.querySelector("[data-raw]");
    const error = root.querySelector("[data-error]");
    const said = root.querySelector("[data-said]");
    const base = field.getAttribute("aria-describedby") || "";
    const max = Number(root.dataset.max);
    const warnAt = Number(root.dataset.warn);
    let lastMark = "fine";

    function refresh() {
      const left = max - field.value.length;
      const over = left < 0;
      counter.textContent = over ? plural(-left) + " over the limit" : plural(left) + " left";
      counter.classList.toggle("tc-counter--over", over);
      counter.classList.toggle("tc-counter--warn", !over && left <= warnAt);
      if (raw) raw.textContent = field.value.length + " / " + max;
      if (over) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      if (error) error.hidden = !over;
      // The message joins the field's description only while it is showing.
      field.setAttribute("aria-describedby", over ? base + " tc-error" : base);

      const mark = over ? "over" : left === 0 ? "none" : left <= warnAt ? "warn" : "fine";
      if (mark !== lastMark) {
        lastMark = mark;
        if (said) said.textContent = mark === "fine" ? "" : counter.textContent;
      }
    }

    field.addEventListener("input", refresh);
    refresh();
  }

  document.querySelectorAll("[data-textarea-counter]").forEach(createTextareaCounter);
})();
