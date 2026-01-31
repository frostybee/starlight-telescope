# starlight-telescope

## 0.2.0

### Minor Changes

- c8a9cc5: Fix draft pages in search, CSS loading on static hosts, and Mac shortcut

  ## Bug Fixes

  - Fixed 404 errors for draft pages in search results. Pages with draft: true in their frontmatter are now excluded from the search index.
  - Fixed CSS not loading on GitHub Pages: Changed CSS injection method to use Vite's build pipeline, ensuring styles load correctly on static hosting.
  - Fixed activation shortcut on Mac: Search modal keyboard shortcut now works properly on macOS.

## 0.1.1

### Patch Changes

- 8e4a679: Fix issue with the CSS style not being loaded

## 0.1.0

### Minor Changes

- 0810c35: Initial public release
