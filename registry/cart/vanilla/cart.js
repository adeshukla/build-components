/**
 * Basket — plain JavaScript, no dependencies.
 * The lines and totals ship in the HTML, so the basket reads correctly before this runs.
 * This handles quantities, removing a line, the totals and the drawer.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createCart(root) {
    const symbol = root.dataset.symbol || "£";
    const shippingCost = Number(root.dataset.shippingCost) || 0;
    const freeOver = Number(root.dataset.freeOver) || 0;
    const hasShipping = root.dataset.hasShipping === "true";
    const list = root.querySelector("[data-lines]");
    const empty = root.querySelector("[data-empty]");
    const announce = root.querySelector("[data-announce]");
    const drawer = root.querySelector("[data-drawer]");
    const words = JSON.parse(root.dataset.words);

    function money(value) {
      return symbol + value.toFixed(2);
    }

    function lines() {
      return Array.from(root.querySelectorAll("[data-line]"));
    }

    function quantityOf(line) {
      const field = line.querySelector("[data-quantity]");
      const text = line.querySelector("[data-quantity-text]");
      return Math.min(99, Math.max(1, Math.round(Number(field ? field.value : text.textContent)) || 1));
    }

    function paint() {
      const all = lines();
      let subtotal = 0;
      let items = 0;

      all.forEach(function (line) {
        const each = Number(line.dataset.price) || 0;
        const quantity = quantityOf(line);
        subtotal += each * quantity;
        items += quantity;
        line.querySelector("[data-line-total]").textContent = money(each * quantity);
        const minus = line.querySelector('[data-step="-1"]');
        const plus = line.querySelector('[data-step="1"]');
        if (minus) minus.disabled = quantity <= 1;
        if (plus) plus.disabled = quantity >= 99;
      });

      const free = freeOver > 0 && subtotal >= freeOver;
      const shipping = !hasShipping || all.length === 0 ? 0 : free ? 0 : shippingCost;

      root.querySelectorAll("[data-items]").forEach(function (node) {
        node.textContent = String(items);
      });
      const itemsText = root.querySelector("[data-items-text]");
      if (itemsText) itemsText.textContent = fill(items === 1 ? words.itemOneText : words.itemsText, { count: items });
      root.querySelector("[data-subtotal]").textContent = money(subtotal);
      const shippingNode = root.querySelector("[data-shipping]");
      if (shippingNode) shippingNode.textContent = shipping === 0 ? words.freeText : money(shipping);
      root.querySelector("[data-total]").textContent = money(subtotal + shipping);

      const progress = root.querySelector("[data-progress]");
      if (progress) {
        progress.value = Math.min(subtotal, freeOver);
        root.querySelector("[data-progress-text]").textContent = free
          ? words.freeDeliveryText
          : fill(words.spendMoreText, { amount: money(Math.max(0, freeOver - subtotal)) });
      }

      if (all.length === 0) {
        if (list) list.hidden = true;
        if (empty) empty.hidden = false;
        const box = root.querySelector("[data-progress-box]");
        if (box) box.hidden = true;
        const checkout = root.querySelector("[data-checkout]");
        if (checkout) checkout.setAttribute("aria-disabled", "true");
      }
      return subtotal;
    }

    function say(text) {
      if (announce) announce.textContent = text;
    }

    root.addEventListener("click", function (event) {
      const step = event.target.closest("[data-step]");
      if (step) {
        const line = step.closest("[data-line]");
        const field = line.querySelector("[data-quantity]");
        const next = Math.min(99, Math.max(1, quantityOf(line) + Number(step.dataset.step)));
        if (field) field.value = String(next);
        else line.querySelector("[data-quantity-text]").textContent = String(next);
        const subtotal = paint();
        say(fill(words.changedText, { name: line.dataset.name, count: next, subtotal: money(subtotal) }));
        return;
      }

      const remove = event.target.closest("[data-remove]");
      if (remove) {
        const line = remove.closest("[data-line]");
        const name = line.dataset.name;
        line.remove();
        paint();
        const left = lines().length;
        say(fill(words.removedText, { name: name }) + " " + (left === 0 ? words.emptiedText : fill(left === 1 ? words.lineLeftText : words.linesLeftText, { count: left })));
        return;
      }

      if (drawer && event.target.closest("[data-open]")) drawer.showModal();
      if (drawer && event.target.closest("[data-close]")) drawer.close();
    });

    // Typing a quantity counts as soon as the field is left, and never below one.
    root.addEventListener("change", function (event) {
      const field = event.target.closest("[data-quantity]");
      if (!field) return;
      const line = field.closest("[data-line]");
      field.value = String(quantityOf(line));
      const subtotal = paint();
      say(fill(words.changedText, { name: line.dataset.name, count: field.value, subtotal: money(subtotal) }));
    });

    if (drawer) {
      drawer.addEventListener("mousedown", function (event) {
        // Clicking the backdrop closes the drawer; clicking inside it must not.
        if (event.target === drawer) drawer.close();
      });
    }

    paint();
  }

  document.querySelectorAll("[data-cart]").forEach(createCart);
})();
