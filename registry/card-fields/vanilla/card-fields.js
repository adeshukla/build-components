/**
 * Card payment fields — plain JavaScript, no dependencies.
 * Formats as you type, keeps the caret in place, names the card type in words and checks each field
 * when you leave it. Demo only: real card numbers belong in your payment provider's hosted fields.
 */
(function () {
  /** The card type from its first digits. Named in words: no logos, no trademarks to license. */
  function brandOf(digits) {
    if (/^3[47]/.test(digits)) return "American Express";
    if (/^4/.test(digits)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
    return "";
  }

  /** Amex groups 4-6-5 and has 15 digits; the rest group in fours, up to 19. */
  function formatNumber(digits) {
    if (brandOf(digits) === "American Express") {
      return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
    }
    return (digits.slice(0, 19).match(/.{1,4}/g) || []).join(" ");
  }

  /** The Luhn checksum every card number carries, so most typos are caught before submitting. */
  function luhn(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let digit = Number(digits[digits.length - 1 - i]);
      if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
      sum += digit;
    }
    return digits.length > 0 && sum % 10 === 0;
  }

  function formatExpiry(digits) {
    const clean = digits.slice(0, 4);
    return clean.length > 2 ? clean.slice(0, 2) + "/" + clean.slice(2) : clean;
  }

  function createCardFields(form) {
    const input = (key) => form.querySelector("#card-" + key);
    const brandText = form.querySelector("[data-brand]");
    const cvcHint = form.querySelector("#card-cvc-hint");
    const done = form.querySelector("[data-done]");
    const keys = Array.from(form.querySelectorAll("[data-field]")).map((field) => field.dataset.field);

    function digitsOf(key) {
      return input(key).value.replace(/\D/g, "");
    }

    function cvcLength() {
      return brandOf(digitsOf("number")) === "American Express" ? 4 : 3;
    }

    /** Checked on leaving a field and on submit, never on every key press. */
    function problem(key) {
      const value = input(key).value;
      const digits = value.replace(/\D/g, "");
      if (key === "name") return value.trim() ? "" : "Enter the name on the card.";
      if (key === "postcode") return value.trim() ? "" : "Enter the postcode.";
      if (key === "number") {
        if (!digits) return "Enter the card number.";
        const lengths = brandOf(digits) === "American Express" ? [15] : [13, 16, 19];
        return lengths.indexOf(digits.length) !== -1 && luhn(digits) ? "" : "Enter a valid card number. Check for a typo.";
      }
      if (key === "expiry") {
        if (!digits) return "Enter the expiry date.";
        const month = Number(digits.slice(0, 2));
        if (digits.length !== 4 || month < 1 || month > 12) return "Enter the expiry date as MM/YY, for example 04/29.";
        // A card works until the end of its expiry month.
        return new Date(2000 + Number(digits.slice(2)), month, 1) <= new Date() ? "This card has expired." : "";
      }
      if (key === "cvc") return digits.length === cvcLength() ? "" : "Enter the " + cvcLength() + "-digit security code.";
      return "";
    }

    function describe(key, error) {
      const field = input(key);
      const ids = [];
      if (form.querySelector("#card-" + key + "-hint")) ids.push("card-" + key + "-hint");
      if (key === "number" && brandText.textContent) ids.push("card-brand");
      if (error) ids.push("card-" + key + "-error");
      if (ids.length) field.setAttribute("aria-describedby", ids.join(" "));
      else field.removeAttribute("aria-describedby");
    }

    function check(key) {
      const message = problem(key);
      const field = input(key);
      const error = form.querySelector("#card-" + key + "-error");
      error.hidden = !message;
      error.textContent = "";
      if (message) {
        const prefix = document.createElement("span");
        prefix.className = "cf-sr";
        prefix.textContent = "Error: ";
        error.append(prefix, message);
      }
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      describe(key, message);
      return message;
    }

    /** Reformatting moves the caret to the end; this puts it back after the same number of digits. */
    function reformat(key, format) {
      const field = input(key);
      const digitsBefore = field.value.slice(0, field.selectionStart == null ? field.value.length : field.selectionStart).replace(/\D/g, "").length;
      field.value = format(field.value.replace(/\D/g, ""));
      let position = 0;
      for (let seen = 0; position < field.value.length && seen < digitsBefore; position++) {
        if (/\d/.test(field.value[position])) seen++;
      }
      if (document.activeElement === field) field.setSelectionRange(position, position);
    }

    input("number").addEventListener("input", function () {
      reformat("number", formatNumber);
      const brand = brandOf(digitsOf("number"));
      brandText.textContent = brand;
      cvcHint.textContent = brand === "American Express" ? "4 digits on the front" : "3 digits on the back";
      describe("number", !form.querySelector("#card-number-error").hidden);
      done.textContent = "";
    });
    input("expiry").addEventListener("input", function () {
      reformat("expiry", formatExpiry);
      done.textContent = "";
    });
    input("cvc").addEventListener("input", function () {
      reformat("cvc", function (digits) {
        return digits.slice(0, cvcLength());
      });
      done.textContent = "";
    });

    keys.forEach(function (key) {
      // A field already showing an error is checked again as you type, so the message goes away
      // while you fix it. Waiting for blur would make the form jump just as you reach for Pay.
      input(key).addEventListener("input", function () {
        if (!form.querySelector("#card-" + key + "-error").hidden) check(key);
        done.textContent = "";
      });
      input(key).addEventListener("blur", function () {
        const shown = !form.querySelector("#card-" + key + "-error").hidden;
        if (input(key).value !== "" || shown) check(key);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const found = keys.filter((key) => check(key) !== "");
      if (found.length) {
        input(found[0]).focus();
        done.textContent = "";
        return;
      }
      // Demo only: a real form hands the details to the payment provider here.
      done.textContent = "Card details look right. This demo sends nothing.";
    });
  }

  document.querySelectorAll("[data-card-fields]").forEach(createCardFields);
})();
