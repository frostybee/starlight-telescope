import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTelescope from 'starlight-telescope'

export default defineConfig({
  integrations: [
    starlight({
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        fr: {
          label: 'Français',
          lang: 'fr',
        },
      },
      editLink: {
        baseUrl: 'https://github.com/frostybee/starlight-telescope/edit/main/docs/',
      },
      plugins: [starlightTelescope()],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started', 'configuration'],
        },
        {
          label: 'Guides',
          items: [
            'guides/keyboard-shortcuts',
            'guides/fuzzy-search',
            'guides/recent-pages',
            'guides/pinned-pages',
            'guides/styling',
            'guides/internationalization',
          ],
        },
        {
          label: 'Demo',
          autogenerate: { directory: 'demo' },
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-telescope', icon: 'github', label: 'GitHub' },
      ],
      title: 'starlight-telescope',
    }),
  ],
})
