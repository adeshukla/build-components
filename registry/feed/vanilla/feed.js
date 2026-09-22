/**
 * Feed — plain JavaScript, no dependencies.
 * Follows the WAI-ARIA APG "Feed" pattern: articles in a role="feed", Page Down / Page Up between
 * them, aria-busy while loading. Replace loadPage with a request to your server.
 */
(function () {
  /** Stands in for a network request in this demo. */
  const DEMO_DELAY = 500;

  function createFeed(root) {
    const list = root.querySelector("[data-list]");
    const more = root.querySelector("[data-more]");
    const count = root.querySelector("[data-count]");
    const status = root.querySelector("[data-status]");
    const sentinel = root.querySelector("[data-sentinel]");
    const pageSize = Number(root.dataset.pageSize) || 4;
    let all = [];
    try {
      all = JSON.parse(root.querySelector("[data-source]").textContent);
    } catch {
      all = [];
    }
    let shown = list.children.length;
    let busy = false;

    /** Your request goes here: resolve with the next items. */
    function loadPage(from) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(all.slice(from, from + pageSize));
        }, DEMO_DELAY);
      });
    }

    function article(item, index) {
      const node = document.createElement("article");
      node.className = "fd-item";
      node.tabIndex = 0;
      node.setAttribute("aria-labelledby", "feed-title-" + index);
      node.setAttribute("aria-posinset", String(index + 1));
      node.setAttribute("aria-setsize", String(all.length));
      const title = document.createElement("p");
      title.className = "fd-title";
      title.id = "feed-title-" + index;
      title.textContent = item.title;
      node.appendChild(title);
      if (item.summary && item.summary.trim()) {
        const summary = document.createElement("p");
        summary.className = "fd-summary";
        summary.id = "feed-summary-" + index;
        summary.textContent = item.summary;
        node.setAttribute("aria-describedby", summary.id);
        node.appendChild(summary);
      }
      return node;
    }

    function load(moveFocus) {
      if (busy || shown >= all.length) return;
      busy = true;
      list.setAttribute("aria-busy", "true");
      more.setAttribute("aria-disabled", "true");
      more.textContent = "Loading…";
      loadPage(shown).then(function (items) {
        const firstNew = shown;
        items.forEach(function (item, offset) {
          list.appendChild(article(item, firstNew + offset));
        });
        shown += items.length;
        busy = false;
        list.setAttribute("aria-busy", "false");
        status.textContent = items.length + " more loaded. Showing " + shown + " of " + all.length + ".";
        if (shown >= all.length) {
          // The end is said in words, not just by the button going away.
          const end = document.createElement("p");
          end.className = "fd-count";
          end.textContent = "That's everything: " + all.length + " of " + all.length + ".";
          more.parentElement.replaceChildren(end);
          if (observer) observer.disconnect();
        } else {
          more.removeAttribute("aria-disabled");
          more.textContent = "Load more";
          count.textContent = "Showing " + shown + " of " + all.length;
        }
        // Someone who pressed the button goes on reading from the first new item; scrolling
        // never moves focus.
        if (moveFocus) list.children[firstNew].focus();
      });
    }

    if (more) {
      more.addEventListener("click", function () {
        load(true);
      });
    }

    // Page Down and Page Up move between articles.
    list.addEventListener("keydown", function (event) {
      const item = event.target;
      if (!item.matches("article")) return;
      const items = Array.from(list.children);
      const index = items.indexOf(item);
      const target = event.key === "PageDown" ? items[index + 1] : event.key === "PageUp" ? items[index - 1] : null;
      if (!target) return;
      event.preventDefault();
      target.focus();
    });

    // Scroll mode: load when the end of the list comes into view.
    let observer = null;
    if (root.dataset.mode === "scroll" && more && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        if (entries.some((entry) => entry.isIntersecting)) load(false);
      });
      observer.observe(sentinel);
    }
  }

  document.querySelectorAll("[data-feed]").forEach(createFeed);
})();
