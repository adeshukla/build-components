/**
 * Tree view — plain JavaScript, no dependencies.
 * Follows the WAI-ARIA APG "Tree View" pattern: one Tab stop, arrow keys inside, type-ahead.
 * Selecting an item fires a "tree-select" event on the root: event.detail.path is its full path.
 */
(function () {
  /** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
  function keyOf(event) {
    const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
    const swapped = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
    return rtl ? (swapped[event.key] ?? event.key) : event.key;
  }

  function createTreeView(root) {
    const items = Array.from(root.querySelectorAll('[role="treeitem"]'));
    const selection = root.querySelector("[data-selection]");

    const group = (item) => item.querySelector(':scope > [role="group"]');
    const parentOf = (item) => item.parentElement.closest('[role="treeitem"]');
    const isOpen = (item) => item.getAttribute("aria-expanded") === "true";
    const name = (item) => item.querySelector(".tv-name").textContent;
    // Only items whose every folder is open can be reached with the arrow keys.
    const visible = () => items.filter((item) => !item.parentElement.closest("[hidden]"));

    function focus(item) {
      items.forEach((other) => other.setAttribute("tabindex", other === item ? "0" : "-1"));
      item.focus();
    }

    function setOpen(item, open) {
      if (!group(item)) return;
      item.setAttribute("aria-expanded", String(open));
      group(item).hidden = !open;
    }

    function select(item) {
      items.forEach((other) => other.setAttribute("aria-selected", String(other === item)));
      if (selection) selection.textContent = "Selected: " + item.dataset.path;
      root.dispatchEvent(new CustomEvent("tree-select", { detail: { path: item.dataset.path } }));
    }

    root.addEventListener("keydown", function (event) {
      const item = event.target.closest('[role="treeitem"]');
      if (!item || event.target !== item) return;
      const shown = visible();
      const index = shown.indexOf(item);
      const isParent = !!group(item);
      let handled = true;

      if (keyOf(event) === "ArrowDown") {
        if (shown[index + 1]) focus(shown[index + 1]);
      } else if (keyOf(event) === "ArrowUp") {
        if (index > 0) focus(shown[index - 1]);
      } else if (keyOf(event) === "ArrowRight") {
        if (isParent && !isOpen(item)) setOpen(item, true);
        else if (isParent) focus(group(item).querySelector('[role="treeitem"]'));
      } else if (keyOf(event) === "ArrowLeft") {
        if (isParent && isOpen(item)) setOpen(item, false);
        else if (parentOf(item)) focus(parentOf(item));
      } else if (keyOf(event) === "Home") {
        focus(shown[0]);
      } else if (keyOf(event) === "End") {
        focus(shown[shown.length - 1]);
      } else if (keyOf(event) === "Enter" || keyOf(event) === " ") {
        select(item);
      } else if (keyOf(event) === "*") {
        // Opens every folder at this level, as in the APG tree pattern.
        Array.from(item.parentElement.children).forEach((sibling) => setOpen(sibling, true));
      } else if (keyOf(event).length === 1 && /\S/.test(keyOf(event)) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Type-ahead: the next visible item starting with that character.
        const char = keyOf(event).toLowerCase();
        const ordered = shown.slice(index + 1).concat(shown.slice(0, index + 1));
        const match = ordered.find((candidate) => name(candidate).toLowerCase().indexOf(char) === 0);
        if (match) focus(match);
      } else {
        handled = false;
      }
      if (handled) event.preventDefault();
    });

    root.addEventListener("click", function (event) {
      const row = event.target.closest(".tv-row");
      if (!row) return;
      const item = row.parentElement;
      focus(item);
      select(item);
      if (group(item)) setOpen(item, !isOpen(item));
    });

    // Keep the one Tab stop on the item last focused, however it got focus.
    root.addEventListener("focusin", function (event) {
      if (event.target.matches('[role="treeitem"]')) {
        items.forEach((other) => other.setAttribute("tabindex", other === event.target ? "0" : "-1"));
      }
    });
  }

  document.querySelectorAll("[data-tree-view]").forEach(createTreeView);
})();
