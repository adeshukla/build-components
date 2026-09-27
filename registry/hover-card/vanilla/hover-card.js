/**
 * Hover card — plain JavaScript, no dependencies.
 * The three things WCAG 1.4.13 asks of anything shown on hover: it can be dismissed without moving
 * the pointer, the pointer can move into it, and it stays until it is dismissed or the pointer leaves.
 */
(function () {
  // @config-start
  const config = {
    openDelayMs: 300,
    closeDelayMs: 400,
  };
  // @config-end

  function createHoverCard(root) {
    const holder = root.querySelector("[data-holder]");
    const trigger = root.querySelector("[data-trigger]");
    const card = root.querySelector("[data-card]");
    let timer;

    function later(open, delay) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        card.hidden = !open;
        if (open) trigger.setAttribute("aria-describedby", card.id);
        else trigger.removeAttribute("aria-describedby");
      }, delay);
    }

    // The card stays while the pointer is anywhere over the trigger or the card itself, so it can be
    // reached rather than vanishing on the way.
    holder.addEventListener("mouseenter", function () {
      later(true, config.openDelayMs);
    });
    holder.addEventListener("mouseleave", function () {
      later(false, config.closeDelayMs);
    });
    holder.addEventListener("focusin", function () {
      later(true, 0);
    });
    holder.addEventListener("focusout", function (event) {
      if (!holder.contains(event.relatedTarget)) later(false, 0);
    });

    // Dismissible without moving the pointer, heard on the document so it works wherever focus is.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || card.hidden) return;
      later(false, 0);
    });

    card.hidden = true;
  }

  document.querySelectorAll("[data-hover-card]").forEach(createHoverCard);
})();
