/**
 * Carousel — plain JavaScript, no dependencies.
 * The track is a scrolling row, so the slides are usable before this runs. This adds the
 * previous/next buttons, the dots, the counter and optional automatic rotation.
 */
(function () {
  function createCarousel(root) {
    const track = root.querySelector("[data-track]");
    const slides = Array.from(root.querySelectorAll(".cr-slide"));
    if (!track || slides.length === 0) return;

    const previous = root.querySelector("[data-previous]");
    const next = root.querySelector("[data-next]");
    const dots = Array.from(root.querySelectorAll("[data-dot]"));
    const counter = root.querySelector("[data-counter]");
    const play = root.querySelector("[data-play]");
    // The last position is the last slide that can be first on screen, whether or not dots are on.
    const perView = Math.max(1, Number(root.dataset.perView) || 1);
    const lastIndex = Math.max(0, slides.length - perView);
    const loop = root.dataset.loop === "true";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let timer = null;

    function slideWidth() {
      return track.scrollWidth / slides.length;
    }

    function goTo(index) {
      // Repeat wraps at both ends; without it the ends simply hold.
      const wrapped = loop
        ? index < 0
          ? lastIndex
          : index > lastIndex
            ? 0
            : index
        : Math.min(lastIndex, Math.max(0, index));
      track.scrollTo({ left: slideWidth() * wrapped, behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    function paint(index) {
      current = index;
      if (previous) previous.disabled = !loop && index === 0;
      if (next) next.disabled = !loop && index >= lastIndex;
      dots.forEach(function (dot, i) {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (counter) counter.textContent = "Slide " + (index + 1) + " of " + (lastIndex + 1);
    }

    // The scroll position is the source of truth: swiping keeps the dots and buttons honest.
    let frame = 0;
    track.addEventListener(
      "scroll",
      function () {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          paint(Math.min(lastIndex, Math.round(track.scrollLeft / slideWidth())));
        });
      },
      { passive: true },
    );

    if (previous) previous.addEventListener("click", function () { goTo(current - 1); });
    if (next) next.addEventListener("click", function () { goTo(current + 1); });
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () { goTo(index); });
    });

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function start() {
      if (timer || reduceMotion.matches) return;
      const seconds = Math.max(2, Number(root.dataset.interval) || 6);
      timer = setInterval(function () {
        goTo(current >= lastIndex ? 0 : current + 1);
      }, seconds * 1000);
    }

    if (play) {
      play.addEventListener("click", function () {
        const playing = play.getAttribute("aria-pressed") === "true";
        play.setAttribute("aria-pressed", String(!playing));
        play.querySelector("[data-play-label]").textContent = playing
          ? "Start automatic slide changes"
          : "Stop automatic slide changes";
        if (playing) stop();
        else start();
      });

      // Rotation holds while the pointer or the keyboard is inside the carousel.
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", function () {
        if (play.getAttribute("aria-pressed") === "true") start();
      });
      root.addEventListener("focusin", stop);
      root.addEventListener("focusout", function (event) {
        if (!root.contains(event.relatedTarget) && play.getAttribute("aria-pressed") === "true") start();
      });
      if (root.dataset.auto === "true") start();
    }

    paint(0);
  }

  document.querySelectorAll("[data-carousel]").forEach(createCarousel);
})();
