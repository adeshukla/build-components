/**
 * Booking slot picker — plain JavaScript, no dependencies.
 * One radio group for the whole picker, and every announcement carries the day as well as the time,
 * because "10:30" on its own says nothing.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createSlotPicker(root) {
    const slots = Array.from(root.querySelectorAll("[data-slot]"));
    const confirm = root.querySelector("[data-confirm]");
    const status = root.querySelector("[data-status]");

    function pickedValue() {
      const found = slots.find(function (slot) {
        return slot.checked;
      });
      return found ? found.value : "";
    }

    function refresh() {
      const value = pickedValue();
      confirm.disabled = value === "";
      if (status) status.textContent = value === "" ? root.dataset.none : fill(root.dataset.selected, { slot: value });
    }

    slots.forEach(function (slot) {
      slot.addEventListener("change", refresh);
    });

    confirm.addEventListener("click", function () {
      if (confirm.disabled || !status) return;
      status.textContent = fill(root.dataset.booked, { slot: pickedValue() });
    });

    refresh();
  }

  document.querySelectorAll("[data-slot-picker]").forEach(createSlotPicker);
})();
