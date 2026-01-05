<script lang="ts">
	import type { FolderDto } from '$lib/api/types';
	import type { Writable } from 'svelte/store';
	import FolderTreeItem from './FolderTreeItem.svelte';

	export let folders: FolderDto[];
	export let currentFolderId: string = '';
	export let expandedFolders: Writable<Set<string>>;
	export let toggleExpand: (folderId: string) => void;
	export let expandFolder: (folderId: string) => void;
	export let onPhotoDrop: ((targetFolderId: string) => void) | undefined = undefined;
	export let onFolderDrop: ((folderId: string, targetFolderId: string | null) => void) | undefined =
		undefined;
	export let onContextMenu: ((folder: FolderDto, x: number, y: number) => void) | undefined =
		undefined;

	// Build hierarchy from flat list - return only root folders
	function getRootFolders(folders: FolderDto[]): FolderDto[] {
		return folders.filter((folder) => !folder.parentId);
	}

	// Get children of a specific folder
	function getChildren(folderId: string): FolderDto[] {
		return folders.filter((folder) => folder.parentId === folderId);
	}

	$: rootFolders = getRootFolders(folders);

	let isRootDragOver = false;

	function handleRootDragOver(event: DragEvent) {
		if (!event.dataTransfer?.types.includes('application/x-folder-id')) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		isRootDragOver = true;
	}

	function handleRootDragLeave() {
		isRootDragOver = false;
	}

	function handleRootDrop(event: DragEvent) {
		event.preventDefault();
		isRootDragOver = false;

		const folderId = event.dataTransfer?.getData('application/x-folder-id');
		if (folderId && onFolderDrop) {
			// Move to root (null parent)
			onFolderDrop(folderId, null);
		}
	}
</script>

<div class="folder-tree">
	{#each rootFolders as folder}
		<FolderTreeItem
			{folder}
			{currentFolderId}
			depth={0}
			{expandedFolders}
			{toggleExpand}
			{expandFolder}
			{getChildren}
			{onPhotoDrop}
			{onFolderDrop}
			{onContextMenu}
		/>
	{/each}

	{#if onFolderDrop}
		<div
			class="root-drop-zone"
			class:drag-over={isRootDragOver}
			on:dragover={handleRootDragOver}
			on:dragleave={handleRootDragLeave}
			on:drop={handleRootDrop}
			role="region"
			aria-label="Drop zone for moving folders to root"
		>
			<span class="drop-hint">Drop here to move to root</span>
		</div>
	{/if}
</div>

<style>
	.folder-tree {
		display: flex;
		flex-direction: column;
	}

	.root-drop-zone {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-sm);
		text-align: center;
		opacity: 0.5;
		transition:
			opacity 0.2s,
			background-color 0.2s,
			border-color 0.2s;
	}

	.root-drop-zone:hover {
		opacity: 0.8;
	}

	.root-drop-zone.drag-over {
		opacity: 1;
		background-color: var(--color-bg);
		border-color: var(--color-primary);
		border-width: 2px;
		padding: calc(var(--spacing-sm) - 1px);
	}

	.drop-hint {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.root-drop-zone.drag-over .drop-hint {
		color: var(--color-primary);
		font-weight: 500;
	}
</style>
