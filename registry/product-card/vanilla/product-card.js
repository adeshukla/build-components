/**
 * Product card — plain JavaScript, no dependencies.
 * Add to bag stays disabled until one option is picked in every group, and the status line says
 * what is still missing rather than leaving a dead button.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createProductCard(root) {
    const options = Array.from(root.querySelectorAll("[data-option]"));
    const add = root.querySelector("[data-add]");
    const status = root.querySelector("[data-status]");
    const groups = [];
    options.forEach(function (option) {
      if (groups.indexOf(option.dataset.group) === -1) groups.push(option.dataset.group);
    });

    function pickedIn(group) {
      const found = options.find(function (option) {
        return option.dataset.group === group && option.checked;
      });
      return found ? found.value : "";
    }

    function refresh() {
      const missing = groups.filter(function (group) {
        return pickedIn(group) === "";
      });
      add.disabled = missing.length > 0;
      if (status) {
        status.textContent = missing.length ? fill(root.dataset.pick, { missing: missing.join(" " + root.dataset.and + " ").toLowerCase() }) : "";
      }
    }

    options.forEach(function (option) {
      option.addEventListener("change", refresh);
    });

    add.addEventListener("click", function () {
      if (add.disabled || !status) return;
      status.textContent =
        fill(root.dataset.added, {
          name: root.dataset.name,
          choices: groups
            .map(function (group) {
              return pickedIn(group);
            })
            .join(", "),
        });
    });

    refresh();
  }

  document.querySelectorAll("[data-product-card]").forEach(createProductCard);
})();
