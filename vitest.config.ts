import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/lib/**/*.{js,ts}'],
			exclude: [
				'node_modules/',
				'src/**/*.spec.ts',
				'src/**/*.test.ts',
				'.svelte-kit/',
				'build/',
				'tests/',
				'*.config.{js,ts,mjs}',
				'src/routes/**', // Svelte components tested via E2E
				'src/lib/components/**', // Svelte components tested via E2E
				'src/lib/api/types.ts', // Type definitions only
				'src/lib/api/queries/**', // TanStack Query wrappers tested via E2E
				'src/lib/api/mutations/**' // TanStack Query wrappers tested via E2E
			],
			all: true,
			lines: 80,
			functions: 80,
			branches: 80,
			statements: 80
		}
	}
});
