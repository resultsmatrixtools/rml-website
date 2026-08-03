// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// PUBLIC_SITE_URL is injected at build time by DigitalOcean App Platform
// (production vs staging); fall back to the production domain locally.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://resultsmatrix.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // The privacy policy carries no search intent and the tag archives are
      // thin duplicates of the blog index — both stay crawlable but out of
      // the sitemap so it advertises only pages worth ranking.
      filter: (page) => !/\/(privacy|blog\/tags)\//.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
