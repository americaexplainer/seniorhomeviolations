import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://seniorhomeviolations.com',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap()
  ]
});
