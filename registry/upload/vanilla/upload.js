/**
 * File upload — plain JavaScript, no dependencies.
 * The input ships in the HTML, so files can be chosen before this runs. This adds the drop
 * area, the list of attached files and the checks — including on dropped files, because a
 * drop ignores the accept list.
 */
(function () {
  function fileSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function createUpload(root) {
    const input = root.querySelector("[data-input]");
    const drop = root.querySelector("[data-drop]");
    const list = root.querySelector("[data-files]");
    const problems = root.querySelector("[data-problems]");
    const announce = root.querySelector("[data-announce]");
    if (!input || !list) return;

    const accept = (root.dataset.accept || "")
      .split(",")
      .map(function (kind) {
        return kind.trim().toLowerCase();
      })
      .filter(Boolean);
    const maxSize = Number(root.dataset.maxSize) || 0;
    const maxFiles = Number(root.dataset.maxFiles) || 1;
    const multiple = root.dataset.multiple === "true";
    const showSize = root.dataset.showSize !== "false";
    let files = [];

    function problemWith(file) {
      const name = file.name.toLowerCase();
      const ok =
        accept.length === 0 ||
        accept.some(function (kind) {
          return kind.charAt(0) === "." ? name.slice(-kind.length) === kind : name.indexOf(kind) !== -1;
        });
      if (!ok) return file.name + " is not a kind of file we accept. Accepted: " + root.dataset.accept + ".";
      if (maxSize > 0 && file.size > maxSize * 1024 * 1024) {
        return file.name + " is " + fileSize(file.size) + ". The largest we can take is " + maxSize + " MB.";
      }
      return "";
    }

    function paint() {
      list.hidden = files.length === 0;
      list.innerHTML = "";
      files.forEach(function (file, index) {
        const item = document.createElement("li");
        item.className = "up-file";

        const name = document.createElement("span");
        name.className = "up-name";
        name.textContent = file.name;
        if (showSize) {
          const size = document.createElement("span");
          size.className = "up-size";
          size.textContent = fileSize(file.size);
          name.appendChild(size);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "up-remove";
        remove.innerHTML =
          '<span class="up-sr">Remove ' +
          file.name.replace(/[<>&]/g, "") +
          '</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        remove.addEventListener("click", function () {
          files.splice(index, 1);
          paint();
          say(file.name + " removed. " + (files.length === 0 ? "No files attached." : files.length + " left."));
        });

        item.appendChild(name);
        item.appendChild(remove);
        list.appendChild(item);
      });
    }

    function say(text) {
      if (announce) announce.textContent = text;
    }

    function showProblems(found) {
      if (!problems) return;
      problems.hidden = found.length === 0;
      problems.innerHTML = "";
      found.forEach(function (text) {
        const item = document.createElement("li");
        item.textContent = text;
        problems.appendChild(item);
      });
    }

    function add(incoming) {
      const found = [];
      const kept = [];
      for (let i = 0; i < incoming.length; i++) {
        const problem = problemWith(incoming[i]);
        if (problem) found.push(problem);
        // One at a time means the new file replaces the old one, so the count starts from zero.
        else if ((multiple ? files.length : 0) + kept.length >= maxFiles) {
          found.push("You can attach " + maxFiles + " file" + (maxFiles === 1 ? "" : "s") + " at most.");
          break;
        } else kept.push(incoming[i]);
      }
      files = multiple ? files.concat(kept) : kept.slice(-1);
      showProblems(found);
      paint();
      if (kept.length > 0) {
        const names = kept
          .map(function (file) {
            return file.name;
          })
          .join(", ");
        say(names + " attached. " + files.length + " file" + (files.length === 1 ? "" : "s") + " in all.");
      }
    }

    input.addEventListener("change", function () {
      add(Array.from(input.files));
      input.value = "";
    });

    if (drop) {
      drop.addEventListener("dragover", function (event) {
        event.preventDefault();
        drop.classList.add("up-drop--over");
      });
      drop.addEventListener("dragleave", function () {
        drop.classList.remove("up-drop--over");
      });
      drop.addEventListener("drop", function (event) {
        event.preventDefault();
        drop.classList.remove("up-drop--over");
        add(Array.from(event.dataTransfer.files));
      });
    }
  }

  document.querySelectorAll("[data-upload]").forEach(createUpload);
})();
