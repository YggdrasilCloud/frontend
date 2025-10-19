<script lang="ts">
	import type { FolderDto } from '$lib/api/types';
	import FolderTreeItem from './FolderTreeItem.svelte';
	import { writable } from 'svelte/store';

	export let folders: FolderDto[];
	export let currentFolderId: string = '';

	// Store for tracking which folders are expanded
	const expandedFolders = writable<Set<string>>(new Set());

	// Build hierarchy from flat list - return only root folders
	function getRootFolders(folders: FolderDto[]): FolderDto[] {
		return folders.filter((folder) => !folder.parentId);
	}

	// Get children of a specific folder
	function getChildren(folderId: string): FolderDto[] {
		return folders.filter((folder) => folder.parentId === folderId);
	}

	// Toggle folder expansion
	function toggleExpand(folderId: string) {
		expandedFolders.update((set) => {
			const newSet = new Set(set);
			if (newSet.has(folderId)) {
				newSet.delete(folderId);
			} else {
				newSet.add(folderId);
			}
			return newSet;
		});
	}

	$: rootFolders = getRootFolders(folders);
</script>

<div class="folder-tree">
	{#each rootFolders as folder}
		<FolderTreeItem
			{folder}
			{currentFolderId}
			depth={0}
			{expandedFolders}
			{toggleExpand}
			{getChildren}
		/>
	{/each}
</div>

<style>
	.folder-tree {
		display: flex;
		flex-direction: column;
	}
</style>
