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

        // 3. Inject CSS
        injectScript('page', `import 'starlight-telescope/styles/telescope.css';`);

        // 4. Inject client-side script with custom element
        const escapedConfig = JSON.stringify(config)
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$');

        injectScript(
          'page',
          `
          import 'starlight-telescope/libs/telescope-element';

          function initTelescope() {
            if (window.__telescopeInitialized) return;
            window.__telescopeInitialized = true;

            // Inject custom element into header
            if (!document.querySelector('telescope-search')) {
              const rightGroup = document.querySelector('.right-group');
              if (rightGroup) {
                const el = document.createElement('telescope-search');
                el.setAttribute('data-config', \`${escapedConfig}\`);
                rightGroup.insertAdjacentElement('afterbegin', el);
              }
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
