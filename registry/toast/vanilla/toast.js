/**
 * Notifications — plain JavaScript, no dependencies.
 * The live region ships in the HTML so the first message is announced properly. Messages clear
 * themselves after the set time, unless the pointer or the keyboard is inside the stack.
 */
(function () {
  const icons = {
    good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/></svg>',
  };

  function createToaster(root) {
    const live = root.querySelector("[data-live]");
    const stack = root.querySelector("[data-stack]");
    if (!live || !stack) return;

    const duration = Number(root.dataset.duration);
    const max = Math.max(1, Number(root.dataset.max) || 3);
    const withClose = root.dataset.close !== "false";
    const withIcon = root.dataset.icon !== "false";
    let held = false;
    let timer = null;

    function tick() {
      clearTimeout(timer);
      if (duration === 0 || held) return;
      const first = live.firstElementChild;
      if (!first) return;
      timer = setTimeout(function () {
        first.remove();
        tick();
      }, duration * 1000);
    }

    function show(kind) {
      const item = document.createElement("div");
      item.className = "to-item";

      if (withIcon) {
        const icon = document.createElement("span");
        icon.className = "to-icon to-icon--" + kind;
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = icons[kind];
        item.appendChild(icon);
      }

      const body = document.createElement("div");
      body.className = "to-body";
      const text = document.createElement("p");
      text.className = "to-text";
      text.textContent = kind === "good" ? root.dataset.message : root.dataset.error;
      body.appendChild(text);

      if (kind === "good" && root.dataset.action) {
        const action = document.createElement("button");
        action.className = "to-action";
        action.type = "button";
        action.textContent = root.dataset.action;
        action.addEventListener("click", function () {
          item.remove();
          tick();
        });
        body.appendChild(action);
      }
      item.appendChild(body);

      if (withClose) {
        const close = document.createElement("button");
        close.className = "to-close";
        close.type = "button";
        close.innerHTML =
          '<span class="to-sr">Close this message</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        close.addEventListener("click", function () {
          item.remove();
          tick();
        });
        item.appendChild(close);
      }

      live.appendChild(item);
      while (live.children.length > max) live.firstElementChild.remove();
      tick();
    }

    root.querySelectorAll("[data-show]").forEach(function (button) {
      button.addEventListener("click", function () {
        show(button.dataset.show);
      });
    });

    // Nobody should lose a message they are still reading. A tap leaves the pointer where it
    // landed, so hover-pause is only for devices that really hover.
    if (window.matchMedia("(hover: hover)").matches) {
      stack.addEventListener("mouseenter", function () {
        held = true;
        clearTimeout(timer);
      });
      stack.addEventListener("mouseleave", function () {
        held = false;
        tick();
      });
    }
    stack.addEventListener("focusin", function () {
      held = true;
      clearTimeout(timer);
    });
    stack.addEventListener("focusout", function (event) {
      if (stack.contains(event.relatedTarget)) return;
      held = false;
      tick();
    });
  }

  document.querySelectorAll("[data-toast]").forEach(createToaster);
})();
