export default class ThemeView {
  constructor() {
    this.storageKey = 'lto-theme-mode';
    this.init();
  }

  init() {
    if (!document.body) return;

    const savedMode = localStorage.getItem(this.storageKey);
    const shouldUseNight = savedMode === 'night';
    const existingLayer = document.querySelector('#night-theme-layer');

    if (!existingLayer) {
      document.body.insertAdjacentHTML(
        'afterbegin',
        '<div id="night-theme-layer" class="night-theme-layer" aria-hidden="true"></div>'
      );
    }

    const toggle = document.querySelector('#theme-mode-toggle');
    if (toggle) {
      toggle.checked = shouldUseNight;
      toggle.setAttribute('aria-label', shouldUseNight ? 'Disable night mode' : 'Enable night mode');
      toggle.addEventListener('change', () => this.setTheme(toggle.checked ? 'night' : 'day'));
    }

    this.setTheme(shouldUseNight ? 'night' : 'day', false);
  }

  setTheme(mode, persist = true) {
    const isNight = mode === 'night';
    document.body.classList.toggle('night-mode', isNight);
    document.body.dataset.theme = isNight ? 'night' : 'day';

    const toggle = document.querySelector('#theme-mode-toggle');
    if (toggle) {
      toggle.checked = isNight;
      toggle.setAttribute('aria-label', isNight ? 'Disable night mode' : 'Enable night mode');
    }

    if (persist) {
      localStorage.setItem(this.storageKey, isNight ? 'night' : 'day');
    }
  }
}
