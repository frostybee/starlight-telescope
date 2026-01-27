import TelescopeSearch from './telescope-search.js';
import { getModalHTML } from './modal.js';
import type { TelescopeConfig } from '../schemas/config.js';

export class TelescopeSearchElement extends HTMLElement {
  private telescopeSearch: TelescopeSearch | null = null;

  connectedCallback() {
    const configStr = this.dataset.config;
    if (!configStr) {
      console.error('TelescopeSearchElement: missing data-config attribute');
      return;
    }

    const config: TelescopeConfig = JSON.parse(configStr);

    // Render trigger button
    this.innerHTML = this.getTriggerButtonHTML();

    // Platform detection for Mac
    const shortcutKey = this.querySelector('.telescope-shortcut-key');
    if (shortcutKey && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
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

  private getTriggerButtonHTML(): string {
    return `<button class="telescope-trigger-btn" aria-label="Open Telescope Search" aria-keyshortcuts="Control+/">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M21.71 20.29 18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42-1.39ZM11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/>
      </svg>
      <kbd class="telescope-shortcut sl-hidden md:sl-flex">
        <kbd class="telescope-shortcut-key">Ctrl</kbd>
        <kbd>/</kbd>
      </kbd>
    </button>`;
  }
}

customElements.define('telescope-search', TelescopeSearchElement);
