<script lang="ts">
	import type { FolderDto } from '$lib/api/types';
	import type { Writable } from 'svelte/store';

	export let folder: FolderDto;
	export let currentFolderId: string;
	export let depth: number = 0;
	export let expandedFolders: Writable<Set<string>>;
	export let toggleExpand: (folderId: string) => void;
	export let expandFolder: (folderId: string) => void;
	export let getChildren: (folderId: string) => FolderDto[];
	export let onPhotoDrop: ((targetFolderId: string) => void) | undefined = undefined;
	export let onFolderDrop: ((folderId: string, targetFolderId: string | null) => void) | undefined =
		undefined;
	export let onContextMenu: ((folder: FolderDto, x: number, y: number) => void) | undefined =
		undefined;

	$: children = getChildren(folder.id);
	$: hasChildren = children.length > 0;
	$: isExpanded = $expandedFolders.has(folder.id);
	$: isActive = folder.id === currentFolderId;

	let isDragOver = false;
	let isFolderDragOver = false;
	let isHovered = false;

	function handleToggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		toggleExpand(folder.id);
	}

	function handleItemClick() {
		// Expand when clicking the folder name (if it has children)
		// Never collapse - keep folders open once expanded
		// Navigation will still happen via the href
		if (hasChildren) {
			expandFolder(folder.id);
		}
	}

	function handleDragStart(event: DragEvent) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('application/x-folder-id', folder.id);
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(event: DragEvent) {
		if (!event.dataTransfer) return;

		// Accept photo drops
		if (event.dataTransfer.types.includes('application/x-photo-ids')) {
			if (folder.id === currentFolderId) return;
			event.preventDefault();
			event.dataTransfer.dropEffect = 'move';
			isDragOver = true;
			return;
		}

		// Accept folder drops (but not on self or current folder being dragged)
		if (event.dataTransfer.types.includes('application/x-folder-id')) {
			event.preventDefault();
			event.dataTransfer.dropEffect = 'move';
			isFolderDragOver = true;
		}
	}

	function handleDragLeave() {
		isDragOver = false;
		isFolderDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		isFolderDragOver = false;

		if (!event.dataTransfer) return;

		// Handle photo drop
		const photoIds = event.dataTransfer.getData('application/x-photo-ids');
		if (photoIds && onPhotoDrop && folder.id !== currentFolderId) {
			onPhotoDrop(folder.id);
			return;
		}

		// Handle folder drop
		const droppedFolderId = event.dataTransfer.getData('application/x-folder-id');
		if (droppedFolderId && onFolderDrop) {
			// Don't drop folder on itself
			if (droppedFolderId === folder.id) return;
			onFolderDrop(droppedFolderId, folder.id);
		}
	}

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (onContextMenu) {
			onContextMenu(folder, event.clientX, event.clientY);
		}
	}

	function handleMoreClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (onContextMenu) {
			const button = event.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			onContextMenu(folder, rect.right, rect.top);
		}
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<div class="folder-tree-item">
	<a
		href="/photos/{folder.id}"
		class="folder-item"
		class:active={isActive}
		class:drag-over={isDragOver || isFolderDragOver}
		style="padding-left: {depth * 1.5 + 0.75}rem"
		draggable="true"
		on:click={handleItemClick}
		on:dragstart={handleDragStart}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:contextmenu={handleContextMenu}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
	>
		{#if hasChildren}
			<button class="expand-toggle" on:click={handleToggle} aria-label="Toggle folder">
				<span class="triangle">{isExpanded ? '▼' : '▶'}</span>
			</button>
		{:else}
			<span class="no-children-spacer"></span>
		{/if}
		<span class="folder-icon">📁</span>
		<span class="folder-name">{folder.name}</span>
		{#if isHovered && onContextMenu}
			<button
				class="more-button"
				on:click={handleMoreClick}
				aria-label="Folder actions"
				title="More actions"
			>
				⋮
			</button>
		{/if}
	</a>

	{#if hasChildren && isExpanded}
		{#each children as childFolder}
			<svelte:self
				folder={childFolder}
				{currentFolderId}
				depth={depth + 1}
				{expandedFolders}
				{toggleExpand}
				{expandFolder}
				{getChildren}
				{onPhotoDrop}
				{onFolderDrop}
				{onContextMenu}
			/>
		{/each}
	{/if}
</div>

<style>
	.folder-tree-item {
		display: flex;
		flex-direction: column;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.125rem;
		border-radius: var(--radius-sm);
		color: var(--color-text);
		text-decoration: none;
		transition: background-color 0.2s;
		cursor: pointer;
		position: relative;
	}

	.folder-item:hover {
		background-color: var(--color-bg);
	}

	.folder-item.active {
		background-color: var(--color-primary);
		color: white;
	}

	.folder-item.drag-over {
		background-color: var(--color-primary);
		color: white;
		outline: 2px dashed white;
		outline-offset: -2px;
	}

	.expand-toggle {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		color: inherit;
	}

	.expand-toggle:hover .triangle {
		opacity: 0.7;
	}

	.triangle {
		font-size: 0.7rem;
		transition: transform 0.2s;
		display: block;
		line-height: 1;
	}

	.no-children-spacer {
		width: 1rem;
		flex-shrink: 0;
	}

	.folder-icon {
		flex-shrink: 0;
		font-size: 1rem;
		line-height: 1;
	}

	.folder-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.9rem;
	}

	.more-button {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: inherit;
		font-size: 1rem;
		line-height: 1;
		border-radius: var(--radius-sm);
		opacity: 0.7;
		flex-shrink: 0;
	}

	.more-button:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.1);
	}

	.folder-item.active .more-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
