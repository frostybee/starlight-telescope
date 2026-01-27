import type { StarlightPlugin } from '@astrojs/starlight/types';
import { TelescopeConfigSchema, type TelescopeUserConfig } from './src/schemas/config.js';
import starlightTelescopeIntegration from './src/libs/integration.js';

export type {
  TelescopeConfig,
  TelescopeUserConfig,
  TelescopePage,
  TelescopeShortcut,
  TelescopeFuseOptions,
  TelescopeTheme,
} from './src/schemas/config.js';

export default function starlightTelescope(
  userConfig: TelescopeUserConfig = {}
): StarlightPlugin {
  const config = TelescopeConfigSchema.parse(userConfig);

  return {
    name: 'starlight-telescope',
    hooks: {
      'config:setup'({ addIntegration, logger }) {
        logger.info('Initializing Starlight Telescope search...');
        addIntegration(starlightTelescopeIntegration(config));
      },
    },
  };
}
