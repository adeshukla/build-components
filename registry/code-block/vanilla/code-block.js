/**
 * Code block — plain JavaScript, no dependencies.
 * Copying can be refused (a sandboxed frame, or no permission), so the fallback selects the code and
 * says which keys to press rather than claiming it copied.
 */
(function () {
  function createCodeBlock(root) {
    const copy = root.querySelector("[data-copy]");
    const wrap = root.querySelector("[data-wrap]");
    const pre = root.querySelector("[data-pre]");
    const code = root.querySelector("[data-code]");
    const status = root.querySelector("[data-status]");
    let timer = null;

    /** The text without the line numbers, which are decoration. */
    function text() {
      return Array.from(code.querySelectorAll(".cb-line"))
        .map(function (line) {
          const number = line.querySelector(".cb-number");
          return line.textContent.slice(number ? number.textContent.length : 0).replace(/ /g, "");
        })
        .join("\n");
    }

    function say(message) {
      if (status) status.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        if (status) status.textContent = "";
      }, 4000);
    }

    if (copy) {
      copy.addEventListener("click", function () {
        const value = text();
        const clipboard = navigator.clipboard;
        if (clipboard && clipboard.writeText) {
          clipboard.writeText(value).then(
            function () {
              say(copy.dataset.copied);
            },
            function () {
              select();
            },
          );
        } else {
          select();
        }
      });
    }

    function select() {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      say("Selected. Press Ctrl+C (Cmd+C on a Mac) to copy.");
    }

    if (wrap) {
      wrap.addEventListener("click", function () {
        const on = wrap.getAttribute("aria-pressed") === "true";
        wrap.setAttribute("aria-pressed", String(!on));
        pre.classList.toggle("cb-pre--wrap", !on);
      });
    }
  }

  document.querySelectorAll("[data-code-block]").forEach(createCodeBlock);
})();
