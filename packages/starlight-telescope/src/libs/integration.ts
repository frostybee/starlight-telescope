import type { AstroIntegration } from 'astro';
import type { TelescopeConfig } from '../schemas/config.js';
import { fileURLToPath } from 'node:url';
import { vitePluginTelescopeConfig } from './vite.js';

export default function starlightTelescopeIntegration(
  config: TelescopeConfig
): AstroIntegration {
  return {
    name: 'starlight-telescope-integration',
    hooks: {
      'astro:config:setup': ({ injectRoute, injectScript, updateConfig }) => {
        // 1. Register Vite plugin for virtual module
        updateConfig({
          vite: { plugins: [vitePluginTelescopeConfig(config)] },
        });

        // 2. Inject locale-aware /pages.json route
        // Using [...locale] rest parameter handles both localized (/en/pages.json)
        // and non-localized (/pages.json) paths in a single route
        injectRoute({
          pattern: '/[...locale]/pages.json',
          entrypoint: fileURLToPath(new URL('../pages/pages.json.ts', import.meta.url)),
        });

        // 3. Inject CSS - uses Vite's CSS optimization pipeline
        // Normalize path to forward slashes for cross-platform compatibility in JS imports
        const cssPath = fileURLToPath(new URL('../styles/telescope.css', import.meta.url)).replace(/\\/g, '/');
        injectScript('page-ssr', `import '${cssPath}';`);

        // 4. Inject client-side script with custom element
        // Use base64 encoding for safe config transport (avoids XSS via string escaping)
        const configBase64 = Buffer.from(JSON.stringify(config)).toString('base64');

        injectScript(
          'page',
          `
          import 'starlight-telescope/libs/telescope-element';

          let initInProgress = false;

          function initTelescope() {
            // Prevent race conditions with initialization lock
            if (window.__telescopeInitialized || initInProgress) return;
            initInProgress = true;

            try {
              // Inject custom element into header
              if (!document.querySelector('telescope-search')) {
                const rightGroup = document.querySelector('.right-group');
                if (rightGroup) {
                  const el = document.createElement('telescope-search');
                  // Decode base64 config safely
                  const configJson = atob('${configBase64}');
                  el.setAttribute('data-config', configJson);
                  rightGroup.insertAdjacentElement('afterbegin', el);
                }
              }
              window.__telescopeInitialized = true;
            } finally {
              initInProgress = false;
            }
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTelescope);
          } else {
            initTelescope();
          }

          document.addEventListener('astro:page-load', () => {
            window.__telescopeInitialized = false;
            initTelescope();
          });
        `
        );
      },

      'astro:build:done': ({ logger }) => {
        logger.info('Starlight Telescope plugin installed successfully!');
      },
    },
  };
}
