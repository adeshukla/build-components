/**
 * Password field — plain JavaScript, no dependencies.
 * The rules ship in the HTML, so the requirements are known before this runs. This adds the
 * show button, the strength and the met/unmet marks — in words as well as ticks.
 */
(function () {
  function createPassword(root) {
    const input = root.querySelector("[data-input]");
    if (!input) return;
    const toggle = root.querySelector("[data-toggle]");
    const caps = root.querySelector("[data-caps]");
    const strength = root.querySelector("[data-strength]");
    const bars = Array.from(root.querySelectorAll("[data-bar]"));
    const rules = Array.from(root.querySelectorAll("[data-rule]"));

    const min = Number(root.dataset.min) || 8;
    const needNumber = root.dataset.number === "true";
    const needUpper = root.dataset.upper === "true";
    const needSymbol = root.dataset.symbol === "true";
    const words = ["", "Weak", "Fair", "Good", "Strong"];

    function met(kind, value) {
      if (kind === "length") return value.length >= min;
      if (kind === "number") return /\d/.test(value);
      if (kind === "upper") return /[A-Z]/.test(value);
      if (kind === "symbol") return /[^A-Za-z0-9]/.test(value);
      return false;
    }

    function paint() {
      const value = input.value;

      let passed = 0;
      rules.forEach(function (rule) {
        const ok = met(rule.dataset.rule, value);
        if (ok) passed++;
        rule.classList.toggle("pw-met", ok);
        rule.querySelector(".pw-mark").textContent = ok ? "✓" : "•";
        const state = rule.querySelector("[data-state]");
        if (state) state.textContent = ok ? " (met)" : " (not met yet)";
      });

      if (!strength) return;
      if (value === "") {
        bars.forEach(function (bar) {
          bar.classList.remove("pw-bar--on");
        });
        strength.textContent = "Password strength: Enter a password";
        return;
      }

      // The rules you set, plus length and variety. A hint, never a gate.
      const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (pattern) {
        return pattern.test(value);
      }).length;
      const needed = 1 + (needNumber ? 1 : 0) + (needUpper ? 1 : 0) + (needSymbol ? 1 : 0);
      const long = value.length >= min + 4;
      const score = Math.min(4, Math.max(1, Math.min(passed, needed) + (variety >= 3 ? 1 : 0) + (long ? 1 : 0) - 1));

      bars.forEach(function (bar) {
        bar.classList.toggle("pw-bar--on", Number(bar.dataset.bar) <= score);
      });
      strength.textContent = "Password strength: " + words[score];
    }

    input.addEventListener("input", paint);

    if (toggle) {
      toggle.addEventListener("click", function () {
        const shown = toggle.getAttribute("aria-pressed") === "true";
        toggle.setAttribute("aria-pressed", String(!shown));
        input.type = shown ? "password" : "text";
        toggle.childNodes[0].textContent = shown ? "Show" : "Hide";
      });
    }

    if (caps) {
      input.addEventListener("keyup", function (event) {
        caps.hidden = !(event.getModifierState && event.getModifierState("CapsLock"));
      });
    }

    paint();
  }

  document.querySelectorAll("[data-password]").forEach(createPassword);
})();
