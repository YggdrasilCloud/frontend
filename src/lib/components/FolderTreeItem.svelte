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

	$: children = getChildren(folder.id);
	$: hasChildren = children.length > 0;
	$: isExpanded = $expandedFolders.has(folder.id);
	$: isActive = folder.id === currentFolderId;

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
</script>

<div class="folder-tree-item">
	<a
		href="/photos/{folder.id}"
		class="folder-item"
		class:active={isActive}
		style="padding-left: {depth * 1.5 + 0.75}rem"
		on:click={handleItemClick}
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
</style>
