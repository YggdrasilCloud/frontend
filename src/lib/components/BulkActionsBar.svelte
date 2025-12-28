<script lang="ts">
	import { photoSelection } from '$lib/stores/photoSelection.svelte';

	interface Props {
		onDelete: () => void;
		isDeleting: boolean;
	}

	let { onDelete, isDeleting }: Props = $props();
</script>

{#if photoSelection.isSelectionMode}
	<div class="bulk-actions-bar">
		<div class="selection-info">
			<span class="count">{photoSelection.selectedCount} selected</span>
			<button class="btn-clear" onclick={() => photoSelection.clear()}>Clear selection</button>
		</div>
		<div class="actions">
			<button class="btn-delete" onclick={onDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete Selected'}
			</button>
			<span class="drag-hint">Drag to a folder to move</span>
		</div>
	</div>
{/if}

<style>
	.bulk-actions-bar {
		position: fixed;
		bottom: 0;
		left: var(--sidebar-width);
		right: 0;
		background: var(--color-bg-alt);
		border-top: 1px solid var(--color-border);
		padding: var(--spacing-md) var(--spacing-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 100;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.count {
		font-weight: 600;
		color: var(--color-text);
	}

	.btn-clear {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		text-decoration: underline;
		font-size: 0.9rem;
	}

	.btn-clear:hover {
		color: var(--color-text);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.btn-delete {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: #dc3545;
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-weight: 500;
	}

	.btn-delete:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-delete:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.drag-hint {
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		font-style: italic;
	}
</style>
