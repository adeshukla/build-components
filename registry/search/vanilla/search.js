/**
 * Search — plain JavaScript, no dependencies.
 * Point it at any data by editing the JSON block in the page: an array, an object, nested as
 * deep as you like. Every object with a title becomes a result, and the titles above it become
 * its breadcrumb. Every word typed has to match somewhere.
 */
(function () {
  /** Relative, fragment, http(s), mailto and tel links only. */
  function safeHref(value) {
    return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(String(value).trim()) ? String(value).trim() : "#";
  }

  function words(value) {
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      return value
        .filter(function (part) {
          return typeof part === "string" || typeof part === "number";
        })
        .join(" ");
    }
    return "";
  }

  /** The same walk as the React output. */
  function flatten(data, titleKey, fields) {
    const entries = [];
    function walk(node, path) {
      if (Array.isArray(node)) {
        node.forEach(function (child) {
          walk(child, path);
        });
        return;
      }
      if (node === null || typeof node !== "object") return;
      const title = typeof node[titleKey] === "string" ? node[titleKey] : "";
      if (title !== "") {
        // No fields named means every plain value on the object counts.
        const keys = fields.length > 0 ? fields : Object.keys(node);
        entries.push({
          title: title,
          description: typeof node.description === "string" ? node.description : "",
          url: typeof node.url === "string" ? node.url : "",
          path: path,
          text: keys
            .map(function (key) {
              return words(node[key]);
            })
            .concat(path)
            .join(" ")
            .toLowerCase(),
        });
      }
      const below = title !== "" ? path.concat(title) : path;
      Object.keys(node).forEach(function (key) {
        if (node[key] !== null && typeof node[key] === "object") walk(node[key], below);
      });
    }
    walk(data, []);
    return entries;
  }

  function createSearch(root) {
    const input = root.querySelector("[data-input]");
    const results = root.querySelector("[data-results]");
    const announce = root.querySelector("[data-announce]");
    const empty = root.querySelector("[data-empty]");
    const source = root.querySelector("[data-source]");
    const dialog = root.querySelector("[data-dialog]");
    const trigger = root.querySelector("[data-trigger]");
    if (!input || !results) return;

    let data = [];
    try {
      data = JSON.parse(source ? source.textContent : "[]");
    } catch {
      data = [];
    }

    const fields = (root.dataset.fields || "")
      .split(",")
      .map(function (field) {
        return field.trim();
      })
      .filter(Boolean);
    const entries = flatten(data, root.dataset.titleKey || "title", fields);
    const max = Math.max(1, Number(root.dataset.max) || 8);
    const grouped = root.dataset.groups !== "false";
    const highlight = root.dataset.highlight !== "false";
    let shown = [];
    let active = 0;

    function search(query) {
      const typed = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (typed.length === 0) return [];
      function rank(entry) {
        const title = entry.title.toLowerCase();
        if (title.indexOf(typed[0]) === 0) return 0;
        if (typed.every(function (word) { return title.indexOf(word) !== -1; })) return 1;
        return 2;
      }
      return entries
        .filter(function (entry) {
          return typed.every(function (word) {
            return entry.text.indexOf(word) !== -1;
          });
        })
        .sort(function (a, b) {
          return rank(a) - rank(b);
        })
        .slice(0, max);
    }

    function titleNode(title, query) {
      const span = document.createElement("span");
      span.className = "se-title";
      const typed = query.toLowerCase().split(/\s+/).filter(Boolean);
      const lower = title.toLowerCase();
      const hit = highlight
        ? typed
            .map(function (word) {
              return { word: word, index: lower.indexOf(word) };
            })
            .find(function (candidate) {
              return candidate.index !== -1;
            })
        : null;
      if (!hit) {
        span.textContent = title;
        return span;
      }
      span.appendChild(document.createTextNode(title.slice(0, hit.index)));
      const mark = document.createElement("mark");
      mark.className = "se-mark";
      mark.textContent = title.slice(hit.index, hit.index + hit.word.length);
      span.appendChild(mark);
      span.appendChild(document.createTextNode(title.slice(hit.index + hit.word.length)));
      return span;
    }

    function paintActive() {
      Array.from(results.querySelectorAll("[role=option]")).forEach(function (option, index) {
        option.setAttribute("aria-selected", String(index === active));
      });
      if (shown[active]) input.setAttribute("aria-activedescendant", "search-result-" + active);
      else input.removeAttribute("aria-activedescendant");
    }

    function paint() {
      const query = input.value;
      const found = search(query);
      results.innerHTML = "";

      // Results in the order they are shown, grouped under the top of their breadcrumb.
      const groups = [];
      found.forEach(function (entry) {
        const name = grouped ? entry.path[0] || "Results" : "";
        let group = groups.find(function (existing) {
          return existing.name === name;
        });
        if (!group) {
          group = { name: name, items: [] };
          groups.push(group);
        }
        group.items.push(entry);
      });
      shown = [];
      groups.forEach(function (group) {
        shown = shown.concat(group.items);
      });

      groups.forEach(function (group) {
        const wrap = document.createElement("div");
        if (group.name) {
          wrap.setAttribute("role", "group");
          wrap.setAttribute("aria-label", group.name);
          const heading = document.createElement("p");
          heading.className = "se-group";
          heading.setAttribute("aria-hidden", "true");
          heading.textContent = group.name;
          wrap.appendChild(heading);
        }
        group.items.forEach(function (entry) {
          const index = shown.indexOf(entry);
          const option = document.createElement("div");
          option.className = "se-option";
          option.id = "search-result-" + index;
          option.setAttribute("role", "option");
          option.appendChild(titleNode(entry.title, query));
          // With groups on, the top of the trail is the group heading; with them off it has to
          // stay in the trail, or it is lost.
          const trail = grouped ? entry.path.slice(1) : entry.path;
          if (entry.description || trail.length > 0) {
            const detail = document.createElement("span");
            detail.className = "se-detail";
            detail.textContent = (trail.length > 0 ? trail.join(" › ") + " · " : "") + entry.description;
            option.appendChild(detail);
          }
          option.addEventListener("mousedown", function (event) {
            event.preventDefault();
            window.location.assign(safeHref(entry.url));
          });
          option.addEventListener("mouseenter", function () {
            active = index;
            paintActive();
          });
          wrap.appendChild(option);
        });
        results.appendChild(wrap);
      });

      const typed = query.trim() !== "";
      results.hidden = found.length === 0;
      input.setAttribute("aria-expanded", String(typed));
      if (empty) empty.hidden = !typed || found.length > 0;
      if (announce) announce.textContent = !typed ? "" : found.length === 0 ? root.dataset.emptyText : found.length + " results.";
      active = 0;
      paintActive();
    }

    input.addEventListener("input", paint);
    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        active = (active + step + shown.length) % Math.max(1, shown.length);
        paintActive();
      }
      if (event.key === "Enter" && shown[active]) {
        event.preventDefault();
        window.location.assign(safeHref(shown[active].url));
      }
    });

    if (dialog && trigger) {
      const kbd = root.querySelector("[data-kbd]");
      if (kbd && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbd.textContent = "⌘K";

      function open() {
        if (dialog.open) return;
        dialog.showModal();
        input.focus();
      }
      trigger.addEventListener("click", open);
      dialog.addEventListener("close", function () {
        trigger.focus();
      });
      dialog.addEventListener("mousedown", function (event) {
        if (event.target === dialog) dialog.close();
      });

      // ⌘K or Ctrl+K from anywhere on the page, which is what people reach for first.
      if (root.dataset.shortcut !== "false") {
        document.addEventListener("keydown", function (event) {
          if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            open();
          }
        });
      }
    }
  }

  document.querySelectorAll("[data-search]").forEach(createSearch);
})();
