/**
 * Switch — plain JavaScript, no dependencies.
 * The checkbox does the work; this only keeps the On/Off word in step and reports changes.
 * The root fires "switch-change" with event.detail.on.
 */
(function () {
  function createSwitch(root) {
    const input = root.querySelector(".sw-input");
    const state = root.querySelector("[data-state]");
    input.addEventListener("change", function () {
      if (state) state.textContent = input.checked ? "On" : "Off";
      root.dispatchEvent(new CustomEvent("switch-change", { detail: { on: input.checked } }));
    });
  }

  document.querySelectorAll("[data-switch]").forEach(createSwitch);
})();
