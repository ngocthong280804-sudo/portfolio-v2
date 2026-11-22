const intro = document.querySelector('[data-intro]');
const video = intro.querySelector('video');
const name = intro.querySelector('[data-name]');
const lastFrame = intro.querySelector('[data-last-frame]');
const control = intro.querySelector('[data-intro-control]');
const profile = document.getElementById('gioi-thieu');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const errorMessage = intro.querySelector('[data-video-error]');
const ambience = intro.querySelector('canvas');
const backdrop = ambience.getContext('2d');
const hasVideoFrameCallback = typeof video.requestVideoFrameCallback === 'function';
let pendingFrame;
let horizontalAlignment = 0.5;

function paintBackdrop() {
  if (!backdrop || video.readyState < video.HAVE_CURRENT_DATA) return;
  const width = ambience.width;
  const height = ambience.height;
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const imageWidth = sourceWidth * scale;
  const imageHeight = sourceHeight * scale;
  const left = Math.round((width - imageWidth) * horizontalAlignment);
  const top = Math.round((height - imageHeight) / 2);
  const right = Math.round(width - left - imageWidth);
  const bottom = Math.round(height - top - imageHeight);
  const edge = 8;

  if (left > 0) backdrop.drawImage(video, 0, 0, edge, sourceHeight, 0, 0, left, height);
  if (right > 0) backdrop.drawImage(video, sourceWidth - edge, 0, edge, sourceHeight, width - right, 0, right, height);
  if (top > 0) backdrop.drawImage(video, 0, 0, sourceWidth, edge, 0, 0, width, top);
  if (bottom > 0) backdrop.drawImage(video, 0, sourceHeight - edge, sourceWidth, edge, 0, height - bottom, width, bottom);
  backdrop.drawImage(video, left, top, width - left - right, height - top - bottom);
  intro.classList.add('intro--ambient');
}

function paintNextFrame() {
  pendingFrame = undefined;
  paintBackdrop();
  if (!video.paused && !video.ended) startBackdrop();
}

function startBackdrop() {
  if (hasVideoFrameCallback && pendingFrame === undefined) {
    pendingFrame = video.requestVideoFrameCallback(paintNextFrame);
  }
}

function sizeBackdrop() {
  horizontalAlignment = Number(getComputedStyle(intro).getPropertyValue('--video-alignment'));
  ambience.height = Math.max(1, Math.round(ambience.width * intro.clientHeight / intro.clientWidth));
  paintBackdrop();
}

function updateControl() {
  control.hidden = video.ended || !errorMessage.hidden;
  const state = video.paused ? 'play' : video.muted ? 'muted' : 'sound';
  control.dataset.state = state;
  const label = { play: 'Phát video', muted: 'Bật âm thanh', sound: 'Tắt âm thanh' }[state];
  control.setAttribute('aria-label', label);
  control.title = label;
}

async function playIntro() {
  try {
    await video.play();
  } catch (error) {
    if (error.name === 'NotAllowedError' && !video.muted) {
      video.muted = true;
      try { await video.play(); } catch { /* Manual playback is available in the corner. */ }
    }
    updateControl();
  }
}

function showVideoError() {
  errorMessage.hidden = false;
  control.hidden = true;
}

video.addEventListener('play', () => {
  updateControl();
  startBackdrop();
});
video.addEventListener('pause', updateControl);
video.addEventListener('volumechange', updateControl);
video.addEventListener('loadeddata', sizeBackdrop);
video.addEventListener('timeupdate', () => {
  if (!hasVideoFrameCallback) paintBackdrop();
});
window.addEventListener('resize', sizeBackdrop);
video.addEventListener('error', showVideoError);
video.querySelector('source').addEventListener('error', showVideoError);
video.addEventListener('ended', async () => {
  paintBackdrop();
  lastFrame.hidden = !lastFrame.complete || lastFrame.naturalWidth === 0;
  name.hidden = false;
  intro.classList.add('intro--complete');
  updateControl();

  if (window.scrollY > 2 || (location.hash && location.hash !== '#top')) return;
  const navigation = new AbortController();
  const cancel = () => navigation.abort();
  const options = { once: true, passive: true, signal: navigation.signal };
  for (const event of ['scroll', 'hashchange', 'pagehide']) window.addEventListener(event, cancel, options);
  document.addEventListener('visibilitychange', cancel, options);
  try {
    await Promise.allSettled(name.getAnimations({ subtree: true }).map(animation => animation.finished));
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (navigation.signal.aborted || document.hidden || window.scrollY > 2 || !video.ended) return;
    profile.focus({ preventScroll: true });
    profile.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  } finally {
    navigation.abort();
  }
});

control.addEventListener('click', () => {
  if (video.paused) {
    video.muted = false;
    playIntro();
  } else {
    video.muted = !video.muted;
  }
});
if (!reducedMotion.matches && (!location.hash || location.hash === '#top')) {
  playIntro();
} else {
  updateControl();
}
