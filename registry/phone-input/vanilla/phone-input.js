/**
 * Phone input — plain JavaScript, no dependencies.
 * Groups digits the way the chosen country writes them and submits one value: dial code plus
 * digits. Deliberately not a full phone-number library — check the number on your server.
 */
(function () {
  function group(digits, pattern) {
    const sizes = String(pattern)
      .split(/\s+/)
      .map(Number)
      .filter(function (size) {
        return size > 0;
      });
    const parts = [];
    let rest = digits;
    sizes.forEach(function (size) {
      if (rest === "") return;
      parts.push(rest.slice(0, size));
      rest = rest.slice(size);
    });
    if (rest !== "") parts.push(rest);
    return parts.join(" ");
  }

  function createPhoneInput(root) {
    const country = root.querySelector("[data-country]");
    const number = root.querySelector("[data-number]");
    const error = root.querySelector("[data-error]");
    const hidden = root.querySelector("[data-value]");

    const chosen = () => country.options[country.selectedIndex];
    const digitsOf = () => number.value.replace(/\D/g, "").slice(0, 15);

    function paint() {
      const digits = digitsOf();
      number.value = group(digits, chosen().dataset.groups || "");
      if (hidden) hidden.value = digits === "" ? "" : chosen().dataset.dial + digits;
    }

    number.addEventListener("input", function () {
      paint();
      if (error.textContent) {
        error.textContent = "";
        number.removeAttribute("aria-invalid");
      }
    });
    country.addEventListener("change", paint);
    number.addEventListener("blur", function () {
      const digits = digitsOf();
      if (digits === "") {
        error.textContent = "";
        number.removeAttribute("aria-invalid");
        return;
      }
      if (digits.length < 6) {
        error.textContent = "That number looks too short. Check it and try again.";
        number.setAttribute("aria-invalid", "true");
      } else {
        error.textContent = "";
        number.removeAttribute("aria-invalid");
      }
    });

    paint();
  }

  document.querySelectorAll("[data-phone-input]").forEach(createPhoneInput);
})();
