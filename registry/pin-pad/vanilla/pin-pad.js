/**
 * PIN pad — plain JavaScript, no dependencies.
 * The pad is real buttons and the value lives in a hidden input. The count is announced; the digits
 * never are.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  // @config-start
  const config = {
    length: 4,
    completeText: "PIN complete.",
    progressText: "{entered} of {length} digits entered",
  };
  // @config-end

  function createPinPad(root) {
    const field = root.querySelector("[data-value]");
    const dots = Array.from(root.querySelectorAll("[data-dot]"));
    const status = root.querySelector("[data-status]");
    let value = "";

    function refresh() {
      field.value = value;
      dots.forEach(function (dot, index) {
        if (index < value.length) dot.setAttribute("data-filled", "true");
        else dot.removeAttribute("data-filled");
      });
      if (status) {
        status.textContent =
          value.length === config.length ? config.completeText : fill(config.progressText, { entered: value.length, length: config.length });
      }
    }

    function push(digit) {
      if (value.length >= config.length) return;
      value += digit;
      refresh();
    }

    root.querySelectorAll("[data-digit]").forEach(function (button) {
      button.addEventListener("click", function () {
        push(button.dataset.digit);
      });
    });

    const remove = root.querySelector("[data-delete]");
    if (remove) {
      remove.addEventListener("click", function () {
        value = value.slice(0, -1);
        refresh();
      });
    }

    const clear = root.querySelector("[data-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        value = "";
        refresh();
      });
    }

    // Typing the digits has to work too: a pad that only answers to taps is a pad a keyboard cannot use.
    root.addEventListener("keydown", function (event) {
      if (/^[0-9]$/.test(event.key)) {
        push(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        value = value.slice(0, -1);
        refresh();
      }
    });

    refresh();
  }

  document.querySelectorAll("[data-pin-pad]").forEach(createPinPad);
})();
