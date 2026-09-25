/**
 * Reading progress — plain JavaScript, no dependencies.
 * Fills a progress bar as the page scrolls and marks which heading you are in. Both are read from
 * the page itself, so it works over whatever content it is put with.
 */
(function () {
  function createReadingProgress(root) {
    const bar = root.querySelector("[data-bar]");
    const links = Array.from(root.querySelectorAll(".rp-link"));

    function onScroll() {
      if (bar) {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const percent = height <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((window.scrollY / height) * 100)));
        bar.style.width = percent + "%";
        bar.setAttribute("aria-valuenow", String(percent));
        bar.setAttribute("aria-valuetext", percent + "% read");
      }
      if (!links.length) return;
      const headings = links
        .map(function (link) {
          return document.getElementById(link.getAttribute("href").slice(1));
        })
        .filter(Boolean);
      const passed = headings.filter(function (heading) {
        return heading.getBoundingClientRect().top <= 120;
      });
      // At the bottom of the page the last heading may still sit below the line, so nothing would
      // ever mark the final section. Once there is no more to scroll, that is the one you are in.
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const active = (atBottom ? headings[headings.length - 1] : passed[passed.length - 1]) || headings[0];
      links.forEach(function (link) {
        const here = active && link.getAttribute("href") === "#" + active.id;
        const marker = link.querySelector(".rp-sr");
        if (here) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
        if (marker) marker.hidden = !here;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  document.querySelectorAll("[data-reading-progress]").forEach(createReadingProgress);
})();
