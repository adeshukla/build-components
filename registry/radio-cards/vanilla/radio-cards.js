/**
 * Radio cards — plain JavaScript, no dependencies.
 * The radios do the work; the only script here says which card was picked, because a border colour
 * tells a screen reader nothing.
 */
(function () {
  function createRadioCards(root) {
    const radios = Array.from(root.querySelectorAll("[data-option]"));
    const status = root.querySelector("[data-status]");
    const ticks = Array.from(root.querySelectorAll("[data-tick]"));

    function refresh() {
      const picked = radios.find(function (radio) {
        return radio.checked;
      });
      ticks.forEach(function (tick) {
        tick.hidden = !picked || tick.dataset.tick !== picked.value;
      });
      if (status) status.textContent = picked ? picked.value + " picked" : "Nothing picked yet";
    }

    radios.forEach(function (radio) {
      radio.addEventListener("change", refresh);
    });

    refresh();
  }

  document.querySelectorAll("[data-radio-cards]").forEach(createRadioCards);
})();
