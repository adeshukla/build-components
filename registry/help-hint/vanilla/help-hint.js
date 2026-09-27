/**
 * Help hint — plain JavaScript, no dependencies.
 * A disclosure, so the help stays until it is closed. While it is open it joins the field's description,
 * which is what makes it part of the question rather than loose text on the page.
 */
(function () {
  function createHelpHint(root) {
    const toggle = root.querySelector("[data-toggle]");
    const help = root.querySelector("[data-help]");
    const field = root.querySelector("[data-field]");
    const base = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(function (part) {
        return part !== "" && part !== help.id;
      });

    function paint(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      help.hidden = !open;
      const parts = open ? base.concat([help.id]) : base;
      if (parts.length === 0) field.removeAttribute("aria-describedby");
      else field.setAttribute("aria-describedby", parts.join(" "));
    }

    toggle.addEventListener("click", function () {
      paint(toggle.getAttribute("aria-expanded") !== "true");
    });

    paint(toggle.getAttribute("aria-expanded") === "true");
  }

  document.querySelectorAll("[data-help-hint]").forEach(createHelpHint);
})();
