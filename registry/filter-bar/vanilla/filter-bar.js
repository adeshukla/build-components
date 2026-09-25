/**
 * Filter bar — plain JavaScript, no dependencies.
 * Chips are real toggle buttons (aria-pressed), the applied filters are listed as removable pills,
 * and every change is summed up once in a status line.
 */
(function () {
  function createFilterBar(root) {
    const chips = Array.from(root.querySelectorAll("[data-chip]"));
    const pills = root.querySelector("[data-pills]");
    const clear = root.querySelector("[data-clear]");
    const status = root.querySelector("[data-status]");

    function chipName(chip) {
      return chip.dataset.group + ": " + chip.dataset.label;
    }

    function render() {
      const on = chips.filter(function (chip) {
        return chip.getAttribute("aria-pressed") === "true";
      });

      if (pills) {
        pills.textContent = "";
        on.forEach(function (chip) {
          const item = document.createElement("li");
          item.className = "fb-pill";
          const text = document.createElement("span");
          text.textContent = chip.dataset.label;
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "fb-pill-remove";
          remove.innerHTML =
            '<span class="fb-sr"></span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
          remove.querySelector(".fb-sr").textContent = "Remove filter " + chipName(chip);
          // Removing a pill takes its own button away, so focus goes back to the chip it came from.
          remove.addEventListener("click", function () {
            chip.setAttribute("aria-pressed", "false");
            render();
            chip.focus();
          });
          item.append(text, remove);
          pills.append(item);
        });
        pills.hidden = on.length === 0;
      }

      if (clear) clear.hidden = on.length === 0;

      if (status) {
        status.textContent = on.length
          ? on.length + " filter" + (on.length === 1 ? "" : "s") + " applied: " + on.map(function (chip) {
              return chip.dataset.label;
            }).join(", ")
          : "No filters applied";
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
        render();
      });
    });

    if (clear) {
      clear.addEventListener("click", function () {
        chips.forEach(function (chip) {
          chip.setAttribute("aria-pressed", "false");
        });
        render();
        // This button goes away once nothing is on, so hand focus to the first chip.
        if (chips[0]) chips[0].focus();
      });
    }

    render();
  }

  document.querySelectorAll("[data-filter-bar]").forEach(createFilterBar);
})();
