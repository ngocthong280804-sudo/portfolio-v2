const deck = document.querySelector('[data-deck]');
const strip = deck.querySelector('.deck-strip');
const stage = deck.querySelector('.deck-stage');
const tabs = [...strip.querySelectorAll('[data-panel]')];
const panels = tabs.map(tab => document.getElementById(tab.dataset.panel));
let selected = 0;

function selectCut(index) {
  selected = index;
  tabs.forEach((tab, i) => {
    const active = i === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i].hidden = !active;
  });
}

function changeCut(index, moveFocus = false) {
  stage.classList.add('is-changing');
  selectCut(index);
  history.replaceState({ ...history.state, portfolioCut: tabs[index].id }, '');
  if (moveFocus) tabs[index].focus({ preventScroll: true });
}

strip.setAttribute('role', 'tablist');
tabs.forEach((tab, i) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panels[i].id);
  panels[i].setAttribute('role', 'tabpanel');
  panels[i].setAttribute('aria-labelledby', tab.id);
  panels[i].tabIndex = 0;
  tab.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    changeCut(i);
  });
});
strip.addEventListener('keydown', event => {
  const last = tabs.length - 1;
  const steps = { ArrowRight: (selected + 1) % tabs.length, ArrowLeft: (selected + last) % tabs.length, Home: 0, End: last };
  if (event.key === ' ') {
    event.preventDefault();
    event.target.click();
  } else if (Object.hasOwn(steps, event.key)) {
    event.preventDefault();
    changeCut(steps[event.key], true);
  }
});

let touchStart;
stage.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 ? event.touches[0] : undefined;
}, { passive: true });
stage.addEventListener('touchend', event => {
  if (!touchStart) return;
  const end = event.changedTouches[0];
  const dx = end.clientX - touchStart.clientX;
  const dy = end.clientY - touchStart.clientY;
  touchStart = undefined;
  if (Math.abs(dx) < 60 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
  changeCut((selected + (dx < 0 ? 1 : tabs.length - 1)) % tabs.length);
}, { passive: true });
stage.addEventListener('touchcancel', () => { touchStart = undefined; }, { passive: true });
selectCut(Math.max(0, tabs.findIndex(tab => tab.id === history.state?.portfolioCut)));

const copyButton = document.querySelector('[data-copy-email]');
const copyStatus = document.querySelector('[data-copy-status]');
const email = document.querySelector('#email-link').textContent;
if (navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      copyStatus.textContent = 'Đã sao chép địa chỉ email.';
    } catch {
      copyStatus.textContent = 'Bạn có thể chọn địa chỉ phía trên để sao chép.';
    }
  });
}
