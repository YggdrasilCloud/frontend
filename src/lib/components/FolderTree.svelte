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

	// Build hierarchy from flat list - return only root folders
	function getRootFolders(folders: FolderDto[]): FolderDto[] {
		return folders.filter((folder) => !folder.parentId);
	}

	// Get children of a specific folder
	function getChildren(folderId: string): FolderDto[] {
		return folders.filter((folder) => folder.parentId === folderId);
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
			{expandFolder}
			{getChildren}
			{onPhotoDrop}
		/>
	{/each}
</div>

<style>
	.folder-tree {
		display: flex;
		flex-direction: column;
	}
</style>
