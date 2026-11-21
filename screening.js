(() => {
  const dialog = document.querySelector('.preview-dialog');
  const video = dialog.querySelector('video');
  const trigger = document.querySelector('.watch-preview');
  if (dialog.showModal && video.canPlayType('video/mp4')) {
    trigger.hidden = false;
    trigger.addEventListener('click', () => {
      dialog.showModal();
      video.src = video.dataset.src;
      video.play().catch(() => {});
    });
    dialog.addEventListener('close', () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      trigger.focus({ preventScroll:true });
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  const copy = document.querySelector('[data-copy-email]');
  const status = document.querySelector('[data-copy-status]');
  if (navigator.clipboard?.writeText) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(document.querySelector('#email-link').textContent); status.textContent = 'Đã sao chép email.'; }
      catch { status.textContent = 'Bạn có thể sao chép địa chỉ phía trên.'; }
    });
  }
})();
