// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// PUBLIC_SITE_URL is injected at build time by DigitalOcean App Platform
// (production vs staging); fall back to the production domain locally.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://resultsmatrix.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
