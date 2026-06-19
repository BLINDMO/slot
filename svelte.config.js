import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SPA mode: the hub is a client-rendered game, not a content site.
    adapter: adapter({ fallback: 'index.html' }),
    // GitHub project pages serve from /<repo>/, so build with a base path.
    // BASE_PATH is empty for local dev and set to '/slot' when publishing.
    paths: { base: process.env.BASE_PATH ?? '' },
    alias: {
      $engine: 'src/lib/engine',
      $games: 'src/lib/games',
      $store: 'src/lib/store'
    }
  }
};

export default config;
