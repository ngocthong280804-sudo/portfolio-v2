(() => {
  const gallery = document.querySelector('#work-gallery');
  const viewSwitch = document.querySelector('.view-switch');
  const viewButtons = [...viewSwitch.querySelectorAll('[data-view]')];
  const film = gallery.querySelector('.project--lead');
  const preview = film.querySelector('.lead-preview');
  const controls = film.querySelector('.cut-player');
  const playButton = film.querySelector('[data-preview-play]');
  const playLabel = film.querySelector('[data-play-label]');
  const seek = film.querySelector('[data-preview-seek]');
  const clock = film.querySelector('[data-preview-clock]');
  const error = film.querySelector('[data-preview-error]');
  let pendingSeek = null;

  function displayTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
  }
  function updateClock() {
    if (!Number.isFinite(preview.duration)) return;
    const time = pendingSeek === null ? preview.currentTime : pendingSeek * preview.duration;
    seek.value = String(Math.round(time / preview.duration * Number(seek.max)));
    seek.setAttribute('aria-valuetext', displayTime(time) + ' trên ' + displayTime(preview.duration));
    clock.textContent = displayTime(time);
  }
  function setPlayState() {
    const playing = !preview.paused && !preview.ended;
    const label = playing ? 'Tạm dừng' : preview.ended ? 'Phát lại' : 'Phát trích đoạn';
    playButton.dataset.playing = String(playing);
    playButton.setAttribute('aria-label', label);
    playLabel.textContent = label;
  }
  function loadPreview() {
    if (!preview.hasAttribute('src') || preview.error) {
      error.hidden = true;
      preview.src = preview.dataset.src;
      preview.load();
    }
  }
  function setView(view) {
    const index = view === 'index';
    if (index && preview.hasAttribute('src')) {
      preview.pause();
      pendingSeek = null;
      preview.removeAttribute('src');
      preview.load();
      film.classList.remove('is-preview');
      seek.value = '0';
      seek.setAttribute('aria-valuetext', '0:00');
      clock.textContent = '0:00';
      error.hidden = true;
      setPlayState();
    }
    gallery.classList.toggle('is-index', index);
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  for (const button of viewButtons) {
    button.setAttribute('aria-controls', gallery.id);
    button.addEventListener('click', () => {
      setView(button.dataset.view);
      history.replaceState({ ...history.state, folioView: button.dataset.view }, '');
    });
  }
  setView(history.state?.folioView === 'index' ? 'index' : 'gallery');
  viewSwitch.hidden = false;

  if (preview.canPlayType('video/mp4')) {
    controls.hidden = false;
    playButton.addEventListener('click', async () => {
      if (!preview.paused && !preview.ended) { preview.pause(); return; }
      loadPreview();
      if (preview.ended) preview.currentTime = 0;
      try { await preview.play(); }
      catch (failure) { if (failure.name !== 'AbortError') error.hidden = false; }
    });
    seek.addEventListener('input', () => {
      loadPreview();
      pendingSeek = Number(seek.value) / Number(seek.max);
      if (Number.isFinite(preview.duration)) {
        preview.currentTime = pendingSeek * preview.duration;
        pendingSeek = null;
      }
      film.classList.add('is-preview');
      updateClock();
    });
    preview.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) {
        preview.currentTime = pendingSeek * preview.duration;
        pendingSeek = null;
      }
      updateClock();
    });
    preview.addEventListener('playing', () => {
      error.hidden = true;
      film.classList.add('is-preview');
      setPlayState();
    });
    preview.addEventListener('pause', setPlayState);
    preview.addEventListener('ended', () => {
      film.classList.remove('is-preview');
      setPlayState();
    });
    preview.addEventListener('timeupdate', updateClock);
    preview.addEventListener('error', () => {
      pendingSeek = null;
      film.classList.remove('is-preview');
      error.hidden = false;
      setPlayState();
    });
    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) preview.pause();
      });
      visibility.observe(film);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) preview.pause(); });
  }

  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('[data-copy-status]');
  const email = document.querySelector('#email-link').textContent;
  if (navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(email); copyStatus.textContent = 'Đã sao chép email.'; }
      catch { copyStatus.textContent = 'Bạn có thể sao chép địa chỉ phía trên.'; }
    });
  }
})();
