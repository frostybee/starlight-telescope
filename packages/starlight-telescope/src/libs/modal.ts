export function getModalHTML(): string {
  return `
    <dialog id="telescope-dialog" class="telescope" aria-label="Site search">
      <div class="telescope__modal">
        <button class="telescope__close-button" id="telescope-close-button" aria-label="Close">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
        </button>
        <div class="telescope__tabs" role="tablist">
          <button class="telescope__tab telescope__tab--active" data-tab="search" role="tab" aria-selected="true" id="tab-search">Search</button>
          <button class="telescope__tab" data-tab="recent" role="tab" aria-selected="false" id="tab-recent">Recent</button>
        </div>
        <div class="telescope__search-header">
          <input id="telescope-search-input" class="telescope__search-input" type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls="telescope-results"
            aria-activedescendant=""
            placeholder="Search pages..." autocomplete="off" spellcheck="false">
        </div>
        <div id="telescope-search-section" class="telescope__section telescope__section--active" role="tabpanel" aria-labelledby="tab-search">
          <div id="telescope-loading" class="telescope__loading">
            <div class="telescope__spinner"></div>
            <span>Loading pages...</span>
          </div>
          <ul id="telescope-results" class="telescope__results" role="listbox" aria-label="Search results"></ul>
        </div>
        <div id="telescope-recent-section" class="telescope__section" role="tabpanel" aria-labelledby="tab-recent">
          <ul id="telescope-recent-results" class="telescope__results" role="listbox" aria-label="Recent pages"></ul>
        </div>
        <div id="telescope-live-region" class="sr-only" aria-live="polite" aria-atomic="true"></div>
        <div class="telescope__footer">
          <div class="telescope__shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>Space</kbd> pin</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </dialog>`;
}
