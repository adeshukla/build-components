/**
 * Form with validation — plain JavaScript, no dependencies.
 * The markup ships as real HTML; this adds the checks and the messages.
 * Every message names the problem and what to do about it.
 */
(function () {
  // @config-start
  const defaultConfig = {
    title: "Send us a message",
    submitText: "Send message",
    successMessage: "Thanks. Your message has been sent.",
    nameLabel: "Full name",
    emailLabel: "Email address",
    phoneField: true,
    phoneLabel: "Phone number",
    phoneRequired: false,
    messageField: true,
    messageLabel: "Message",
    messageMinLength: 20,
    consentField: true,
    consentLabel: "I agree to be contacted about this enquiry",
    validateOn: "blur",
    errorSummary: true,
    optionalMarker: true,
    layout: "two",
    theme: "light",
    accentColor: "#2563eb",
    radius: 8,
  };
  // @config-end

  function validateField(name, values, config) {
    if (name === "name") {
      return values.name.trim() === "" ? `Enter your ${config.nameLabel.toLowerCase()}.` : "";
    }
    if (name === "email") {
      const email = values.email.trim();
      if (email === "") return `Enter your ${config.emailLabel.toLowerCase()}.`;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
        ? ""
        : "Enter an email address in the correct format, like name@example.com.";
    }
    if (name === "phone") {
      if (!config.phoneField) return "";
      const phone = values.phone.trim();
      if (phone === "") return config.phoneRequired ? `Enter your ${config.phoneLabel.toLowerCase()}.` : "";
      const digits = phone.replace(/[^0-9]/g, "");
      return /^\+?[0-9\s()-]+$/.test(phone) && digits.length >= 7
        ? ""
        : "Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.";
    }
    if (name === "message") {
      if (!config.messageField || config.messageMinLength === 0) return "";
      const message = values.message.trim();
      if (message === "") return `Enter your ${config.messageLabel.toLowerCase()}.`;
      return message.length < config.messageMinLength
        ? `Your ${config.messageLabel.toLowerCase()} must be at least ${config.messageMinLength} characters. You have written ${message.length}.`
        : "";
    }
    if (name === "consent") {
      return config.consentField && !values.consent ? "Select the checkbox to agree before sending." : "";
    }
    return "";
  }

  function createForm(root, config) {
    const form = root.querySelector(".fm-form");
    const summary = root.querySelector(".fm-summary");
    const summaryList = root.querySelector(".fm-summary-list");
    const success = root.querySelector(".fm-success");
    const controls = [...root.querySelectorAll("[name]")];
    const useSummary = root.dataset.summary === "true";

    function readValues() {
      const values = { name: "", email: "", phone: "", message: "", consent: false };
      controls.forEach((control) => {
        values[control.name] = control.type === "checkbox" ? control.checked : control.value;
      });
      return values;
    }

    function showError(name, message) {
      const control = root.querySelector(`[name="${name}"]`);
      const errorText = root.querySelector(`#fm-${name}-error`);
      if (!control || !errorText) return;
      errorText.hidden = !message;
      errorText.textContent = message ? `Error: ${message}` : "";
      if (message) {
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("aria-describedby", `fm-${name}-error`);
      } else {
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
      }
      const wrapper = control.closest(".fm-field, .fm-consent");
      if (wrapper) wrapper.toggleAttribute("data-invalid", !!message);
    }

    controls.forEach((control) => {
      control.addEventListener("blur", () => {
        if (root.dataset.validateOn !== "blur") return;
        showError(control.name, validateField(control.name, readValues(), config));
      });
      control.addEventListener("input", () => {
        // Once a field is marked wrong, correcting it clears the message as you type.
        const errorText = root.querySelector(`#fm-${control.name}-error`);
        if (errorText && !errorText.hidden) showError(control.name, validateField(control.name, readValues(), config));
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = readValues();
      const problems = [];
      controls.forEach((control) => {
        const message = validateField(control.name, values, config);
        showError(control.name, message);
        if (message) problems.push({ name: control.name, message });
      });

      if (problems.length > 0) {
        if (useSummary) {
          summaryList.replaceChildren(
            ...problems.map((problem) => {
              const item = document.createElement("li");
              const link = document.createElement("a");
              link.href = `#fm-${problem.name}`;
              link.textContent = problem.message;
              item.append(link);
              return item;
            }),
          );
          summary.hidden = false;
          summary.focus();
        } else {
          root.querySelector(`[name="${problems[0].name}"]`).focus();
        }
        return;
      }

      summary.hidden = true;
      form.reset();
      controls.forEach((control) => showError(control.name, ""));
      success.hidden = false;
      success.focus();
      root.dispatchEvent(new CustomEvent("form-submit", { detail: { values } }));
    });
  }

  document.querySelectorAll("[data-form]").forEach((root) => createForm(root, defaultConfig));
})();
