import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTelescope from 'starlight-telescope'
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
  site: 'https://frostybee.github.io',
  base: '/starlight-telescope',  
  integrations: [
    starlight({
      title: 'Starlight Telescope',
      defaultLocale: 'root',
      favicon: '/images/favicon.svg',
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
      plugins: [
        starlightTelescope(), 
        starlightLinksValidator({
          errorOnFallbackPages: false,
          errorOnInconsistentLocale: true
        })
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: ['overview', 'getting-started', 'configuration'],
        },
        {
          label: 'Guides',
          items: [
            'guides/keyboard-shortcuts',
            'guides/features',
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
    }),
  ],
})
