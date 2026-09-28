/**
 * Click-to-load video — plain JavaScript, no dependencies.
 * Nothing is requested from the video host until the button is pressed: no third-party script, no
 * cookie, no frame. Then one titled iframe is created.
 */
(function () {
  // @config-start
  const config = {
    title: "Building an accessible date picker, start to finish",
    embedUrl: "",
  };
  // @config-end

  function createVideoEmbed(root) {
    const frame = root.querySelector("[data-frame]");
    const play = root.querySelector("[data-play]");
    const poster = root.querySelector("[data-poster]");
    const todo = root.querySelector("[data-todo]");
    const note = root.querySelector("[data-note]");

    play.addEventListener("click", function () {
      play.hidden = true;
      if (poster) poster.hidden = true;
      if (note) note.hidden = true;

      if (config.embedUrl === "") {
        // Nothing to load. It says so rather than showing an empty black box.
        if (todo) todo.hidden = false;
        return;
      }

      const embed = document.createElement("iframe");
      embed.className = "vid-embed";
      embed.src = config.embedUrl;
      // An untitled frame is announced as "frame" and nothing else.
      embed.title = config.title;
      embed.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      embed.allowFullscreen = true;
      embed.setAttribute("data-embed", "");
      frame.appendChild(embed);
      embed.focus();
    });
  }

  document.querySelectorAll("[data-video-embed]").forEach(createVideoEmbed);
})();
