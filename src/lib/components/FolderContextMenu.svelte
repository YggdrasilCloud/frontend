<script lang="ts">
	interface Props {
		x: number;
		y: number;
		onRename: () => void;
		onDelete: () => void;
		onClose: () => void;
	}

	let { x, y, onRename, onDelete, onClose }: Props = $props();

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.context-menu')) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	function handleRename() {
		onRename();
		onClose();
	}

	function handleDelete() {
		onDelete();
		onClose();
	}
</script>

<div class="context-menu" style="left: {x}px; top: {y}px">
	<button class="menu-item" onclick={handleRename}>
		<span class="menu-icon">✏️</span>
		<span>Rename</span>
	</button>
	<div class="menu-divider"></div>
	<button class="menu-item danger" onclick={handleDelete}>
		<span class="menu-icon">🗑️</span>
		<span>Delete</span>
	</button>
</div>

<style>
	.context-menu {
		position: fixed;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		min-width: 160px;
		padding: var(--spacing-xs);
		z-index: 1000;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text);
		text-align: left;
	}

	.menu-item:hover {
		background: var(--color-bg-alt);
	}

	.menu-item.danger {
		color: #dc3545;
	}

	.menu-item.danger:hover {
		background: rgba(220, 53, 69, 0.1);
	}

	.menu-icon {
		font-size: 1rem;
		width: 1.25rem;
		text-align: center;
	}

	.menu-divider {
		height: 1px;
		background: var(--color-border);
		margin: var(--spacing-xs) 0;
	}
</style>
