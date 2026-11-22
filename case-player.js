const screening = document.querySelector(".screening-dialog");

if (screening && typeof screening.showModal === "function") {
  const stage = screening.querySelector(".screening-stage");
  const heading = screening.querySelector("h2");
  const originalLink = screening.querySelector(".screening-dialog__source");
  let opener;

  for (const link of document.querySelectorAll("a[data-screening]")) {
    const post = new URL(link.href);
    const tiktok = post.hostname === "www.tiktok.com" && post.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/);
    const facebook = post.hostname === "www.facebook.com" && /^\/reel\/\d+\/?$/.test(post.pathname);
    const localVideo = post.origin === location.origin && post.protocol === location.protocol && /\.mp4$/i.test(post.pathname);
    if (!tiktok && !facebook && !localVideo) continue;

    const provider = tiktok ? "TikTok" : "Facebook";
    const sourceHref = link.dataset.original || link.href;
    const sourceLabel = link.dataset.original ? "Bài gốc trên TikTok" : localVideo ? "Mở video riêng" : "Mở trên " + provider;
    const title = link.querySelector("strong").textContent;
    if (!localVideo || link.dataset.original) {
      const item = document.createElement("div");
      item.className = "screening-item";

      const source = document.createElement("a");
      source.className = "screening-source";
      source.href = sourceHref;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = sourceLabel;
      source.setAttribute("aria-label", sourceLabel + " – " + title);

      link.replaceWith(item);
      item.append(link, source);
    }
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", screening.id);
    const caption = link.querySelector(".sample__caption small");
    if (caption) caption.textContent = "Xem tại đây";

    link.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      heading.textContent = title;
      originalLink.href = sourceHref;
      originalLink.textContent = sourceLabel;
      originalLink.setAttribute("aria-label", sourceLabel + " – " + title);
      screening.showModal();
      event.preventDefault();
      document.documentElement.classList.add("screening-active");
      opener = link;

      if (localVideo) {
        const player = document.createElement("video");
        player.controls = true;
        player.playsInline = true;
        player.preload = "metadata";
        player.setAttribute("aria-label", title);
        const poster = link.querySelector("img");
        if (poster) player.poster = poster.currentSrc || poster.src;
        player.src = post.href;
        stage.replaceChildren(player);
        player.play().catch(() => { /* Native controls remain available for manual playback. */ });
        return;
      }

      const frame = document.createElement("iframe");
      frame.title = title + " – " + provider;
      frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      if (tiktok) {
        frame.src = "https://www.tiktok.com/player/v1/" + tiktok[1] + "?autoplay=1&controls=1&rel=0";
      } else {
        const embed = new URL("https://www.facebook.com/plugins/video.php");
        embed.search = new URLSearchParams({
          href: post.href,
          show_text: "false",
          width: String(stage.clientWidth),
          height: String(stage.clientHeight),
          t: "0"
        });
        frame.src = embed.href;
      }
      stage.replaceChildren(frame);
    });
  }

  screening.addEventListener("close", () => {
    if (screening.open) return;
    const player = stage.querySelector("video");
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
    stage.replaceChildren();
    document.documentElement.classList.remove("screening-active");
    opener?.focus({preventScroll: true});
  });

  screening.addEventListener("click", event => {
    if (event.target !== screening) return;
    const bounds = screening.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) screening.close();
  });
}
