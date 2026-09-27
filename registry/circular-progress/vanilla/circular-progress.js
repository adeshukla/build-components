/**
 * Circular progress — plain JavaScript, no dependencies.
 * Point setValue at your own upload. An indeterminate ring is one with no aria-valuenow: inventing a
 * number would be a lie.
 */
(function () {
  // @config-start
  const config = {
    mode: "determinate",
    value: 0,
    unitText: "uploaded",
    doneText: "All photos uploaded.",
    demoMs: 2400,
    showValue: true,
  };
  // @config-end

  function createCircularProgress(root) {
    const dial = root.querySelector("[data-progress]");
    const arc = root.querySelector("[data-arc]");
    const face = root.querySelector("[data-face]");
    const detail = root.querySelector("[data-detail]");
    const status = root.querySelector("[data-status]");
    const run = root.querySelector("[data-run]");
    const circumference = Number(arc.dataset.circumference);
    let timer;

    function setValue(value) {
      const shown = Math.round(Math.min(Math.max(value, 0), 100));
      dial.setAttribute("aria-valuenow", String(shown));
      dial.setAttribute("aria-valuetext", shown + "% " + config.unitText);
      arc.style.strokeDashoffset = String(circumference * (1 - shown / 100));
      if (face) face.textContent = shown + "%";
      if (detail) detail.textContent = shown + "% " + config.unitText;
      return shown;
    }

    if (config.mode === "determinate") setValue(config.value);

    if (run) {
      run.addEventListener("click", function () {
        if (run.getAttribute("aria-disabled") === "true") return;
        clearInterval(timer);
        if (status) status.textContent = "";
        run.setAttribute("aria-disabled", "true");
        dial.setAttribute("aria-busy", "true");
        let value = 0;
        setValue(0);
        const steps = 20;
        timer = setInterval(
          function () {
            value += 100 / steps;
            if (setValue(value) >= 100) {
              clearInterval(timer);
              run.removeAttribute("aria-disabled");
              dial.removeAttribute("aria-busy");
              // Only the end is announced: a value read out on every tick talks over the page.
              if (status) status.textContent = config.doneText;
            }
          },
          Math.max(config.demoMs / steps, 30),
        );
      });
    }
  }

  document.querySelectorAll("[data-circular-progress]").forEach(createCircularProgress);
})();
