/**
 * Cookie consent — plain JavaScript, no dependencies.
 * Asks once, keeps the answer in localStorage and fires a "cookie-consent" event on window with
 * event.detail.categories, e.g. { analytics: true, marketing: false }.
 *
 * This handles the choice, not the cookies: only load optional scripts once their category is true.
 *   const saved = JSON.parse(localStorage.getItem("cookie-consent") || "null");
 *   if (saved && saved.categories.analytics) loadAnalytics();
 */
(function () {
  let memory = {};

  // Storage can be blocked (private windows, sandboxed frames), so fall back to memory.
  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory[key] || null;
    }
  }
  function write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memory[key] = value;
    }
  }

  function createCookieConsent(root) {
    const key = root.dataset.storageKey || "cookie-consent";
    const banner = root.querySelector("[data-banner]");
    const reopen = root.querySelector("[data-reopen]");
    const dialog = root.querySelector("dialog");
    const form = root.querySelector("[data-form]");
    const title = dialog.querySelector(".cc-title");
    const boxes = Array.from(form.querySelectorAll("input[name]"));
    let saving = false;

    function saved() {
      try {
        return JSON.parse(read(key) || "null");
      } catch {
        return null;
      }
    }

    function show() {
      const choice = saved();
      banner.hidden = !!choice;
      if (reopen) reopen.hidden = !choice;
    }

    function save(categories) {
      const choice = { categories: categories, savedAt: new Date().toISOString() };
      write(key, JSON.stringify(choice));
      show();
      // The banner has just gone; put focus somewhere sensible instead of losing it.
      if (reopen) reopen.focus();
      window.dispatchEvent(new CustomEvent("cookie-consent", { detail: choice }));
    }

    function every(value) {
      const categories = {};
      boxes.forEach(function (box) {
        categories[box.name] = value;
      });
      return categories;
    }

    function openPreferences() {
      // Start from what is saved, not from boxes ticked and then cancelled last time.
      const choice = saved();
      boxes.forEach(function (box) {
        box.checked = !!(choice && choice.categories[box.name]);
      });
      dialog.showModal();
      title.focus();
    }

    root.querySelector("[data-accept]").addEventListener("click", function () {
      save(every(true));
    });
    root.querySelector("[data-reject]").addEventListener("click", function () {
      save(every(false));
    });
    const choose = root.querySelector("[data-choose]");
    if (choose) choose.addEventListener("click", openPreferences);
    if (reopen) reopen.addEventListener("click", openPreferences);
    root.querySelector("[data-cancel]").addEventListener("click", function () {
      dialog.close();
    });

    form.addEventListener("submit", function () {
      const categories = {};
      boxes.forEach(function (box) {
        categories[box.name] = box.checked;
      });
      saving = true;
      save(categories);
    });

    dialog.addEventListener("close", function () {
      // The browser hands focus back to whatever opened the dialog as it closes, which after saving
      // is a button that has just been hidden. So focus is placed here, once the dialog has closed.
      if (reopen && !reopen.hidden) reopen.focus();
      else if (!saving && choose && !banner.hidden) choose.focus();
      saving = false;
    });

    // Keep Tab inside the preferences (APG dialog pattern).
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll("button, a[href], input:not(:disabled)"));
      const index = items.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    });

    window.addEventListener("storage", function (event) {
      if (event.key === key) show();
    });
    show();
  }

  document.querySelectorAll("[data-cookie-consent]").forEach(createCookieConsent);
})();
