import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightTelescope from 'starlight-telescope'

export default defineConfig({
  integrations: [
    starlight({
      editLink: {
        baseUrl: 'https://github.com/frostybee/starlight-telescope/edit/main/docs/',
      },
      plugins: [starlightTelescope()],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started'],
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/starlight-telescope', icon: 'github', label: 'GitHub' },
      ],
      title: 'starlight-telescope',
    }),
  ],
})
