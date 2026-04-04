import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    tailwind(),
    auth()
  ]
});