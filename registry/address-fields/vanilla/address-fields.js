/**
 * Address fields — plain JavaScript, no dependencies.
 * The country decides what the postcode field is called and whether there is a region field at all.
 */
(function () {
  // @config-start
  const config = {
    countries: [
      { code: "GB", name: "United Kingdom", postcodeLabel: "Postcode", regionLabel: "County" },
      { code: "IE", name: "Ireland", postcodeLabel: "Eircode", regionLabel: "County" },
      { code: "US", name: "United States", postcodeLabel: "ZIP code", regionLabel: "State" },
      { code: "DE", name: "Germany", postcodeLabel: "Postal code", regionLabel: "" },
    ],
  };
  // @config-end

  function createAddressFields(root) {
    const country = root.querySelector("[data-country]");
    const regionRow = root.querySelector("[data-region-row]");
    const regionLabel = root.querySelector("[data-region-label]");
    const postcodeLabel = root.querySelector("[data-postcode-label]");
    const status = root.querySelector("[data-status]");

    function refresh() {
      const chosen =
        config.countries.filter(function (item) {
          return item.code === country.value;
        })[0] || config.countries[0];
      if (!chosen) return;

      if (postcodeLabel) postcodeLabel.textContent = chosen.postcodeLabel;
      // A region field is not universal: it is removed for the countries that have none.
      if (regionRow) regionRow.hidden = chosen.regionLabel.trim() === "";
      if (regionLabel) regionLabel.textContent = chosen.regionLabel;
      if (status) {
        status.textContent = "Addressed for " + chosen.name + ". The postcode field is called " + chosen.postcodeLabel + ".";
      }
    }

    country.addEventListener("change", refresh);
    refresh();
  }

  document.querySelectorAll("[data-address-fields]").forEach(createAddressFields);
})();
