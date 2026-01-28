<div align="center">
  <h1>Starlight Telescope</h1>
  <p>Quickly navigate to any page in your Starlight docs with fuzzy search and keyboard-first navigation.</p>

  [![npm version](https://badge.fury.io/js/starlight-telescope.svg)](https://badge.fury.io/js/starlight-telescope)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## Features

- Fuzzy search powered by Fuse.js for fast, typo-tolerant results
- Keyboard-first navigation with customizable shortcuts
- Pin frequently used pages for quick access
- Recent pages history for easy navigation
- Fully customizable theming and styling
- Accessible components with proper ARIA attributes
- Works seamlessly with Starlight's existing configuration

## Installation

Install the plugin using your preferred package manager:

```bash
npm install starlight-telescope
```

## Quick Start

```js
// astro.config.mjs
import starlight from '@astrojs/starlight';
import starlightTelescope from 'starlight-telescope';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightTelescope()],
    }),
  ],
});
```

## Documentation

For comprehensive documentation, installation guides, configuration options, and examples, visit the [plugin documentation](https://frostybee.github.io/starlight-telescope/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

Licensed under the MIT License, Copyright © frostybee.

See [LICENSE](/LICENSE) for more information.

## Links

- [GitHub Repository](https://github.com/frostybee/starlight-telescope)
- [npm Package](https://www.npmjs.com/package/starlight-telescope)
- [Documentation](https://frostybee.github.io/starlight-telescope/)
- [Issues](https://github.com/frostybee/starlight-telescope/issues)
