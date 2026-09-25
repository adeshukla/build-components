/**
 * Pricing table — plain JavaScript, no dependencies.
 * Switching the billing cycle changes every price at once, so the change is said in a status line
 * rather than left to be noticed.
 */
(function () {
  function createPricingTable(root) {
    const radios = Array.from(root.querySelectorAll("[data-cycle]"));
    const amounts = Array.from(root.querySelectorAll("[data-amount]"));
    const periods = Array.from(root.querySelectorAll("[data-period]"));
    const note = root.querySelector("[data-note]");
    const status = root.querySelector("[data-status]");
    const currency = root.dataset.currency;

    function render() {
      const picked = radios.find(function (radio) {
        return radio.checked;
      });
      const yearly = picked ? picked.value === "yearly" : false;
      amounts.forEach(function (amount) {
        amount.textContent = currency + (yearly ? amount.dataset.yearly : amount.dataset.monthly);
      });
      periods.forEach(function (period) {
        period.textContent = yearly ? "a year" : "a month";
      });
      if (note) note.hidden = !yearly;
      if (status) {
        const label = yearly ? root.dataset.yearlyLabel : root.dataset.monthlyLabel;
        status.textContent = "Showing " + label.toLowerCase() + " prices";
      }
    }

    radios.forEach(function (radio) {
      radio.addEventListener("change", render);
    });

    render();
  }

  document.querySelectorAll("[data-pricing-table]").forEach(createPricingTable);
})();
