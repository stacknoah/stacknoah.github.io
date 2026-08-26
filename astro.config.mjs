// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stacknoah.com',
  integrations: [react(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
