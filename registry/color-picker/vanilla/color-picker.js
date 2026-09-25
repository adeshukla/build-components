/**
 * Colour picker — plain JavaScript, no dependencies.
 * Named swatches are radios; "any other colour" is the browser's own colour input. The chosen
 * colour is announced by name where it has one. The root fires "colour-change".
 */
(function () {
  function createColorPicker(root) {
    const swatches = Array.from(root.querySelectorAll(".cp-input"));
    const custom = root.querySelector("[data-custom]");
    const hex = root.querySelector("[data-hex]");
    const name = root.querySelector("[data-name]");
    const status = root.querySelector("[data-status]");
    const hidden = root.querySelector("[data-value]");

    function set(value, label) {
      const colour = value.toLowerCase();
      if (hex) hex.textContent = colour;
      if (name) name.textContent = label ? " · " + label : "";
      if (hidden) hidden.value = colour;
      if (custom) custom.value = colour;
      swatches.forEach(function (swatch) {
        swatch.checked = swatch.value.toLowerCase() === colour;
      });
      status.textContent = label ? label + " chosen, " + colour + "." : "Colour " + colour + " chosen.";
      root.dispatchEvent(new CustomEvent("colour-change", { detail: { value: colour, name: label || "" } }));
    }

    swatches.forEach(function (swatch) {
      swatch.addEventListener("change", function () {
        set(swatch.value, swatch.dataset.name);
      });
    });
    if (custom) {
      custom.addEventListener("input", function () {
        const match = swatches.find(function (swatch) {
          return swatch.value.toLowerCase() === custom.value.toLowerCase();
        });
        set(custom.value, match ? match.dataset.name : "");
      });
    }
  }

  document.querySelectorAll("[data-color-picker]").forEach(createColorPicker);
})();
