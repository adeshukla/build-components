/**
 * Form with validation — plain JavaScript, no dependencies.
 * Every field carries its rules as data attributes, so this file works for any set of fields.
 * Messages name the problem and the fix, in the style of the GOV.UK Design System.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createForm(root) {
    const form = root.querySelector("[data-form-element]");
    const rows = Array.from(root.querySelectorAll("[data-field]"));
    if (!form || rows.length === 0) return;

    const validateOn = root.dataset.validateOn || "blur";
    const words = JSON.parse(root.dataset.words);
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

      function say(text, values) {
        return fill(text, Object.assign({ label: label, name: lower }, values));
      }

      if (type === "checkbox") return required && !control.checked ? say(words.checkboxText) : "";

      const text = (control.value || "").trim();
      if (text === "") {
        if (!required) return "";
        if (type === "select") return say(words.selectMissingText);
        if (type === "date") return say(words.dateMissingText);
        return say(words.missingText);
      }

      if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return words.emailText;
      }
      if (type === "tel" && !/^[\d\s()+-]{7,}$/.test(text)) {
        return words.telText;
      }
      if (type === "url" && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(text)) {
        return words.urlText;
      }
      if (type === "select" && row.dataset.options && row.dataset.options.split("|").indexOf(text) === -1) {
        return say(words.notInListText);
      }

      if (type === "number" || type === "date") {
        if (type === "number" && !isFinite(Number(text))) return say(words.notNumberText);
        const size = type === "number" ? Number(text) : Date.parse(text);
        const low = type === "number" ? min : row.dataset.min ? Date.parse(row.dataset.min) : null;
        const high = type === "number" ? max : row.dataset.max ? Date.parse(row.dataset.max) : null;
        if (low !== null && size < low) return say(type === "number" ? words.tooSmallText : words.tooEarlyText, { min: row.dataset.min });
        if (high !== null && size > high) return say(type === "number" ? words.tooBigText : words.tooLateText, { max: row.dataset.max });
        return "";
      }

      if (min !== null && text.length < min) {
        return say(words.tooShortText, { min: min, count: text.length });
      }
      if (max !== null && text.length > max) {
        return say(words.tooLongText, { max: max, count: text.length });
      }
      if (row.dataset.pattern) {
        try {
          if (!new RegExp(row.dataset.pattern).test(text)) {
            return row.dataset.help
              ? say(words.formatHelpText, { help: row.dataset.help })
              : say(words.formatText);
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
      // Nothing typed yet, nothing to count: an empty field does not need a countdown.
      counter.hidden = length === 0;
      counter.textContent = fill(words.remainingText, { count: Math.max(0, max - length) });
    }

    rows.forEach(function (row) {
      const control = controlOf(row);
      counterFor(row);
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
