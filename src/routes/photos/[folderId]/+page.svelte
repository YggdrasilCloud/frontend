<script lang="ts">
	import { page } from '$app/stores';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { foldersQuery } from '$lib/api/queries/folders';
	import { photosQuery } from '$lib/api/queries/photos';
	import { createFolderMutation } from '$lib/api/mutations/createFolder';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { env } from '$env/dynamic/public';
	import type { PhotoDto } from '$lib/api/types';
	import { PhotoUrlBuilder } from '$lib/domain/photo/PhotoUrlBuilder';
	import { PhotoFileSizeFormatter } from '$lib/domain/photo/PhotoFileSizeFormatter';
	import { FolderNameValidator } from '$lib/domain/folder/FolderNameValidator';
	import { UploadConfiguration } from '$lib/domain/shared/UploadConfiguration';

	$: folderId = $page.params.folderId;
	$: folders = foldersQuery();
	$: photos = photosQuery(folderId, 1, 50);

	const createFolder = createFolderMutation();
	const queryClient = useQueryClient();

	// Initialize domain services
	const apiBaseUrl = env.PUBLIC_API_URL || 'http://localhost:8888';
	const photoUrlBuilder = new PhotoUrlBuilder(apiBaseUrl);

	// Build upload endpoint using domain service
	$: uploadEndpoint = UploadConfiguration.buildUploadEndpoint(apiBaseUrl, folderId);

	let showUploader = false;
	let selectedPhoto: PhotoDto | null = null;

	async function handleNewFolder() {
		const name = prompt('Enter folder name:');
		if (!name) return;

		// Validate folder name using domain service
		const validation = FolderNameValidator.validate(name);
		if (!validation.isValid) {
			alert(validation.error);
			return;
		}

		// Use sanitized name
		const sanitizedName = FolderNameValidator.sanitize(name);

		try {
			await $createFolder.mutateAsync({
				name: sanitizedName,
				ownerId: UploadConfiguration.DEFAULT_OWNER_ID
			});
			alert(`Folder "${sanitizedName}" created successfully!`);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to create folder';
			alert(`Error: ${errorMsg}`);
			console.error('Failed to create folder:', error);
		}
	}

	function handleUploadComplete(event: CustomEvent) {
		const { successful, failed } = event.detail;
		console.log(`✅ ${successful.length} files uploaded`);
		if (failed.length > 0) {
			console.error(`❌ ${failed.length} files failed`);
		}
		// Invalidate photos cache to refresh the list
		queryClient.invalidateQueries({ queryKey: ['photos', folderId] });
		showUploader = false;
	}

	function getImageUrl(photo: PhotoDto): string {
		return photoUrlBuilder.buildDisplayUrl(photo);
	}

	function formatFileSize(sizeInBytes: number): string {
		return PhotoFileSizeFormatter.toMegabytes(sizeInBytes);
	}

	function openLightbox(photo: PhotoDto) {
		selectedPhoto = photo;
	}

	function closeLightbox() {
		selectedPhoto = null;
	}

	function handlePhotoKeydown(event: KeyboardEvent, photo: PhotoDto) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openLightbox(photo);
		}
	}
</script>

