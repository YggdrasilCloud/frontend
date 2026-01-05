<script lang="ts">
	import { foldersQuery } from '$lib/api/queries/folders';
	import { createFolderMutation } from '$lib/api/mutations/createFolder';
	import { renameFolderMutation, deleteFolderMutation } from '$lib/api/mutations/folderOperations';
	import FolderContextMenu from '$lib/components/FolderContextMenu.svelte';
	import RenameDialog from '$lib/components/RenameDialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { DateFormatter } from '$lib/domain/shared/DateFormatter';
	import { ApiErrorFormatter } from '$lib/domain/error/ApiErrorFormatter';
	import { FolderNameValidator } from '$lib/domain/folder/FolderNameValidator';
	import { UploadConfiguration } from '$lib/domain/shared/UploadConfiguration';
	import type { FolderDto } from '$lib/api/types';

	const folders = foldersQuery({}, 1, 1000);
	const createFolder = createFolderMutation();
	const renameFolder = renameFolderMutation();
	const deleteFolder = deleteFolderMutation();

	// Context menu state
	let contextMenu = $state<{ folder: FolderDto; x: number; y: number } | null>(null);

	// Rename dialog state
	let renameDialogOpen = $state(false);
	let folderToRename = $state<FolderDto | null>(null);

	// Delete dialog state
	let deleteDialogOpen = $state(false);
	let folderToDelete = $state<FolderDto | null>(null);

	function handleContextMenu(event: MouseEvent, folder: FolderDto) {
		event.preventDefault();
		contextMenu = { folder, x: event.clientX, y: event.clientY };
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	function openRenameDialog() {
		if (!contextMenu) return;
		folderToRename = contextMenu.folder;
		renameDialogOpen = true;
		closeContextMenu();
	}

	function openDeleteDialog() {
		if (!contextMenu) return;
		folderToDelete = contextMenu.folder;
		deleteDialogOpen = true;
		closeContextMenu();
	}

	async function handleRenameConfirm(newName: string) {
		if (!folderToRename) return;

		const sanitizedName = FolderNameValidator.sanitize(newName);
		const validation = FolderNameValidator.validate(sanitizedName);
		if (!validation.isValid) {
			alert(validation.error);
			return;
		}

		try {
			await $renameFolder.mutateAsync({
				folderId: folderToRename.id,
				name: sanitizedName
			});
			renameDialogOpen = false;
			folderToRename = null;
		} catch (error) {
			console.error('Failed to rename folder:', error);
			alert('Failed to rename folder');
		}
	}

	function handleRenameCancel() {
		renameDialogOpen = false;
		folderToRename = null;
	}

	async function handleDeleteConfirm() {
		if (!folderToDelete) return;

		try {
			await $deleteFolder.mutateAsync({
				folderId: folderToDelete.id,
				recursive: true
			});
			deleteDialogOpen = false;
			folderToDelete = null;
		} catch (error) {
			console.error('Failed to delete folder:', error);
			alert('Failed to delete folder');
		}
	}

	function handleDeleteCancel() {
		deleteDialogOpen = false;
		folderToDelete = null;
	}

	// Reactive computations using domain services
	const errorMessage = $derived(
		$folders.isError ? ApiErrorFormatter.formatError($folders.error) : ''
	);

	async function handleNewFolder() {
		const name = prompt('Enter folder name:');
		if (!name) return;

		// Sanitize first (trim whitespace, clean forbidden chars)
		const sanitizedName = FolderNameValidator.sanitize(name);

		// Then validate the sanitized name
		const validation = FolderNameValidator.validate(sanitizedName);
		if (!validation.isValid) {
			alert(validation.error);
			return;
		}

		try {
			await $createFolder.mutateAsync({
				name: sanitizedName,
				ownerId: UploadConfiguration.DEFAULT_OWNER_ID
			});
			// Folder list will refresh automatically via TanStack Query invalidation
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to create folder';
			alert(`Error: ${errorMsg}`);
			console.error('Failed to create folder:', error);
		}
	}

	function formatCreationDate(isoDate: string): string {
		return DateFormatter.toLocaleDateString(isoDate);
	}
</script>

<div class="photos-home">
	<header class="header">
		<h1>Photo Manager</h1>
		<button class="btn-new-folder" onclick={handleNewFolder} disabled={$createFolder.isPending}>
			{$createFolder.isPending ? 'Creating...' : '+ New Folder'}
		</button>
	</header>

	<main class="content">
		{#if $folders.isLoading}
			<p class="status-message">Loading folders...</p>
		{:else if $folders.isError}
			<div class="welcome">
				<h2>Welcome to YggdrasilCloud!</h2>
				<p>Get started by creating your first folder to organize your photos.</p>
				<button class="btn-create-first" onclick={handleNewFolder}>
					📁 Create Your First Folder
				</button>
				<details class="error-details">
					<summary>Technical details</summary>
					<p class="error-message">
						{errorMessage}
					</p>
				</details>
			</div>
		{:else if $folders.data}
			{#if $folders.data.data.length === 0}
				<div class="welcome">
					<h2>Welcome to YggdrasilCloud!</h2>
					<p>Get started by creating your first folder to organize your photos.</p>
					<button class="btn-create-first" onclick={handleNewFolder}>
						📁 Create Your First Folder
					</button>
				</div>
			{:else}
				<div class="folders-grid">
					{#each $folders.data.data as folder}
						<a
							href="/photos/{folder.id}"
							class="folder-card"
							oncontextmenu={(e) => handleContextMenu(e, folder)}
						>
							<div class="folder-icon">📁</div>
							<div class="folder-info">
								<h3>{folder.name}</h3>
								<p class="folder-date">Created {formatCreationDate(folder.createdAt)}</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{/if}
	</main>
</div>

{#if contextMenu}
	<FolderContextMenu
		x={contextMenu.x}
		y={contextMenu.y}
		onRename={openRenameDialog}
		onDelete={openDeleteDialog}
		onClose={closeContextMenu}
	/>
{/if}

<RenameDialog
	open={renameDialogOpen}
	currentName={folderToRename?.name ?? ''}
	onConfirm={handleRenameConfirm}
	onCancel={handleRenameCancel}
/>

<ConfirmDialog
	open={deleteDialogOpen}
	title="Delete Folder"
	message={`Are you sure you want to delete "${folderToDelete?.name}"? This will permanently delete all photos and subfolders inside.`}
	confirmLabel="Delete"
	cancelLabel="Cancel"
	danger={true}
	onConfirm={handleDeleteConfirm}
	onCancel={handleDeleteCancel}
/>

<style>
	.photos-home {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: var(--spacing-xl);
		background: var(--color-bg-alt);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.header h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-text);
	}

	.btn-new-folder {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-new-folder:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-new-folder:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.content {
		flex: 1;
		padding: var(--spacing-xl);
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
	}

	.status-message {
		text-align: center;
		color: var(--color-text-secondary);
		padding: var(--spacing-xl);
		font-size: 1rem;
	}

	.welcome {
		text-align: center;
		padding: var(--spacing-xl) 0;
		max-width: 600px;
		margin: 0 auto;
	}

	.welcome h2 {
		font-size: 2.5rem;
		color: var(--color-text);
		margin-bottom: var(--spacing-md);
	}

	.welcome p {
		font-size: 1.1rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xl);
	}

	.btn-create-first {
		padding: var(--spacing-md) var(--spacing-xl);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-create-first:hover {
		background: var(--color-primary-hover);
	}

	.folders-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--spacing-lg);
	}

	.folder-card {
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.folder-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.folder-icon {
		font-size: 3rem;
		line-height: 1;
	}

	.folder-info {
		flex: 1;
		min-width: 0;
	}

	.folder-info h3 {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: 1.25rem;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.folder-date {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.error-details {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.error-details summary {
		cursor: pointer;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.error-details summary:hover {
		color: var(--color-text);
	}

	.error-message {
		margin-top: var(--spacing-sm);
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		line-height: 1.5;
	}
</style>
