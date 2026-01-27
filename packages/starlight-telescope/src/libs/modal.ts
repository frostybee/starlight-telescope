export function getModalHTML(): string {
  return `
    <dialog id="telescope-dialog" class="telescope-dialog" aria-label="Site search">
      <div class="telescope-modal">
        <button class="telescope-close-button" id="telescope-close-button" aria-label="Close">
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
        </button>
        <div class="telescope-tabs" role="tablist">
          <button class="telescope-tab active" data-tab="search" role="tab" aria-selected="true" id="tab-search">Search</button>
          <button class="telescope-tab" data-tab="recent" role="tab" aria-selected="false" id="tab-recent">Recent</button>
        </div>
        <div class="telescope-search-header">
          <input id="telescope-search-input" class="telescope-search-input" type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls="telescope-results"
            aria-activedescendant=""
            placeholder="Search pages..." autocomplete="off" spellcheck="false">
        </div>
        <div id="telescope-search-section" class="telescope-section active" role="tabpanel" aria-labelledby="tab-search">
          <div id="telescope-loading" class="telescope-loading">
            <div class="telescope-spinner"></div>
            <span>Loading pages...</span>
          </div>
          <ul id="telescope-results" class="telescope-results" role="listbox" aria-label="Search results"></ul>
        </div>
        <div id="telescope-recent-section" class="telescope-section" role="tabpanel" aria-labelledby="tab-recent">
          <ul id="telescope-recent-results" class="telescope-results" role="listbox" aria-label="Recent pages"></ul>
        </div>
        <div id="telescope-live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>
        <div class="telescope-footer">
          <div class="telescope-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>Space</kbd> pin</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </dialog>`;
}
