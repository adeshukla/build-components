/**
 * Offline banner — plain JavaScript, no dependencies.
 * Follows the browser's online and offline events, says so politely, and offers a retry because
 * navigator.onLine only knows about the network, not about your server.
 */
(function () {
  function createOfflineBanner(root) {
    const offlineBox = root.querySelector("[data-offline]");
    const onlineBox = root.querySelector("[data-online]");
    const retry = root.querySelector("[data-retry]");
    const toggle = root.querySelector("[data-toggle]");
    const note = root.querySelector("[data-note]");
    let pretend = false;
    // Nothing is said before the first drop: a page that loads online has no news to report.
    let dropped = false;

    function isOffline() {
      return pretend || !navigator.onLine;
    }

    function render() {
      const offline = isOffline();
      if (offline) dropped = true;
      offlineBox.hidden = !offline;
      onlineBox.hidden = offline || !dropped;
      if (toggle) toggle.textContent = offline ? "Pretend the connection is back" : "Pretend to go offline";
    }

    window.addEventListener("online", render);
    window.addEventListener("offline", render);

    if (retry) {
      retry.addEventListener("click", function () {
        if (note) note.textContent = isOffline() ? "Still nothing. The connection is not back yet." : "";
        render();
      });
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        pretend = !pretend;
        if (note) note.textContent = "";
        render();
      });
    }

    render();
  }

  document.querySelectorAll("[data-offline-banner]").forEach(createOfflineBanner);
})();
