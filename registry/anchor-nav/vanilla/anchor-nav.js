/**
 * Anchor navigation — plain JavaScript, no dependencies.
 * The links work without this. It marks whichever section is being read, and moves focus as well as
 * the scroll position when one is followed.
 */
(function () {
  // @config-start
  const config = {
    markCurrent: true,
    smoothScroll: true,
  };
  // @config-end

  function createAnchorNav(root) {
    const links = Array.from(root.querySelectorAll("[data-anchor]"));
    if (links.length === 0) return;

    function mark(href) {
      links.forEach(function (link) {
        // aria-current=true, not "page": the page has not changed, only the part of it being read.
        if (link.getAttribute("href") === href) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const node = document.getElementById(link.getAttribute("href").slice(1));
        if (node === null) return;
        event.preventDefault();
        // Following a link marks that section at once. On a page too short to scroll, no scroll event
        // will ever arrive to do it.
        if (config.markCurrent) mark(link.getAttribute("href"));
        // Focus as well as scroll: otherwise the next Tab starts from the nav, not the section.
        node.focus();
        node.scrollIntoView({ block: "start", behavior: config.smoothScroll ? "smooth" : "auto" });
      });
    });

    if (!config.markCurrent) return;

    const headings = links
      .map(function (link) {
        return document.getElementById(link.getAttribute("href").slice(1));
      })
      .filter(function (node) {
        return node !== null;
      });
    if (headings.length === 0) return;

    function update() {
      // The last heading to have passed the line is the one being read. The line sits near the top,
      // about where a sticky header would end: any lower and the second heading is already above it
      // before the page has been scrolled at all.
      const line = Math.min(window.innerHeight * 0.2, 120);
      let at = headings[0];
      headings.forEach(function (node) {
        if (node.getBoundingClientRect().top <= line) at = node;
      });
      // At the very bottom the last heading can still sit below the line, so nothing would ever mark
      // it. Once there is no more to scroll, the last section is the one being read.
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 4;
      const bottom = scrollable && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      mark("#" + (bottom ? headings[headings.length - 1] : at).id);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  document.querySelectorAll("[data-anchor-nav]").forEach(createAnchorNav);
})();
