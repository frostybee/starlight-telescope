import TelescopeSearch from './telescope-search.js';
import { getModalHTML } from './modal.js';
import type { TelescopeConfig } from '../schemas/config.js';

export class TelescopeSearchElement extends HTMLElement {
  private telescopeSearch: TelescopeSearch | null = null;

  connectedCallback() {
    const configStr = this.dataset.config;
    if (!configStr) {
      console.error('[Telescope] Missing data-config attribute');
      return;
    }

    let config: TelescopeConfig;
    try {
      config = JSON.parse(configStr);
    } catch (e) {
      console.error('[Telescope] Invalid config JSON:', e);
      return;
    }

    // Render trigger button
    this.innerHTML = this.getTriggerButtonHTML();

    // Platform detection for Mac (userAgentData with fallback to userAgent)
    const shortcutKey = this.querySelector('.telescope__shortcut-key');
    const isMac = (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform === 'macOS'
      || /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
    if (shortcutKey && isMac) {
      shortcutKey.textContent = '⌘';
      this.querySelector('button')?.setAttribute('aria-keyshortcuts', 'Meta+/');
    }

    // Inject dialog if not present
    if (!document.getElementById('telescope-dialog')) {
      document.body.insertAdjacentHTML('beforeend', getModalHTML());
    }

    // Initialize search controller
    this.telescopeSearch = new TelescopeSearch(config);

    // Button click opens modal
    this.querySelector('button')?.addEventListener('click', () => {
      this.telescopeSearch?.open();
    });
  }

  disconnectedCallback() {
    // Cleanup to prevent memory leaks
    this.telescopeSearch?.destroy();
    this.telescopeSearch = null;
  }

  private getTriggerButtonHTML(): string {
    return `<button class="telescope__trigger-btn" aria-label="Open Telescope Search" aria-keyshortcuts="Control+/">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/>
        <path d="m13.56 11.747 4.332-.924"/>
        <path d="m16 21-3.105-6.21"/>
        <path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/>
        <path d="m6.158 8.633 1.114 4.456"/>
        <path d="m8 21 3.105-6.21"/>
      </svg>
      <kbd class="telescope__shortcut sl-hidden md:sl-flex">
        <kbd class="telescope__shortcut-key">Ctrl</kbd>
        <kbd>/</kbd>
      </kbd>
    </button>`;
  }
}

customElements.define('telescope-search', TelescopeSearchElement);
