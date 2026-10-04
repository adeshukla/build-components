/**
 * FAQ — plain JavaScript, no dependencies.
 * The answers work with no script at all; this only adds the open-all button, which sets the state on
 * the elements themselves rather than keeping a copy of it.
 */
(function () {
  function createFaq(root) {
    const toggle = root.querySelector("[data-toggle-all]");
    if (!toggle) return;
    const items = Array.from(root.querySelectorAll("details"));

    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(open));
      toggle.textContent = open ? root.dataset.closeAll : root.dataset.openAll;
      items.forEach(function (item) {
        item.open = open;
      });
    });
  }

  document.querySelectorAll("[data-faq]").forEach(createFaq);
})();
