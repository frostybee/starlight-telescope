import type { Plugin as VitePlugin } from 'vite';
import type { TelescopeConfig } from '../schemas/config.js';

export function vitePluginTelescopeConfig(config: TelescopeConfig): VitePlugin {
  const VIRTUAL_ID = 'virtual:starlight-telescope-config';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;

  return {
    name: 'vite-plugin-starlight-telescope',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}
