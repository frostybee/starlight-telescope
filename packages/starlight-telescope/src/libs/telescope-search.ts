import Fuse, { type FuseResult, type FuseResultMatch, type IFuseOptions } from 'fuse.js';
import type { TelescopeConfig, TelescopePage } from '../schemas/config.js';

declare global {
  interface Window {
    __telescopeInitialized?: boolean;
  }
}

export default class TelescopeSearch {
  private config: TelescopeConfig;
  private isOpen: boolean = false;
  private isLoading: boolean = true;
  private searchQuery: string = '';
  private allPages: TelescopePage[] = [];
  private filteredPages: TelescopePage[] = [];
  private selectedIndex: number = 0;
  private fuseInstance: Fuse<TelescopePage> | null = null;
  private recentPages: TelescopePage[];
  private pinnedPages: TelescopePage[];
  private currentTab: 'search' | 'recent' = 'search';
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentOrigin: string | null = null;
  private searchResultsWithMatches: FuseResult<TelescopePage>[] = [];
  private currentLocale: string | undefined = undefined;

  // DOM elements
  private dialogElement: HTMLDialogElement | null;
  private liveRegion: HTMLElement | null;
  private searchInputElement: HTMLInputElement | null;
  private resultsContainerElement: HTMLElement | null;
  private recentResultsContainerElement: HTMLElement | null;
  private tabs: NodeListOf<HTMLElement>;
  private closeButton: HTMLElement | null;

  private getActiveResultsContainer(): HTMLElement | null {
    if (this.currentTab === 'recent') {
      return this.recentResultsContainerElement;
    }
    return this.resultsContainerElement;
  }

  constructor(config: TelescopeConfig) {
    this.config = config;
    this.recentPages = this.loadRecentPages();
    this.pinnedPages = this.loadPinnedPages();

    // DOM elements
    this.dialogElement = document.getElementById('telescope-dialog') as HTMLDialogElement | null;
    this.liveRegion = document.getElementById('telescope-live-region');
    this.searchInputElement = document.getElementById(
      'telescope-search-input'
    ) as HTMLInputElement | null;
    this.resultsContainerElement = document.getElementById('telescope-results');
    this.recentResultsContainerElement = document.getElementById('telescope-recent-results');
    this.tabs = document.querySelectorAll('.telescope__tab');
    this.closeButton = document.getElementById('telescope-close-button');

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.close = this.close.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.togglePinPage = this.togglePinPage.bind(this);
    this.togglePinForSelectedItem = this.togglePinForSelectedItem.bind(this);

    // Apply theme
    this.applyTheme();

    // Initialize
    this.fetchPages();
    this.setupListeners();
  }

  private applyTheme(): void {
    const { theme } = this.config;
    const root = document.documentElement;

    if (theme.overlayBackground) {
      root.style.setProperty('--telescope-overlay-bg', theme.overlayBackground);
    }
    if (theme.modalBackground) {
      root.style.setProperty('--telescope-modal-bg', theme.modalBackground);
    }
    if (theme.modalBackgroundAlt) {
      root.style.setProperty('--telescope-modal-bg-alt', theme.modalBackgroundAlt);
    }
    if (theme.accentColor) {
      root.style.setProperty('--telescope-accent', theme.accentColor);
    }
    if (theme.accentHover) {
      root.style.setProperty('--telescope-accent-hover', theme.accentHover);
    }
    if (theme.accentSelected) {
      root.style.setProperty('--telescope-accent-selected', theme.accentSelected);
    }
    if (theme.textPrimary) {
      root.style.setProperty('--telescope-text-primary', theme.textPrimary);
    }
    if (theme.textSecondary) {
      root.style.setProperty('--telescope-text-secondary', theme.textSecondary);
    }
    if (theme.border) {
      root.style.setProperty('--telescope-border', theme.border);
    }
    if (theme.borderActive) {
      root.style.setProperty('--telescope-border-active', theme.borderActive);
    }
    if (theme.pinColor) {
      root.style.setProperty('--telescope-pin-color', theme.pinColor);
    }
    if (theme.tagColor) {
      root.style.setProperty('--telescope-tag-color', theme.tagColor);
    }
  }

