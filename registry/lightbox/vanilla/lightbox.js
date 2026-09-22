/**
 * Lightbox — plain JavaScript, no dependencies.
 * Thumbnails open a full-screen viewer (a native modal dialog): arrow keys, Home/End, swipe,
 * focus kept inside, and focus back on the thumbnail of the picture you were on.
 */
(function () {
  /** How far a swipe has to travel, in pixels, to change picture. */
  const SWIPE = 50;

  function createLightbox(root) {
    const openers = Array.from(root.querySelectorAll("[data-index]"));
    const dialog = root.querySelector("dialog");
    const picture = dialog.querySelector("[data-picture]");
    const caption = dialog.querySelector("[data-caption]");
    const counter = dialog.querySelector("[data-counter]");
    const prev = dialog.querySelector("[data-prev]");
    const next = dialog.querySelector("[data-next]");
    const close = dialog.querySelector("[data-close]");
    const loop = root.dataset.loop !== "false";
    const captions = root.dataset.captions !== "false";
    let current = 0;
    let previousOverflow = "";
    let swipeStart = null;

    function preload(index) {
      const opener = openers[(index + openers.length) % openers.length];
      if (opener && opener.dataset.src) new Image().src = opener.dataset.src;
    }

    function show(index) {
      current = index;
      const opener = openers[index];
      picture.textContent = "";
      let node;
      if (opener.dataset.src) {
        node = document.createElement("img");
        node.src = opener.dataset.src;
        node.alt = opener.dataset.alt;
        node.className = "lb-large";
      } else {
        node = document.createElement("span");
        node.setAttribute("role", "img");
        node.setAttribute("aria-label", opener.dataset.alt);
        node.className = "lb-large lb-placeholder lb-placeholder--" + (index % 6);
      }
      picture.appendChild(node);
      caption.textContent = captions ? opener.dataset.caption : "";
      counter.textContent = index + 1 + " of " + openers.length;
      // Without looping, the ends say so instead of doing nothing silently.
      [
        [prev, !loop && index === 0],
        [next, !loop && index === openers.length - 1],
      ].forEach(function (pair) {
        if (!pair[0]) return;
        if (pair[1]) pair[0].setAttribute("aria-disabled", "true");
        else pair[0].removeAttribute("aria-disabled");
      });
      // The pictures either side are fetched ahead, so stepping through never waits.
      preload(index - 1);
      preload(index + 1);
    }

    function go(step) {
      const target = current + step;
      if (loop) show((target + openers.length) % openers.length);
      else if (target >= 0 && target < openers.length) show(target);
    }

    openers.forEach(function (opener, index) {
      opener.addEventListener("click", function () {
        show(index);
        dialog.showModal();
        previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
        close.focus();
      });
    });

    close.addEventListener("click", function () {
      dialog.close();
    });
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });

    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = previousOverflow;
      openers[current].focus();
    });

    // A click on the dark space around the picture closes it, like a click outside a dialog.
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.hasAttribute("data-backdrop")) dialog.close();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "Home") show(0);
      else if (event.key === "End") show(openers.length - 1);
      else if (event.key === "Tab") {
        // Keep Tab inside the viewer (APG dialog pattern).
        const buttons = Array.from(dialog.querySelectorAll("button"));
        const index = buttons.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          buttons[buttons.length - 1].focus();
        } else if (!event.shiftKey && index === buttons.length - 1) {
          event.preventDefault();
          buttons[0].focus();
        }
        return;
      } else return;
      event.preventDefault();
    });

    dialog.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") swipeStart = event.clientX;
    });
    dialog.addEventListener("pointerup", function (event) {
      if (swipeStart === null) return;
      const distance = event.clientX - swipeStart;
      swipeStart = null;
      if (Math.abs(distance) > SWIPE) go(distance < 0 ? 1 : -1);
    });
  }

  document.querySelectorAll("[data-lightbox]").forEach(createLightbox);
})();
