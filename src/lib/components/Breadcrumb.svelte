<script lang="ts">
	import type { PathSegmentDto } from '$lib/api/types';

	export let path: PathSegmentDto[] = [];
</script>

{#if path.length > 0}
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<ol>
			{#each path as segment, index}
				<li>
					{#if index < path.length - 1}
						<a href="/photos/{segment.id}">{segment.name}</a>
						<span class="separator">/</span>
					{:else}
						<span class="current">{segment.name}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb {
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-bg-alt);
		border-bottom: 1px solid var(--color-border);
	}

	ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	a {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.95rem;
		transition: color 0.2s;
	}

	a:hover {
		color: var(--color-primary-hover);
		text-decoration: underline;
	}

	.separator {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		user-select: none;
	}

	.current {
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 500;
	}
</style>
