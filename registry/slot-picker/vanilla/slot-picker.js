/**
 * Booking slot picker — plain JavaScript, no dependencies.
 * One radio group for the whole picker, and every announcement carries the day as well as the time,
 * because "10:30" on its own says nothing.
 */
(function () {
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
      if (status) status.textContent = value === "" ? "No time picked yet" : value + " selected";
    }

    slots.forEach(function (slot) {
      slot.addEventListener("change", refresh);
    });

    confirm.addEventListener("click", function () {
      if (confirm.disabled || !status) return;
      status.textContent = "Booked for " + pickedValue();
    });

    refresh();
  }

  document.querySelectorAll("[data-slot-picker]").forEach(createSlotPicker);
})();
