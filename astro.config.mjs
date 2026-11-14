import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://convert.gudmud.site',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    preact(),
    tailwind({
      applyBaseStyles: true,
    }),
    mdx(),
  ],
  build: {
    format: 'directory',
  },
});
