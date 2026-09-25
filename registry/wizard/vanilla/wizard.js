/**
 * Multi-step wizard — plain JavaScript, no dependencies.
 * One step at a time: each step is a new page as far as a screen reader is concerned, so focus goes
 * to its heading, and a step that is needed cannot be walked past.
 */
(function () {
  function createWizard(root) {
    const form = root.querySelector("[data-form]");
    const done = root.querySelector("[data-done]");
    const names = Array.from(root.querySelectorAll("[data-step-name]"));
    const title = root.querySelector("[data-title]");
    const of = root.querySelector("[data-of]");
    const label = root.querySelector("[data-label]");
    const field = root.querySelector("[data-field]");
    const error = root.querySelector("[data-error]");
    const back = root.querySelector("[data-back]");
    const next = root.querySelector("[data-next]");
    const doneTitle = root.querySelector("[data-done-title]");
    const status = root.querySelector("[data-status]");
    const answers = root.querySelectorAll("[data-answer]");
    if (!names.length) return;
    const answered = names.map(function () {
      return "";
    });
    let at = 0;

    function show(step, moveFocus) {
      at = step;
      const item = names[at];
      title.textContent = item.dataset.stepTitle;
      title.append(of);
      of.textContent = "Step " + (at + 1) + " of " + names.length;
      label.textContent = item.dataset.stepLabel;
      if (item.dataset.stepRequired === "yes") {
        const needed = document.createElement("span");
        needed.className = "wz-needed";
        needed.textContent = "(needed)";
        label.append(needed);
      }
      field.value = answered[at];
      field.required = item.dataset.stepRequired === "yes";
      clearError();
      back.hidden = at === 0;
      next.textContent = at === names.length - 1 ? root.dataset.finish : root.dataset.next;
      names.forEach(function (other, index) {
        if (index === at) other.setAttribute("aria-current", "step");
        else other.removeAttribute("aria-current");
        const marker = other.querySelector(".wz-sr");
        if (index === at && !marker) {
          const sr = document.createElement("span");
          sr.className = "wz-sr";
          sr.textContent = "Current step: ";
          other.prepend(sr);
        }
        if (index !== at && marker) marker.remove();
      });
      // A new step is a new page as far as the reader is concerned: focus its heading.
      if (moveFocus) title.focus();
    }

    function clearError() {
      error.hidden = true;
      error.textContent = "";
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", "wz-error");
      field.focus();
    }

    field.addEventListener("input", function () {
      answered[at] = field.value;
      // Once an error is showing, check as they type rather than punishing them on blur.
      if (!error.hidden && field.value.trim() !== "") clearError();
    });

    back.addEventListener("click", function () {
      if (at > 0) show(at - 1, true);
    });

    next.addEventListener("click", function () {
      answered[at] = field.value;
      if (names[at].dataset.stepRequired === "yes" && field.value.trim() === "") {
        showError(names[at].dataset.stepLabel + " is needed before you can go on.");
        return;
      }
      if (at < names.length - 1) {
        show(at + 1, true);
        return;
      }
      answers.forEach(function (cell, index) {
        cell.textContent = answered[index].trim() === "" ? "Not given" : answered[index];
      });
      form.hidden = true;
      done.hidden = false;
      if (status) status.textContent = "Sent. Everything you filled in is listed above.";
      doneTitle.focus();
    });

    show(0, false);
  }

  document.querySelectorAll("[data-wizard]").forEach(createWizard);
})();
