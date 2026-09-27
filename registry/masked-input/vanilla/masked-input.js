/**
 * Masked input — plain JavaScript, no dependencies.
 * The punctuation is filled in as you type. Nothing is refused outright: characters that cannot go
 * in a slot are skipped, so pasting a postcode with or without its space both work.
 *
 * ponytail: typing into the middle of a finished value puts the caret back at the end. Fine for a
 * field this short; reach for a caret-preserving mask if you apply it to something long.
 */
(function () {
  /** # is a digit, A a letter, * either; everything else in the mask is punctuation. */
  function fits(slot, character) {
    if (slot === "#") return /[0-9]/.test(character);
    if (slot === "A") return /[a-z]/i.test(character);
    return /[a-z0-9]/i.test(character);
  }

  function applyMask(mask, raw) {
    const characters = raw.replace(/\s+/g, " ").split("");
    let out = "";
    let at = 0;
    for (const slot of mask) {
      if (at >= characters.length) break;
      if (slot === "#" || slot === "A" || slot === "*") {
        while (at < characters.length && !fits(slot, characters[at])) at += 1;
        if (at >= characters.length) break;
        out += slot === "#" ? characters[at] : characters[at].toUpperCase();
        at += 1;
      } else {
        out += slot;
        if (characters[at] === slot) at += 1;
      }
    }
    return out;
  }

  function createMaskedInput(root) {
    const field = root.querySelector("[data-field]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const mask = root.dataset.mask;
    const label = root.dataset.label;

    function hideError() {
      if (!error) return;
      error.hidden = true;
      field.removeAttribute("aria-invalid");
    }

    field.addEventListener("input", function () {
      field.value = applyMask(mask, field.value);
      hideError();
      if (status) status.textContent = field.value.length === mask.length ? label + " complete: " + field.value : "";
    });

    field.addEventListener("blur", function () {
      const done = field.value === "" || field.value.length === mask.length;
      if (error) {
        error.hidden = done;
        if (done) field.removeAttribute("aria-invalid");
        else field.setAttribute("aria-invalid", "true");
      }
    });
  }

  document.querySelectorAll("[data-masked-input]").forEach(createMaskedInput);
})();
