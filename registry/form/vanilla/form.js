/**
 * Form with validation — plain JavaScript, no dependencies.
 * Every field carries its rules as data attributes, so this file works for any set of fields.
 * Messages name the problem and the fix, in the style of the GOV.UK Design System.
 */
(function () {
  function createForm(root) {
    const form = root.querySelector("[data-form-element]");
    const rows = Array.from(root.querySelectorAll("[data-field]"));
    if (!form || rows.length === 0) return;

    const validateOn = root.dataset.validateOn || "blur";
    const summary = root.querySelector("[data-summary]");
    const summaryList = root.querySelector("[data-summary-list]");
    const success = root.querySelector("[data-success]");

    function controlOf(row) {
      return row.querySelector(".fm-control, .fm-checkbox");
    }

    function limit(value) {
      return value === undefined || value === "" || !isFinite(Number(value)) ? null : Number(value);
    }

    /** The same rules as the React output. */
    function validate(row) {
      const type = row.dataset.type;
      const label = row.dataset.label || "";
      const lower = label.charAt(0).toLowerCase() + label.slice(1);
      const required = row.dataset.required === "true";
      const control = controlOf(row);
      const min = limit(row.dataset.min);
      const max = limit(row.dataset.max);

      if (type === "checkbox") return required && !control.checked ? "Select “" + label + "” to continue." : "";

      const text = (control.value || "").trim();
      if (text === "") {
        if (!required) return "";
        if (type === "select") return "Select " + lower + ".";
        if (type === "date") return "Enter " + lower + ", for example 27 03 2026.";
        return "Enter " + lower + ".";
      }

      if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return "Enter an email address in the correct format, like name@example.com.";
      }
      if (type === "tel" && !/^[\d\s()+-]{7,}$/.test(text)) {
        return "Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.";
      }
      if (type === "url" && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(text)) {
        return "Enter a web address in the correct format, like https://example.com.";
      }
      if (type === "select" && row.dataset.options && row.dataset.options.split("|").indexOf(text) === -1) {
        return "Select " + lower + " from the list.";
      }

      if (type === "number" || type === "date") {
        if (type === "number" && !isFinite(Number(text))) return label + " must be a number.";
        const size = type === "number" ? Number(text) : Date.parse(text);
        const low = type === "number" ? min : row.dataset.min ? Date.parse(row.dataset.min) : null;
        const high = type === "number" ? max : row.dataset.max ? Date.parse(row.dataset.max) : null;
        if (low !== null && size < low) return label + " must be " + row.dataset.min + (type === "number" ? " or more." : " or later.");
        if (high !== null && size > high) return label + " must be " + row.dataset.max + (type === "number" ? " or less." : " or earlier.");
        return "";
      }

      if (min !== null && text.length < min) {
        return label + " must be at least " + min + " characters. You have entered " + text.length + ".";
      }
      if (max !== null && text.length > max) {
        return label + " must be " + max + " characters or fewer. You have entered " + text.length + ".";
      }
      if (row.dataset.pattern) {
        try {
          if (!new RegExp(row.dataset.pattern).test(text)) {
            return row.dataset.help
              ? "Enter " + lower + " in the format described: " + row.dataset.help
              : "Enter " + lower + " in the requested format.";
          }
        } catch {
          // An unusable pattern must never block the visitor.
        }
      }
      return "";
    }

    function paint(row, message) {
      const control = controlOf(row);
      const error = row.querySelector(".fm-error");
      const name = row.dataset.field;
      error.hidden = message === "";
      error.querySelector("[data-message]").textContent = message;

      const described = [];
      if (row.dataset.help) described.push(name + "-help");
      if (message !== "") described.push(name + "-error");
      if (described.length > 0) control.setAttribute("aria-describedby", described.join(" "));
      else control.removeAttribute("aria-describedby");

      if (message === "") {
        control.removeAttribute("aria-invalid");
        control.classList.remove("fm-control--error");
      } else {
        control.setAttribute("aria-invalid", "true");
        control.classList.add("fm-control--error");
      }
    }

    function paintSummary(problems) {
      if (!summary) return;
      summary.hidden = problems.length === 0;
      summaryList.innerHTML = "";
      problems.forEach(function (problem) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.className = "fm-summary-link";
        link.href = "#" + problem.name;
        link.textContent = problem.message;
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const control = form.querySelector('[name="' + problem.name + '"]');
          if (control) control.focus();
        });
        item.appendChild(link);
        summaryList.appendChild(item);
      });
    }

    function counterFor(row) {
      const counter = row.querySelector("[data-counter]");
      if (!counter) return;
      const max = limit(row.dataset.max);
      if (max === null) return;
      const length = (controlOf(row).value || "").length;
      counter.textContent = Math.max(0, max - length) + " characters remaining";
    }

    rows.forEach(function (row) {
      const control = controlOf(row);
      const recheck = function () {
        const wrong = row.querySelector(".fm-error").hidden === false;
        if (validateOn === "input" || wrong) paint(row, validate(row));
        counterFor(row);
      };
      control.addEventListener("input", recheck);
      control.addEventListener("change", function () {
        if (validateOn !== "submit" || row.querySelector(".fm-error").hidden === false) paint(row, validate(row));
      });
      control.addEventListener("blur", function () {
        if (validateOn === "blur") paint(row, validate(row));
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const problems = [];
      rows.forEach(function (row) {
        const message = validate(row);
        paint(row, message);
        if (message !== "") problems.push({ name: row.dataset.field, message: message });
      });
      paintSummary(problems);

      if (problems.length > 0) {
        if (summary) summary.focus();
        else form.querySelector('[name="' + problems[0].name + '"]').focus();
        return;
      }

      form.reset();
      rows.forEach(function (row) {
        paint(row, "");
        counterFor(row);
      });
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  document.querySelectorAll("[data-form]").forEach(createForm);
})();
