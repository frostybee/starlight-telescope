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
    const shortcutKey = this.querySelector('.telescope__shortcut-key');
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
    return `<button class="telescope__trigger-btn" aria-label="Open Telescope Search" aria-keyshortcuts="Control+/">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M21.92 6.62 20.4 2.89a1.5 1.5 0 0 0-1.94-.84l-5.68 2.27a1.5 1.5 0 0 0-.85 1.95l.65 1.61-3.34 1.33-1.08-2.7a1 1 0 0 0-1.3-.56l-1.79.72a1 1 0 0 0-.56 1.3l1.08 2.69-1.67.67a1 1 0 0 0-.56 1.3l.5 1.24a1 1 0 0 0 1.3.56l1.66-.67.37.91a1 1 0 0 0 1.3.56l1.78-.71a1 1 0 0 0 .56-1.3l-.37-.92 3.34-1.34.65 1.62a1.5 1.5 0 0 0 1.94.84l5.68-2.27a1.5 1.5 0 0 0 .85-1.95ZM6.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm2-4.5L7.12 13l2.34-.94 1.38 3.44-.84.34a1 1 0 0 1-1.3-.56l-.2-.5Z"/>
      </svg>
      <kbd class="telescope__shortcut sl-hidden md:sl-flex">
        <kbd class="telescope__shortcut-key">Ctrl</kbd>
        <kbd>/</kbd>
      </kbd>
    </button>`;
  }
}

customElements.define('telescope-search', TelescopeSearchElement);