<div class="explorer">
	<aside class="sidebar">
		<div class="sidebar-header">
			<h2>Folders</h2>
			<button class="btn-new-folder" on:click={handleNewFolder} disabled={$createFolder.isPending}>
				{$createFolder.isPending ? 'Creating...' : '+ New Folder'}
			</button>
		</div>
		<nav class="folders-list">
			{#if $folders.isLoading}
				<p class="status-message">Loading folders...</p>
			{:else if $folders.isError}
				<p class="status-message">
					<a href="/photos">← Go to Photos Home</a>
				</p>
			{:else if $folders.data}
				{#if $folders.data.length === 0}
					<p class="status-message">No folders yet</p>
				{:else}
					{#each $folders.data as folder}
						<a href="/photos/{folder.id}" class="folder-item" class:active={folder.id === folderId}>
							📁 {folder.name}
						</a>
					{/each}
				{/if}
			{/if}
		</nav>
	</aside>

	<main class="content">
		<header class="content-header">
			<h1>Photos</h1>
			<button class="btn-upload" on:click={() => (showUploader = !showUploader)}>
				{showUploader ? 'Cancel' : '📤 Upload Photos'}
			</button>
		</header>
		<div class="photos-grid">
			{#if showUploader}
				<div class="uploader-container">
					<UppyUploader
						endpoint={uploadEndpoint}
						fieldName={UploadConfiguration.UPLOAD_FIELD_NAME}
						formData={{ ownerId: UploadConfiguration.DEFAULT_OWNER_ID }}
						allowedTypes={UploadConfiguration.ALLOWED_MIME_TYPES}
						maxFileSize={UploadConfiguration.MAX_FILE_SIZE_BYTES}
						on:complete={handleUploadComplete}
					/>
				</div>
			{/if}
			{#if $photos.isLoading}
				<p class="status-message">Loading photos...</p>
			{:else if $photos.isError}
				<div class="error-box">
					<p class="status-message">Unable to load photos for this folder.</p>
					<details>
						<summary>Technical details</summary>
						<p class="error-message">{$photos.error.message}</p>
					</details>
				</div>
			{:else if $photos.data}
				{#if $photos.data.data.length === 0}
					<p class="status-message">No photos in this folder yet</p>
				{:else}
					<div class="grid">
						{#each $photos.data.data as photo}
							<div
								class="photo-card"
								on:click={() => openLightbox(photo)}
								on:keydown={(e) => handlePhotoKeydown(e, photo)}
								role="button"
								tabindex="0"
							>
								<img
									src={getImageUrl(photo)}
									alt={photo.fileName}
									loading="lazy"
									width="200"
									height="200"
								/>
								<div class="photo-info">
									<span class="photo-name">{photo.fileName}</span>
									<span class="photo-size">{formatFileSize(photo.sizeInBytes)}</span>
								</div>
							</div>
						{/each}
					</div>
					<div class="pagination">
						<p>
							Showing {$photos.data.data.length} of {$photos.data.pagination.total} photos (Page {$photos
								.data.pagination.page})
						</p>
					</div>
				{/if}
			{/if}
		</div>
	</main>
</div>

{#if selectedPhoto && $photos.data}
	<Lightbox photo={selectedPhoto} photos={$photos.data.data} {apiBaseUrl} onClose={closeLightbox} />
{/if}

<style>
	.explorer {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	.sidebar {
		width: var(--sidebar-width);
		background: var(--color-bg-alt);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.btn-new-folder {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.btn-new-folder:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-new-folder:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.folders-list {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-md);
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.content-header {
		padding: var(--spacing-lg);
		background: var(--color-bg-alt);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.content-header h1 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.photos-grid {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
	}

	.folder-item {
		display: block;
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-xs);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.folder-item:hover {
		background-color: var(--color-bg);
	}

	.folder-item.active {
		background-color: var(--color-primary);
		color: white;
	}

	.status-message {
		color: var(--color-text-secondary);
		padding: var(--spacing-md);
		text-align: center;
		font-size: 0.9rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--spacing-md);
	}

	.photo-card {
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: all 0.2s;
		cursor: pointer;
	}

	.photo-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.photo-card:active {
		transform: translateY(0);
	}

	.photo-card img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		display: block;
	}

	.photo-info {
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.photo-name {
		font-size: 0.9rem;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.photo-size {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.pagination {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-md);
		text-align: center;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.btn-upload {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: var(--color-success);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.btn-upload:hover {
		opacity: 0.9;
	}

	.uploader-container {
		margin-bottom: var(--spacing-lg);
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.error-box {
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		margin: var(--spacing-lg) 0;
	}

	.error-box details {
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.error-box summary {
		cursor: pointer;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.error-box summary:hover {
		color: var(--color-text);
	}

	.error-message {
		margin-top: var(--spacing-sm);
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		line-height: 1.5;
		word-break: break-word;
	}
</style>
