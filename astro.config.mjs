import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://seniorhomeviolations.com',
  output: 'static',
  integrations: [
    tailwind(),
  ],
  build: {
    format: 'directory',
  },
});
