/**
 * Checkbox group — plain JavaScript, no dependencies.
 * The "everything" box carries the third state a checkbox can only be put into from script, and the
 * count is said politely rather than on every tick.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createCheckboxGroup(root) {
    const boxes = Array.from(root.querySelectorAll("[data-option]"));
    const all = root.querySelector("[data-all]");
    const count = root.querySelector("[data-count]");
    const error = root.querySelector("[data-error]");
    const save = root.querySelector("[data-save]");
    const minimum = Number(root.dataset.min || 0);

    function picked() {
      return boxes.filter(function (box) {
        return box.checked;
      });
    }

    function refresh() {
      const on = picked().length;
      if (all) {
        all.checked = on === boxes.length && boxes.length > 0;
        // "Some of them" is a third state a checkbox can only be put into from script.
        all.indeterminate = on > 0 && on < boxes.length;
      }
      if (count) count.textContent = fill(root.dataset.count, { count: on, total: boxes.length });
      if (error && !error.hidden && on >= minimum) hideError();
    }

    function hideError() {
      error.hidden = true;
      error.textContent = "";
    }

    boxes.forEach(function (box) {
      box.addEventListener("change", refresh);
    });

    if (all) {
      all.addEventListener("change", function () {
        boxes.forEach(function (box) {
          box.checked = all.checked;
        });
        if (error) hideError();
        refresh();
      });
    }

    if (save && error) {
      save.addEventListener("click", function () {
        if (picked().length < minimum) {
          error.textContent = root.dataset.errorText;
          error.hidden = false;
        } else {
          hideError();
        }
      });
    }

    refresh();
  }

  document.querySelectorAll("[data-checkbox-group]").forEach(createCheckboxGroup);
})();
