/**
 * Language switcher — plain JavaScript, no dependencies.
 * A disclosure holding real links: arrow keys move, Escape closes and returns focus, and a click
 * outside closes it. Each link carries lang and hreflang, so the destination language is known.
 */
(function () {
  function createLanguageSwitcher(root) {
    const button = root.querySelector("[data-button]");
    const list = root.querySelector("[data-list]");

    function setOpen(open) {
      list.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    }

    button.addEventListener("click", function () {
      setOpen(list.hidden);
    });

    list.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const links = Array.from(list.querySelectorAll("a"));
      const at = links.indexOf(document.activeElement);
      const next = event.key === "ArrowDown" ? (at + 1) % links.length : at <= 0 ? links.length - 1 : at - 1;
      links[next].focus();
    });

    // On the document: Safari does not focus a button when it is clicked.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !list.hidden) {
        setOpen(false);
        button.focus();
      }
    });
    document.addEventListener("pointerdown", function (event) {
      if (!root.contains(event.target)) setOpen(false);
    });
  }

  document.querySelectorAll("[data-language-switcher]").forEach(createLanguageSwitcher);
})();
