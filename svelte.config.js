import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	preprocess: vitePreprocess(),
// 	kit: {
// 		adapter: adapter()
// 	}
// };

export default defineConfig({
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	},
	plugins: [
		// the svelte plugin is required to work
		svelte(),
		svelteInspector({ enabled: true })
	]
});

// export default config;
