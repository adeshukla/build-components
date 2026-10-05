/**
 * Newsletter signup — plain JavaScript, no dependencies.
 * The address is checked here rather than left to the browser's bubble, which vanishes and cannot be
 * read back by a screen reader.
 */
(function () {
  /**
   * Sends the sign-up where the form's action says, as a form would (a POST of its fields), and says
   * whether it arrived. With no action nothing is sent and it counts as done: a preview, or a page still
   * being built.
   */
  function send(form) {
    const action = form.getAttribute("action");
    if (!action) return Promise.resolve(true);
    return fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (response) {
        return response.ok;
      })
      .catch(function () {
        return false;
      });
  }

  function createNewsletter(root) {
    const form = root.querySelector("[data-form]");
    const email = root.querySelector("[data-email]");
    const consent = root.querySelector("[data-consent]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const button = form.querySelector("[type=submit]");
    const words = JSON.parse(root.dataset.words);
    let sending = false;
    const base = email.getAttribute("aria-describedby") || "";

    function clearError() {
      error.hidden = true;
      error.textContent = "";
      email.removeAttribute("aria-invalid");
      if (base) email.setAttribute("aria-describedby", base);
      else email.removeAttribute("aria-describedby");
    }

    function showError(message, onField, focusOn) {
      error.textContent = message;
      error.hidden = false;
      // The message joins the field's description only when it belongs to the field.
      if (onField) {
        email.setAttribute("aria-invalid", "true");
        email.setAttribute("aria-describedby", (base ? base + " " : "") + "nl-error");
      }
      focusOn.focus();
    }

    email.addEventListener("input", clearError);
    if (consent) consent.addEventListener("change", clearError);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const address = email.value.trim();
      if (address === "" || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(address)) {
        showError(words.email, true, email);
        return;
      }
      if (consent && !consent.checked) {
        showError(words.consent, false, consent);
        return;
      }
      clearError();
      if (sending) return;
      sending = true;
      const label = button.textContent;
      button.textContent = words.sending;
      button.setAttribute("aria-disabled", "true");
      send(form).then(function (sent) {
        sending = false;
        button.textContent = label;
        button.removeAttribute("aria-disabled");
        if (!sent) {
          showError(words.failed, false, button);
          return;
        }
        if (status) status.textContent = root.dataset.success;
        email.value = "";
        if (consent) consent.checked = false;
      });
    });
  }

  document.querySelectorAll("[data-newsletter]").forEach(createNewsletter);
})();
