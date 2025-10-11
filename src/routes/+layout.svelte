<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000, // 1 minute
				gcTime: 5 * 60_000 // 5 minutes
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<slot />
</QueryClientProvider>

<style>
	:global(:root) {
		/* Colors */
		--color-bg: #f5f5f5;
		--color-bg-alt: #ffffff;
		--color-border: #e0e0e0;
		--color-text: #333333;
		--color-text-secondary: #666666;
		--color-primary: #2563eb;
		--color-primary-hover: #1d4ed8;
		--color-error: #dc2626;
		--color-success: #16a34a;

		/* Spacing */
		--spacing-xs: 0.25rem;
		--spacing-sm: 0.5rem;
		--spacing-md: 1rem;
		--spacing-lg: 1.5rem;
		--spacing-xl: 2rem;

		/* Border radius */
		--radius-sm: 4px;
		--radius-md: 8px;
		--radius-lg: 12px;

		/* Sidebar */
		--sidebar-width: 280px;

		/* Shadows */
		--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
		--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		background: var(--color-bg);
		color: var(--color-text);
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
