import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		watch: {
			usePolling: true
		}
	},
	ssr: {
		// Externalize shaka-player for SSR (client-only library)
		noExternal: [],
		external: [
			'shaka-player',
			'shaka-player/dist/shaka-player.ui',
			'shaka-player/dist/controls.css'
		]
	},
	build: {
		rollupOptions: {
			external: [/^shaka-player/]
		}
	}
});
