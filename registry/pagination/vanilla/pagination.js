/**
 * Pagination — plain JavaScript, no dependencies.
 * With a link pattern set the pages are real links and this does nothing to them. Without one
 * they are buttons, and this moves between pages and rebuilds the run of numbers.
 */
(function () {
  function createPagination(root) {
    const list = root.querySelector("[data-list]");
    if (!list || root.dataset.pattern) return;

    const total = Math.max(1, Number(root.dataset.total) || 1);
    const siblings = Math.max(0, Number(root.dataset.siblings) || 0);
    const summary = root.querySelector("[data-summary]");
    const numbered = root.classList.contains("pg--numbers");
    let current = Math.min(total, Math.max(1, Number(root.dataset.current) || 1));

    /** The first, the last, the current page and its neighbours, with gaps in between. */
    function pagesFor() {
      const pages = [];
      for (let page = 1; page <= total; page++) {
        const near = Math.abs(page - current) <= siblings;
        if (page === 1 || page === total || near) pages.push(page);
        else if (pages[pages.length - 1] !== "gap") pages.push("gap");
      }
      return pages;
    }

    function paint() {
      if (numbered) {
        // Rebuild only the numbers: the arrows keep their place and their focus.
        Array.from(list.querySelectorAll(".pg-page, .pg-gap")).forEach(function (item) {
          item.closest("li").remove();
        });
        const next = list.querySelector("li:last-child");
        pagesFor().forEach(function (page) {
          const item = document.createElement("li");
          if (page === "gap") {
            item.className = "pg-gap";
            item.setAttribute("aria-hidden", "true");
            item.textContent = "…";
          } else {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "pg-step pg-page" + (page === current ? " pg-current" : "");
            button.setAttribute("aria-label", "Page " + page);
            if (page === current) button.setAttribute("aria-current", "page");
            button.dataset.page = String(page);
            button.textContent = String(page);
            button.addEventListener("click", function () {
              go(page);
            });
            item.appendChild(button);
          }
          list.insertBefore(item, next);
        });
      }

      const previous = root.querySelector("[data-previous]");
      const nextButton = root.querySelector("[data-next]");
      if (previous) previous.disabled = current === 1;
      if (nextButton) nextButton.disabled = current === total;
      const first = root.querySelector("[data-first]");
      const last = root.querySelector("[data-last]");
      if (first) first.disabled = current === 1;
      if (last) last.disabled = current === total;
      if (summary) summary.textContent = "Page " + current + " of " + total;
    }

    function go(page) {
      current = Math.min(total, Math.max(1, page));
      paint();
      root.dispatchEvent(new CustomEvent("pagechange", { detail: { page: current }, bubbles: true }));
    }

    root.addEventListener("click", function (event) {
      const target = event.target.closest("button");
      if (!target || target.disabled) return;
      if (target.hasAttribute("data-previous")) go(current - 1);
      else if (target.hasAttribute("data-next")) go(current + 1);
      else if (target.hasAttribute("data-first")) go(1);
      else if (target.hasAttribute("data-last")) go(total);
      else if (target.dataset.page) go(Number(target.dataset.page));
    });

    paint();
  }

  document.querySelectorAll("[data-pagination]").forEach(createPagination);
})();
