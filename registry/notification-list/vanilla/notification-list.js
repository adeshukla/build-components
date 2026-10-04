/**
 * Notification list — plain JavaScript, no dependencies.
 * Marking one as read takes its button away, so the heading's count, the status line and the list stay
 * in step with each other.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  // @config-start
  const config = {
    heading: "Notifications",
    allReadText: "Nothing unread.",
    showCount: true,
    countText: "{count} unread",
  };
  // @config-end

  function createNotificationList(root) {
    const heading = root.querySelector("[data-heading]");
    const markAll = root.querySelector("[data-mark-all]");
    const status = root.querySelector("[data-status]");
    const items = Array.from(root.querySelectorAll("[data-item]"));

    function refresh() {
      const unread = items.filter(function (item) {
        return item.dataset.unread === "true";
      }).length;
      // The count is part of the heading's text, so it never reads "Notifications(3)".
      if (heading) {
        heading.textContent = config.heading + (config.showCount && unread > 0 ? " (" + fill(config.countText, { count: unread }) + ")" : "");
      }
      if (markAll) markAll.hidden = unread === 0;
      if (status) status.textContent = unread === 0 ? config.allReadText : fill(config.countText, { count: unread });
    }

    function read(item) {
      item.dataset.unread = "false";
      const flag = item.querySelector("[data-flag]");
      const button = item.querySelector("[data-mark-one]");
      if (flag) flag.hidden = true;
      if (button) button.hidden = true;
      refresh();
    }

    items.forEach(function (item) {
      const button = item.querySelector("[data-mark-one]");
      if (button) {
        button.addEventListener("click", function () {
          read(item);
        });
      }
    });

    if (markAll) {
      markAll.addEventListener("click", function () {
        items.forEach(read);
      });
    }

    refresh();
  }

  document.querySelectorAll("[data-notification-list]").forEach(createNotificationList);
})();
