/**
 * One-time code — plain JavaScript, no dependencies.
 * The boxes ship in the HTML, so a code can be typed before this runs. This adds moving
 * between boxes, pasting a whole code across them, and the completion message.
 */
(function () {
  /** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
  function keyOf(event) {
    const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
    const swapped = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
    return rtl ? (swapped[event.key] ?? event.key) : event.key;
  }

  function createOtp(root) {
    const boxes = Array.from(root.querySelectorAll("[data-box]"));
    const single = root.querySelector("[data-single]");
    const announce = root.querySelector("[data-announce]");
    const length = Number(root.dataset.length) || 6;
    const letters = root.dataset.letters === "true";

    function clean(text) {
      return text.replace(letters ? /[^A-Za-z0-9]/g : /[^0-9]/g, "").toUpperCase();
    }

    function say() {
      if (!announce) return;
      const code = single
        ? single.value
        : boxes
            .map(function (box) {
              return box.value;
            })
            .join("");
      announce.textContent = code.length === length ? root.dataset.complete : "";
    }

    if (single) {
      single.addEventListener("input", function () {
        single.value = clean(single.value).slice(0, length);
        say();
      });
      return;
    }

    function fillFrom(index, text) {
      // Typing or pasting several characters fills the boxes from here on.
      text.split("").forEach(function (character, offset) {
        if (index + offset < boxes.length) boxes[index + offset].value = character;
      });
      boxes[Math.min(boxes.length - 1, index + text.length)].focus();
      say();
    }

    boxes.forEach(function (box, index) {
      box.addEventListener("input", function () {
        const text = clean(box.value);
        if (text === "") {
          box.value = "";
          say();
          return;
        }
        fillFrom(index, text);
      });

      box.addEventListener("keydown", function (event) {
        if (keyOf(event) === "Backspace" && box.value === "" && index > 0) {
          event.preventDefault();
          boxes[index - 1].value = "";
          boxes[index - 1].focus();
          say();
          return;
        }
        if (keyOf(event) === "ArrowLeft" && index > 0) {
          event.preventDefault();
          boxes[index - 1].focus();
        }
        if (keyOf(event) === "ArrowRight" && index < boxes.length - 1) {
          event.preventDefault();
          boxes[index + 1].focus();
        }
      });

      box.addEventListener("paste", function (event) {
        event.preventDefault();
        fillFrom(index, clean(event.clipboardData.getData("text")));
      });

      box.addEventListener("focus", function () {
        box.select();
      });
    });
  }

  document.querySelectorAll("[data-otp]").forEach(createOtp);
})();
