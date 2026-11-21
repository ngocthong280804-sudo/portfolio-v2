(() => {
  const selector = document.querySelector('.film-selector');
  const choices = Array.from(selector.querySelectorAll('button'));
  const panels = choices.map(choice => document.getElementById(choice.getAttribute('aria-controls')));

  function select(id) {
    choices.forEach((choice, i) => {
      const selected = panels[i].id === id;
      panels[i].hidden = !selected;
      panels[i].classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
  }
  const initial = panels.find(panel => panel.id === history.state?.selectedProject) || panels[0];
  select(initial.id);
  selector.hidden = false;
  choices.forEach((choice, i) => {
    choice.addEventListener('click', () => {
      select(panels[i].id);
      history.replaceState({ ...history.state, selectedProject: panels[i].id }, '');
    });
    choice.addEventListener('keydown', event => {
      const offset = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!offset) return;
      event.preventDefault();
      const next = choices[(i + offset + choices.length) % choices.length];
      next.focus();
      next.click();
    });
  });

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
