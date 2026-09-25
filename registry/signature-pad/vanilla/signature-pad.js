/**
 * Signature pad — plain JavaScript, no dependencies.
 * Drawing needs a pointer, so typing the name is a full alternative rather than a fallback, and
 * whether anything has been signed is said in words.
 */
(function () {
  const WIDTH = 600;
  const HEIGHT = 180;

  function createSignaturePad(root) {
    const canvas = root.querySelector("[data-canvas]");
    const typed = root.querySelector("[data-typed]");
    const clear = root.querySelector("[data-clear]");
    const confirm = root.querySelector("[data-confirm]");
    const status = root.querySelector("[data-status]");
    const context = canvas.getContext("2d");
    let drawing = false;
    let drawn = false;

    function signed() {
      return drawn || (typed && typed.value.trim() !== "");
    }

    function refresh(message) {
      confirm.disabled = !signed();
      if (status) status.textContent = message || (signed() ? "There is a signature" : "Nothing signed yet");
    }

    /** Canvas pixels from a pointer position, whatever size the canvas is drawn at. */
    function at(event) {
      const box = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - box.left) / box.width) * WIDTH,
        y: ((event.clientY - box.top) / box.height) * HEIGHT,
      };
    }

    canvas.addEventListener("pointerdown", function (event) {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const point = at(event);
      context.strokeStyle = root.dataset.ink;
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(point.x, point.y);
    });

    canvas.addEventListener("pointermove", function (event) {
      if (!drawing) return;
      const point = at(event);
      context.lineTo(point.x, point.y);
      context.stroke();
      if (!drawn) {
        drawn = true;
        refresh();
      }
    });

    ["pointerup", "pointercancel"].forEach(function (name) {
      canvas.addEventListener(name, function () {
        drawing = false;
      });
    });

    if (typed) typed.addEventListener("input", function () { refresh(); });

    clear.addEventListener("click", function () {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      drawn = false;
      if (typed) typed.value = "";
      refresh("Signature cleared");
    });

    confirm.addEventListener("click", function () {
      if (confirm.disabled || !status) return;
      status.textContent = drawn ? "Signed by drawing" : "Signed as " + typed.value.trim();
    });

    refresh();
  }

  document.querySelectorAll("[data-signature-pad]").forEach(createSignaturePad);
})();
