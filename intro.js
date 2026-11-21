const intro = document.querySelector('[data-intro]');
const video = intro.querySelector('video');
const name = intro.querySelector('[data-name]');
const lastFrame = intro.querySelector('[data-last-frame]');
const controls = intro.querySelector('[data-controls]');
const playButton = intro.querySelector('[data-play]');
const playOverlay = intro.querySelector('[data-play-overlay]');
const soundButton = intro.querySelector('[data-sound]');
const progress = intro.querySelector('progress');
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

function updateControls() {
  playButton.textContent = video.ended ? 'Phát lại' : video.paused ? 'Phát intro' : 'Tạm dừng';
  playOverlay.hidden = !video.paused || video.ended || !errorMessage.hidden;
  soundButton.textContent = video.muted ? 'Bật tiếng' : 'Tắt tiếng';
}

function updateProgress() {
  progress.value = Number.isFinite(video.duration) ? video.currentTime / video.duration : 0;
}

async function playIntro() {
  if (video.ended) {
    name.hidden = true;
    lastFrame.hidden = true;
    intro.classList.remove('intro--complete');
    video.currentTime = 0;
  }

  try {
    await video.play();
  } catch {
    updateControls();
  }
}

function showVideoError() {
  errorMessage.hidden = false;
  controls.hidden = true;
  playOverlay.hidden = true;
}

video.controls = false;
controls.hidden = false;
video.addEventListener('play', () => {
  updateControls();
  startBackdrop();
});
video.addEventListener('pause', updateControls);
video.addEventListener('volumechange', updateControls);
video.addEventListener('loadeddata', sizeBackdrop);
video.addEventListener('timeupdate', () => {
  updateProgress();
  if (!hasVideoFrameCallback) paintBackdrop();
});
window.addEventListener('resize', sizeBackdrop);
video.addEventListener('error', showVideoError);
video.querySelector('source').addEventListener('error', showVideoError);
video.addEventListener('ended', () => {
  paintBackdrop();
  lastFrame.hidden = !lastFrame.complete || lastFrame.naturalWidth === 0;
  name.hidden = false;
  intro.classList.add('intro--complete');
  updateControls();
  updateProgress();
});

playButton.addEventListener('click', () => {
  if (video.paused) playIntro();
  else video.pause();
});
playOverlay.addEventListener('click', playIntro);
soundButton.addEventListener('click', () => {
  video.muted = !video.muted;
});

updateControls();
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !location.hash) {
  playIntro();
}
