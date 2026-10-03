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

  // A YouTube or Vimeo page link becomes its embed address (YouTube's no-cookie host). Anything that is
  // not http(s) is refused: a config value must never become a javascript: address.
  function toEmbedUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      const host = url.hostname.replace(/^(www|m)\./, "");
      const id = function (candidate) { return candidate && /^[\w-]{6,20}$/.test(candidate) ? candidate : ""; };
      const youtube = function (videoId) { return videoId ? "https://www.youtube-nocookie.com/embed/" + videoId : value; };
      if (host === "youtu.be") return youtube(id(url.pathname.slice(1)));
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (url.searchParams.get("v")) return youtube(id(url.searchParams.get("v")));
        const parts = url.pathname.split("/");
        if (parts[1] === "shorts" || parts[1] === "live") return youtube(id(parts[2]));
      }
      if (host === "vimeo.com" && /^\d{4,12}$/.test(url.pathname.split("/")[1])) {
        return "https://player.vimeo.com/video/" + url.pathname.split("/")[1];
      }
      return value;
    } catch (error) {
      return "";
    }
  }

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

      const address = toEmbedUrl(config.embedUrl);
      if (address === "") {
        // Nothing to load. It says so rather than showing an empty black box.
        if (todo) todo.hidden = false;
        return;
      }

      const embed = document.createElement("iframe");
      embed.className = "vid-embed";
      embed.src = address;
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