  /**
   * Detect locale from the current page URL.
   * Checks for locale patterns in the path after the base URL.
   */
  private detectLocaleFromPath(): string | undefined {
    const basePath = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
    const pathAfterBase = window.location.pathname.slice(basePath.length);

    // Remove leading slash and get first segment
    const segments = pathAfterBase.replace(/^\//, '').split('/');
    const firstSegment = segments[0];

    if (!firstSegment) return undefined;

    // Common path segments that should not be treated as locales
    const commonPathSegments = new Set([
      'api', 'src', 'css', 'img', 'lib', 'app', 'bin', 'doc', 'log', 'tmp', 'var', 'opt', 'usr', 'etc'
    ]);

    if (commonPathSegments.has(firstSegment)) {
      return undefined;
    }

    // Match strict locale patterns: xx or xx-xx or xx-xxxx
    // e.g., 'en', 'fr', 'en-us', 'pt-br', 'zh-hans'
    if (/^[a-z]{2}(-[a-z]{2,4})?$/.test(firstSegment)) {
      return firstSegment;
    }

    return undefined;
  }

  private async fetchPages(): Promise<void> {
    this.isLoading = true;
    this.updateLoadingState();

    try {
      const basePath = (import.meta.env.BASE_URL || '').replace(/\/$/, '');

      // Detect current locale for locale-aware fetch
      this.currentLocale = this.detectLocaleFromPath();
      const localePath = this.currentLocale ? `/${this.currentLocale}` : '';

      const response = await fetch(`${basePath}${localePath}/pages.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      this.allPages = await response.json();

      // Get the URL from the response object
      this.currentOrigin = new URL(response.url).origin;

      // Validate stored pages against current site's pages
      // This filters out pages from other sites sharing the same localStorage
      const validatedRecent = this.validateStoredPages(this.recentPages);
      const validatedPinned = this.validateStoredPages(this.pinnedPages);

      // Update and save if any pages were filtered out
      if (validatedRecent.length !== this.recentPages.length) {
        this.recentPages = validatedRecent;
        localStorage.setItem(this.getStorageKey('recentPages'), JSON.stringify(this.recentPages));
      }
      if (validatedPinned.length !== this.pinnedPages.length) {
        this.pinnedPages = validatedPinned;
        localStorage.setItem(this.getStorageKey('pinnedPages'), JSON.stringify(this.pinnedPages));
      }

      // Initialize Fuse.js after fetching pages
      this.initializeFuse();

      // Re-render if dialog is open to show validated data
      const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement | null;
      if (dialog?.open) {
        this.filteredPages = [...this.allPages];
        this.renderSearchResults();
        this.renderRecentResults();
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      this.allPages = [];
      // Clear stored pages on error since we can't validate them
      this.recentPages = [];
      this.pinnedPages = [];
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  private updateLoadingState(): void {
    const loadingEl = document.getElementById('telescope-loading');
    const resultsEl = document.getElementById('telescope-results');
    if (loadingEl) loadingEl.style.display = this.isLoading ? 'flex' : 'none';
    if (resultsEl) resultsEl.style.display = this.isLoading ? 'none' : 'block';
  }

  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
  }

  private highlightMatches(
    text: string,
    matches: readonly FuseResultMatch[] | undefined,
    key: string
  ): string {
    if (!matches || !text) return this.escapeHtml(text || '');

    const match = matches.find((m) => m.key === key);
    if (!match || !match.indices || match.indices.length === 0) {
      return this.escapeHtml(text);
    }

    // Build highlighted string from indices
    let result = '';
    let lastIndex = 0;

    // Sort indices and merge overlapping ones
    const sortedIndices = [...match.indices].sort((a, b) => a[0] - b[0]);

    for (const [start, end] of sortedIndices) {
      if (start > lastIndex) {
        result += this.escapeHtml(text.slice(lastIndex, start));
      }
      if (start >= lastIndex) {
        result += `<mark class="telescope__highlight">${this.escapeHtml(text.slice(start, end + 1))}</mark>`;
        lastIndex = end + 1;
      }
    }

    result += this.escapeHtml(text.slice(lastIndex));
    return result;
  }

  private getStorageKey(key: string): string {
    return `telescope_${key}`;
  }

  private getMatchesForPage(page: TelescopePage): readonly FuseResultMatch[] | undefined {
    const result = this.searchResultsWithMatches.find((r) => r.item.path === page.path);
    return result?.matches;
  }

  private validateStoredPages(storedPages: TelescopePage[]): TelescopePage[] {
    // Return empty array if allPages hasn't loaded yet - don't show unvalidated data
    if (this.allPages.length === 0) return [];

    const validPaths = new Set(this.allPages.map(p => p.path));
    return storedPages.filter(page => validPaths.has(page.path));
  }

  private loadRecentPages(): TelescopePage[] {
    try {
      const recent = localStorage.getItem(this.getStorageKey('recentPages'));
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.warn('Failed to parse recent pages from localStorage:', error);
      return [];
    }
  }

  private loadPinnedPages(): TelescopePage[] {
    try {
      const pinned = localStorage.getItem(this.getStorageKey('pinnedPages'));
      return pinned ? JSON.parse(pinned) : [];
    } catch (error) {
      console.warn('Failed to parse pinned pages from localStorage:', error);
      return [];
    }
  }

  private saveRecentPage(page: TelescopePage): void {
    // Remove if already exists
    this.recentPages = this.recentPages.filter((p) => p.path !== page.path);
    // Add to beginning
    this.recentPages.unshift(page);
    // Keep only configured number of items
    this.recentPages = this.recentPages.slice(0, this.config.recentPagesCount);
    // Save to localStorage
    localStorage.setItem(this.getStorageKey('recentPages'), JSON.stringify(this.recentPages));
  }

  private savePinnedPages(): void {
    localStorage.setItem(this.getStorageKey('pinnedPages'), JSON.stringify(this.pinnedPages));
  }

  private clearRecentPages(): void {
    this.recentPages = [];
    localStorage.removeItem(this.getStorageKey('recentPages'));
    this.renderSearchResults();
    this.renderRecentResults();
    this.announce('Recent pages cleared');
  }

  private clearPinnedPages(): void {
    this.pinnedPages = [];
    localStorage.removeItem(this.getStorageKey('pinnedPages'));
    this.renderSearchResults();
    this.announce('Pinned pages cleared');
  }

  private isPagePinned(path: string): boolean {
    return this.pinnedPages.some((page) => page.path === path);
  }

  private togglePinPage(page: TelescopePage): void {
    const pageIndex = this.pinnedPages.findIndex((p) => p.path === page.path);

    if (pageIndex > -1) {
      // Remove from pinned
      this.pinnedPages.splice(pageIndex, 1);
    } else {
      // Add to pinned
      this.pinnedPages.push(page);
    }

    this.savePinnedPages();

    // Refresh the UI
    this.renderSearchResults();
    this.renderRecentResults();
  }

  private togglePinForSelectedItem(): void {
    // Get the currently selected item from the DOM
    const selectedItem = document.querySelector('.telescope__result-item--selected');

    if (selectedItem && selectedItem.hasAttribute('data-path')) {
      const path = selectedItem.getAttribute('data-path');
      const page =
        this.allPages.find((p) => p.path === path) ||
        this.recentPages.find((p) => p.path === path);

      if (page) {
        this.togglePinPage(page);
      }
    }
  }

  private initializeFuse(): void {
    // Only initialize if Fuse.js is available and we have pages
    if (typeof Fuse !== 'undefined' && this.allPages.length > 0) {
      const { fuseOptions } = this.config;

      const options: IFuseOptions<TelescopePage> = {
        keys: fuseOptions.keys,
        threshold: fuseOptions.threshold,
        includeScore: true,
        ignoreLocation: fuseOptions.ignoreLocation,
        distance: fuseOptions.distance,
        minMatchCharLength: fuseOptions.minMatchCharLength,
        findAllMatches: fuseOptions.findAllMatches,
        useExtendedSearch: true,
        includeMatches: true,
      };

      this.fuseInstance = new Fuse(this.allPages, options);
    } else {
      console.warn('Fuse.js not available or no pages to index');
    }
  }

  private debounce<T extends (...args: unknown[]) => void>(
    callback: T,
    wait: number
  ): (event: Event) => void {
    return (event: Event) => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = setTimeout(() => callback.call(this, event), wait);
    };
  }

  private setupListeners(): void {
    // Global keyboard shortcut
    document.addEventListener('keydown', this.handleKeyDown);

    // Add event listeners to the search input
    if (this.searchInputElement) {
      // Use debounced version of handleSearchInput to prevent excessive searches
      const debouncedSearchInput = this.debounce(this.handleSearchInput, this.config.debounceMs);
      this.searchInputElement.addEventListener('input', debouncedSearchInput);
      this.searchInputElement.addEventListener('keydown', this.handleSearchKeyDown);
    }

    // Use event delegation for dialog interactions - works regardless of when elements exist
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Close button clicked
      if (target.closest('#telescope-close-button')) {
        this.close();
        return;
      }

      // Tab clicked
      const tab = target.closest('.telescope__tab') as HTMLElement;
      if (tab?.dataset.tab) {
        this.switchTab(tab.dataset.tab as 'search' | 'recent');
        return;
      }

      // Backdrop clicked (click on dialog but outside modal)
      const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement;
      if (dialog?.open && event.target === dialog) {
        this.close();
        return;
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const { shortcut } = this.config;

    // Check if the configured shortcut is pressed
    const keyMatches = event.key === shortcut.key;
    const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
    const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;
    const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatches = shortcut.alt ? event.altKey : !event.altKey;

    // For the default "/" shortcut, allow either Ctrl or Meta (Cmd on Mac)
    const modifierMatches =
      shortcut.ctrl && shortcut.meta
        ? event.ctrlKey || event.metaKey
        : ctrlMatches && metaMatches;

    if (keyMatches && modifierMatches && shiftMatches && altMatches) {
      event.preventDefault();
      this.open();
    }

    // Escape to close - check actual dialog state
    const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement;
    if (event.key === 'Escape' && dialog?.open) {
      event.preventDefault();
      this.close();
    }
  }

  private handleSearchKeyDown(event: KeyboardEvent): void {
    const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement;
    if (!dialog?.open) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.navigateResults(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.navigateResults(-1);
        break;

      case 'Enter':
        event.preventDefault();
        this.selectCurrentItem();
        break;

      case ' ':
        // Only handle space for bookmarking if the input is empty or we're at the start
        if (
          this.searchInputElement &&
          (this.searchInputElement.value === '' || this.searchInputElement.selectionStart === 0)
        ) {
          event.preventDefault();
          this.togglePinForSelectedItem();
        }
        // Otherwise, let the space be typed normally
        break;

      default:
        break;
    }
  }

  private navigateResults(direction: number): void {
    const container = this.getActiveResultsContainer();
    if (!container) return;

    // Count actual rendered items - single source of truth
    const totalItems = container.querySelectorAll('.telescope__result-item').length;
    if (totalItems === 0) return;

    if (direction > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % totalItems;
    } else {
      this.selectedIndex = (this.selectedIndex - 1 + totalItems) % totalItems;
    }

    this.updateSelectedResult();
  }

  private handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;

    if (this.currentTab === 'recent') {
      // Filter recent pages (use validated pages)
      const validatedRecent = this.validateStoredPages(this.recentPages);
      const filteredRecent = validatedRecent.filter(
        (page) =>
          page.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          page.path.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (page.description &&
            page.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
      );
      this.filteredPages = filteredRecent;
      this.selectedIndex = 0;
      this.renderRecentResults();
      this.updateSelectedResult();
    } else {
      // Filter all pages
      this.filterPages();
    }
  }

  private filterPages(): void {
    const query = this.searchQuery.trim();
    const lowerQuery = query.toLowerCase();

    if (!query) {
      this.filteredPages = [...this.allPages];
      this.searchResultsWithMatches = [];
    } else if (this.fuseInstance) {
      // Fuse.js is available and initialized
      const searchResults = this.fuseInstance.search(query);

      // Custom sort: exact > prefix > word-start > fuzzy score
      // This prioritizes quick navigation matches over deep fuzzy matches
      searchResults.sort((a, b) => {
        const aTitle = (a.item.title || '').toLowerCase();
        const bTitle = (b.item.title || '').toLowerCase();

        // Exact title match gets highest priority
        const aExact = aTitle === lowerQuery;
        const bExact = bTitle === lowerQuery;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;

        // Title starts with query is next priority
        const aPrefix = aTitle.startsWith(lowerQuery);
        const bPrefix = bTitle.startsWith(lowerQuery);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;

        // Word-start match (e.g., "auth" matches "OAuth Authentication")
        const aWordStart = aTitle.split(/\s+/).some((w) => w.startsWith(lowerQuery));
        const bWordStart = bTitle.split(/\s+/).some((w) => w.startsWith(lowerQuery));
        if (aWordStart && !bWordStart) return -1;
        if (bWordStart && !aWordStart) return 1;

        // Fall back to Fuse.js score (lower = better)
        return (a.score || 0) - (b.score || 0);
      });

      // Store results with matches for highlighting
      this.searchResultsWithMatches = searchResults;

      // Extract just the items after sorting
      this.filteredPages = searchResults.map((result) => result.item);
    } else {
      // Fallback to basic filtering if Fuse.js is not available
      this.filteredPages = this.allPages.filter((page) => {
        const title = (page.title || '').toLowerCase();
        const path = (page.path || '').toLowerCase();
        const description = (page.description || '').toLowerCase();

        return (
          title.includes(lowerQuery) || path.includes(lowerQuery) || description.includes(lowerQuery)
        );
      });
    }

    this.selectedIndex = 0;
    this.renderResults();
    this.updateSelectedResult();

    // Announce result count for screen readers
    const count = this.filteredPages.length;
    this.announce(count === 0 ? 'No results found' : `${count} result${count === 1 ? '' : 's'} found`);
  }

  private updateSelectedResult(): void {
    const container = this.getActiveResultsContainer();
    if (!container) return;

    // Remove selection from all items in the active container
    const items = container.querySelectorAll('.telescope__result-item');
    items.forEach((item) => {
      item.classList.remove('telescope__result-item--selected');
      item.setAttribute('aria-selected', 'false');
    });

    // Add selection to current item within the active container
    const selectedItem = container.querySelector(`[data-index="${this.selectedIndex}"]`);
    if (selectedItem) {
      selectedItem.classList.add('telescope__result-item--selected');
      selectedItem.setAttribute('aria-selected', 'true');

      // Update aria-activedescendant on the input
      const itemId = selectedItem.id || `telescope-option-${this.selectedIndex}`;
      selectedItem.id = itemId;
      if (this.searchInputElement) {
        this.searchInputElement.setAttribute('aria-activedescendant', itemId);
      }

      // Scroll into view if needed
      selectedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  private getCompletePath(path: string): string {
    // This includes protocol, domain, and port
    const origin = this.currentOrigin || window.location.origin;

    // Get the base path from the config or use a default
    const basePath = (import.meta.env.BASE_URL || '').replace(/\/$/, '');

    // Include locale if present (pages.json paths don't include locale prefix)
    const localeSegment = this.currentLocale ? `/${this.currentLocale}` : '';

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${origin}${basePath}${localeSegment}${normalizedPath}`;
  }

  private navigateToPage(partialPath: string): void {
    const page = this.allPages.find((p) => p.path === partialPath);
    if (page) {
      this.saveRecentPage(page);
    }
    this.close();

    const path = this.getCompletePath(partialPath);
    window.location.href = path;
  }

  public open(): void {
    // Query dialog fresh (handles multiple instances)
    const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement | null;
    if (!dialog || dialog.open) return;

    this.isOpen = true;
    this.searchQuery = '';
    this.selectedIndex = 0;
    this.filteredPages = [...this.allPages];

    dialog.showModal();
    this.switchTab('search');

    // Render initial content
    this.renderRecentResults();
    this.renderSearchResults();

    // Ensure first item is selected with proper ARIA
    this.updateSelectedResult();

    // Focus the search input
    requestAnimationFrame(() => {
      const input = document.getElementById('telescope-search-input') as HTMLInputElement | null;
      input?.focus();
      if (input) {
        input.value = '';
      }
    });

    this.announce('Search dialog opened');
  }

  public close(): void {
    // Check actual dialog state, not internal flag (handles multiple instances)
    const dialog = document.getElementById('telescope-dialog') as HTMLDialogElement | null;
    if (!dialog?.open) return;

    this.isOpen = false;
    dialog.close();

    // Clear aria-activedescendant
    const input = document.getElementById('telescope-search-input');
    if (input) {
      input.setAttribute('aria-activedescendant', '');
    }
  }

  private renderResults(): void {
    if (!this.resultsContainerElement) return;

    // Clear current results
    this.resultsContainerElement.innerHTML = '';

    // Use a running index counter for sequential indexing
    let currentIndex = 0;

    // Use validated pages to prevent showing pages from other sites
    const validatedRecent = this.validateStoredPages(this.recentPages);

    // Show recent pages if no search query
    if (!this.searchQuery.trim() && validatedRecent.length > 0) {
      this.resultsContainerElement.appendChild(
        this.createSectionHeader('Recently Visited', () => this.clearRecentPages())
      );

      validatedRecent.forEach((page) => {
        const listItem = this.createResultItem(page, currentIndex);
        this.resultsContainerElement!.appendChild(listItem);
        currentIndex++;
      });
    }

    if (this.filteredPages.length === 0) {
      // Show no results message
      const noResults = document.createElement('li');
      noResults.className = 'telescope__no-results';
      noResults.setAttribute('role', 'presentation');
      noResults.textContent = 'No pages found matching your search';
      this.resultsContainerElement.appendChild(noResults);
      return;
    }

    // Limit results to maxResults for performance
    const maxResults = this.config.maxResults;
    const hasMoreResults = this.filteredPages.length > maxResults;
    const displayResults = this.filteredPages.slice(0, maxResults);

    // Append items directly to the ul (no nested ul)
    displayResults.forEach((page) => {
      const listItem = this.createResultItem(page, currentIndex);
      this.resultsContainerElement!.appendChild(listItem);
      currentIndex++;
    });

    // Show indicator when results are truncated
    if (hasMoreResults) {
      const indicator = document.createElement('li');
      indicator.className = 'telescope__more-results';
      indicator.setAttribute('role', 'presentation');
      indicator.textContent = `Showing ${maxResults} of ${this.filteredPages.length} results. Refine your search to see more.`;
      this.resultsContainerElement!.appendChild(indicator);
    }
  }

  private createResultItem(page: TelescopePage, index: number): HTMLLIElement {
    const listItem = document.createElement('li');
    const itemId = `telescope-option-${index}`;

    listItem.id = itemId;
    listItem.className = `telescope__result-item${index === this.selectedIndex ? ' telescope__result-item--selected' : ''}`;
    listItem.setAttribute('role', 'option');
    listItem.setAttribute('aria-selected', index === this.selectedIndex ? 'true' : 'false');
    listItem.setAttribute('data-index', String(index));
    listItem.setAttribute('data-path', page.path);

    // Add pin button
    const isPinned = this.isPagePinned(page.path);
    const pinButton = document.createElement('button');
    pinButton.className = `telescope__pin-button${isPinned ? ' telescope__pin-button--pinned' : ''}`;
    pinButton.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path>
                </svg>`;
    pinButton.title = isPinned ? 'Unpin page' : 'Pin page';

    // Stop event propagation to prevent navigation and flickering
    pinButton.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.togglePinPage(page);
    });

    // Prevent hover events from bubbling and causing flickering
    pinButton.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
    });

    pinButton.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
    });

    // Single row content
    const contentRow = document.createElement('div');
    contentRow.className = 'telescope__result-content-row';

    // Get matches for highlighting (only if there's an active search query)
    const matches = this.searchQuery.trim() ? this.getMatchesForPage(page) : undefined;

    // Title (with highlighting if matches exist)
    const titleDiv = document.createElement('div');
    titleDiv.className = 'telescope__result-title';
    titleDiv.innerHTML = this.highlightMatches(page.title || '', matches, 'title');

    contentRow.appendChild(titleDiv);

    // Description (if available, with highlighting if matches exist)
    if (page.description) {
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'telescope__result-description';
      descriptionDiv.innerHTML = this.highlightMatches(page.description, matches, 'description');
      contentRow.appendChild(descriptionDiv);
    }

    // Tags (if available)
    if (page.tags && page.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'telescope__result-tags';

      page.tags.forEach((tag) => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'telescope__tag';
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });

      contentRow.appendChild(tagsDiv);
    }

    // Add content row to list item
    listItem.appendChild(contentRow);
    listItem.appendChild(pinButton);

    // Add event listeners
    listItem.addEventListener('click', () => {
      this.navigateToPage(page.path);
    });

    listItem.addEventListener('mouseenter', () => {
      this.selectedIndex = index;
      this.updateSelectedResult();
    });

    return listItem;
  }

  private switchTab(tabName: 'search' | 'recent'): void {
    this.currentTab = tabName;
    this.selectedIndex = 0;

    // Update tab buttons
    this.tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('telescope__tab--active', isActive);
    });

    // Update sections
    document.querySelectorAll('.telescope__section').forEach((section) => {
      section.classList.toggle('telescope__section--active', section.id === `telescope-${tabName}-section`);
    });

    // Update search input placeholder
    if (this.searchInputElement) {
      this.searchInputElement.placeholder =
        tabName === 'recent' ? 'Filter recent pages...' : 'Search pages...';
    }

    // Render appropriate content
    if (tabName === 'recent') {
      this.renderRecentResults();
    } else {
      this.renderSearchResults();
    }

    // Update selection after rendering
    this.updateSelectedResult();
  }

  private renderRecentResults(): void {
    if (!this.recentResultsContainerElement) return;

    this.recentResultsContainerElement.innerHTML = '';

    // Use filtered pages if there's a search query, otherwise show all validated recent pages
    const pagesToRender = this.searchQuery.trim()
      ? this.filteredPages
      : this.validateStoredPages(this.recentPages);

    if (pagesToRender.length === 0) {
      const noResults = document.createElement('li');
      noResults.className = 'telescope__no-results';
      noResults.setAttribute('role', 'presentation');
      noResults.textContent = this.searchQuery.trim()
        ? 'No pages found matching your search'
        : 'No recently visited pages';
      this.recentResultsContainerElement.appendChild(noResults);
      return;
    }

    // Append items directly to the ul (no nested ul)
    pagesToRender.forEach((page, index) => {
      const listItem = this.createResultItem(page, index);
      this.recentResultsContainerElement!.appendChild(listItem);
    });
  }

  private createSectionHeader(text: string, onClear?: () => void): HTMLLIElement {
    const header = document.createElement('li');
    header.className = 'telescope__section-separator';
    header.setAttribute('role', 'presentation');

    const title = document.createElement('span');
    title.textContent = text;
    header.appendChild(title);

    if (onClear) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'telescope__clear-btn';
      clearBtn.textContent = 'Clear';
      clearBtn.setAttribute('aria-label', `Clear ${text.toLowerCase()}`);
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClear();
      });
      header.appendChild(clearBtn);
    }

    return header;
  }

  private renderSearchResults(): void {
    if (!this.resultsContainerElement) return;

    this.resultsContainerElement.innerHTML = '';

    // Use validated pages to prevent showing pages from other sites
    const validatedPinned = this.validateStoredPages(this.pinnedPages);
    const validatedRecent = this.validateStoredPages(this.recentPages);

    // Show pinned pages section
    if (validatedPinned.length > 0) {
      this.resultsContainerElement.appendChild(
        this.createSectionHeader('Pinned Pages', () => this.clearPinnedPages())
      );

      validatedPinned.forEach((page, index) => {
        const listItem = this.createResultItem(page, index);
        this.resultsContainerElement!.appendChild(listItem);
      });
    }

    // Show recent pages section
    if (validatedRecent.length > 0) {
      this.resultsContainerElement.appendChild(
        this.createSectionHeader('Recently Visited', () => this.clearRecentPages())
      );

      // Get recent pages that aren't pinned
      const nonPinnedRecent = validatedRecent.filter((page) => !this.isPagePinned(page.path));
      const pinnedCount = validatedPinned.length;

      nonPinnedRecent.slice(0, this.config.recentPagesCount).forEach((page, index) => {
        const realIndex = pinnedCount + index;
        const listItem = this.createResultItem(page, realIndex);
        this.resultsContainerElement!.appendChild(listItem);
      });
    }

    // Filter out pinned and recent pages from search results to avoid duplicates
    const pinnedPaths = validatedPinned.map((p) => p.path);
    const recentPaths = validatedRecent.map((p) => p.path);
    const filteredResults = this.filteredPages.filter(
      (page) => !pinnedPaths.includes(page.path) && !recentPaths.includes(page.path)
    );

    // Add search results separator if we have other sections
    if ((validatedRecent.length > 0 || validatedPinned.length > 0) && filteredResults.length > 0) {
      this.resultsContainerElement.appendChild(this.createSectionHeader('Search Results'));
    }

    // Show search results or no results message
    if (filteredResults.length === 0 && validatedPinned.length === 0 && validatedRecent.length === 0) {
      const noResults = document.createElement('li');
      noResults.className = 'telescope__no-results';
      noResults.setAttribute('role', 'presentation');
      noResults.textContent = 'No pages found matching your search';
      this.resultsContainerElement.appendChild(noResults);
      return;
    }

    const pinnedCount = validatedPinned.length;
    const recentCount = Math.min(
      validatedRecent.filter((p) => !this.isPagePinned(p.path)).length,
      this.config.recentPagesCount
    );

    // Limit results to maxResults for performance
    const maxResults = this.config.maxResults;
    const hasMoreResults = filteredResults.length > maxResults;
    const displayResults = filteredResults.slice(0, maxResults);

    displayResults.forEach((page, index) => {
      const realIndex = pinnedCount + recentCount + index;
      const listItem = this.createResultItem(page, realIndex);
      this.resultsContainerElement!.appendChild(listItem);
    });

    // Show indicator when results are truncated
    if (hasMoreResults) {
      const indicator = document.createElement('li');
      indicator.className = 'telescope__more-results';
      indicator.setAttribute('role', 'presentation');
      indicator.textContent = `Showing ${maxResults} of ${filteredResults.length} results. Refine your search to see more.`;
      this.resultsContainerElement!.appendChild(indicator);
    }
  }

  private selectCurrentItem(): void {
    // Get the currently selected item directly from the DOM
    const selectedItem = document.querySelector('.telescope__result-item--selected');

    if (selectedItem && selectedItem.hasAttribute('data-path')) {
      // Navigate to the page using the path stored in the data-path attribute
      const path = selectedItem.getAttribute('data-path');
      if (path) {
        this.navigateToPage(path);
      }
    }
  }

  private announce(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
      // Force reflow to ensure screen readers pick up the change
      void this.liveRegion.offsetHeight;
      this.liveRegion.textContent = message;
    }
  }
}
