/**
 * Error summary — plain JavaScript, no dependencies.
 * On submit the problems are collected, listed once at the top, and focus moves to that list. Each
 * line is a link to the answer that has to change.
 */
(function () {
  // @config-start
  const config = {
    heading: "There is a problem",
    countInHeading: false,
    markFields: true,
    successText: "Thank you. Your details were accepted.",
  };
  // @config-end

  /** What is wrong with one answer, as an instruction rather than a label plus "invalid". */
  function problemWith(input) {
    const label = input.dataset.fieldLabel || "answer";
    const value = input.value.trim();
    if (input.dataset.fieldRequired === "yes" && value === "") return "Enter your " + label.toLowerCase();
    if (value === "") return "";
    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter an email address in the form name@example.com";
    if (input.type === "tel" && !/^[0-9+()\s-]{7,}$/.test(value))
      return "Enter a phone number using only digits, spaces, + and brackets";
    return "";
  }

  function createErrorSummary(root) {
    const form = root.querySelector("form");
    const summary = root.querySelector("[data-summary]");
    const heading = root.querySelector("[data-summary-heading]");
    const list = root.querySelector("[data-list]");
    const status = root.querySelector("[data-status]");
    const inputs = Array.from(root.querySelectorAll("[data-field]"));

    function showMessage(input, message) {
      const slot = root.querySelector('[data-message-for="' + input.id + '"]');
      if (!slot) return;
      slot.textContent = config.markFields ? message : "";
      slot.hidden = message === "" || !config.markFields;
      if (message !== "") {
        input.setAttribute("aria-invalid", "true");
        if (config.markFields) input.setAttribute("aria-describedby", slot.id);
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    }

    function check() {
      const problems = [];
      inputs.forEach(function (input) {
        const message = problemWith(input);
        showMessage(input, message);
        if (message !== "") problems.push({ input: input, message: message });
      });

      list.textContent = "";
      summary.hidden = problems.length === 0;
      if (status) status.textContent = problems.length === 0 ? config.successText : "";
      if (problems.length === 0) return;

      heading.textContent = config.countInHeading
        ? problems.length + (problems.length === 1 ? " problem to fix" : " problems to fix")
        : config.heading;

      problems.forEach(function (problem) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#" + problem.input.id;
        link.textContent = problem.message;
        link.addEventListener("click", function (event) {
          event.preventDefault();
          problem.input.focus();
        });
        item.appendChild(link);
        list.appendChild(item);
      });

      // Focus goes to the summary, not the first field: the list is the thing that has to be read.
      summary.focus();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      check();
    });

    // Once a problem is shown, it follows the typing rather than waiting for another submit.
    inputs.forEach(function (input) {
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") !== "true") return;
        showMessage(input, "");
        const link = list.querySelector('a[href="#' + input.id + '"]');
        if (link) link.parentElement.remove();
        if (!list.querySelector("a")) summary.hidden = true;
      });
    });
  }

  document.querySelectorAll("[data-error-summary]").forEach(createErrorSummary);
})();
