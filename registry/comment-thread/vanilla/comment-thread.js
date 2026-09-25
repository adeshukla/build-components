/**
 * Comment thread — plain JavaScript, no dependencies.
 * Posting adds the comment to the list, keeps focus in the field and says what happened, because a
 * comment appearing further up the page is silent otherwise.
 */
(function () {
  function createCommentThread(root) {
    const list = root.querySelector("[data-list]");
    const field = root.querySelector("[data-field]");
    const post = root.querySelector("[data-post]");
    const toggle = root.querySelector("[data-toggle]");
    const count = root.querySelector("[data-count]");
    const status = root.querySelector("[data-status]");

    function refreshCount() {
      // The space is part of the heading, so it reads "Comments (3)" rather than "Comments(3)".
      if (count) count.textContent = " (" + list.querySelectorAll("[data-comment]").length + ")";
    }

    if (field && post) {
      field.addEventListener("input", function () {
        post.disabled = field.value.trim() === "";
      });

      post.addEventListener("click", function () {
        const body = field.value.trim();
        if (body === "") return;
        const item = document.createElement("li");
        item.className = "ct-comment";
        item.setAttribute("data-comment", "");
        const meta = document.createElement("p");
        meta.className = "ct-meta";
        const author = document.createElement("span");
        author.className = "ct-author";
        author.textContent = root.dataset.you;
        const when = document.createElement("span");
        when.className = "ct-when";
        // "Just now" rather than a clock reading: a time formatted here would differ from the server's.
        when.textContent = "Just now";
        meta.append(author, when);
        const text = document.createElement("p");
        text.className = "ct-body";
        text.textContent = body;
        item.append(meta, text);
        list.append(item);

        field.value = "";
        post.disabled = true;
        refreshCount();
        if (status) {
          status.textContent = "Comment posted. " + list.querySelectorAll("[data-comment]").length + " comments in this thread.";
        }
        field.focus();
      });
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        list.hidden = open;
        toggle.textContent = open ? "Show the thread" : "Hide the thread";
      });
    }

    refreshCount();
  }

  document.querySelectorAll("[data-comment-thread]").forEach(createCommentThread);
})();
