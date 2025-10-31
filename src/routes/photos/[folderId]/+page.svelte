<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { foldersQuery, folderChildrenQuery, folderPathQuery } from '$lib/api/queries/folders';
	import { photosQuery } from '$lib/api/queries/photos';
	import { createFolderMutation } from '$lib/api/mutations/createFolder';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import FolderTree from '$lib/components/FolderTree.svelte';
	import PhotoFilters from '$lib/components/PhotoFilters.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { env } from '$env/dynamic/public';
	import type { PhotoDto, PhotoQueryParams } from '$lib/api/types';
	import { PhotoUrlBuilder } from '$lib/domain/photo/PhotoUrlBuilder';
	import { PhotoFileSizeFormatter } from '$lib/domain/photo/PhotoFileSizeFormatter';
	import { FolderNameValidator } from '$lib/domain/folder/FolderNameValidator';
	import { UploadConfiguration } from '$lib/domain/shared/UploadConfiguration';

	// Simple reactive folder ID
	$: folderId = $page.params.folderId ?? '';
	let previousFolderId = folderId;

	// Photo filtering and sorting state - simple let variables
	let photoParams: PhotoQueryParams = {
		sortBy: 'uploadedAt',
		sortOrder: 'desc'
	};
	let currentPage = 1;
	const perPage = 50;

	// Version counter to force reactivity
	let queryVersion = 0;

	// Reset page when folder changes
	$: if (folderId !== previousFolderId) {
		previousFolderId = folderId;
		currentPage = 1;
		queryVersion++;
	}

	// Handle filter changes
	function handleParamsChange(newParams: PhotoQueryParams) {
		photoParams = newParams;
		currentPage = 1;
		queryVersion++;
	}

	// Handle page changes - increment version to force reactive update
	function handlePageChange(page: number) {
		currentPage = page;
		queryVersion++;

		// Scroll to top
		setTimeout(() => {
			const photosSection = document.querySelector('.photos-section');
			if (photosSection) {
				photosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, 100);
	}

	// Calculate applied filters count
	$: appliedFiltersCount =
		(photoParams.search ? 1 : 0) +
		(photoParams.mimeType ? 1 : 0) +
		(photoParams.extension ? 1 : 0) +
		(photoParams.sizeMin !== undefined ? 1 : 0) +
		(photoParams.sizeMax !== undefined ? 1 : 0) +
		(photoParams.dateFrom ? 1 : 0) +
		(photoParams.dateTo ? 1 : 0);

	// Create queries using helper functions
	const folders = foldersQuery({}, 1, 1000);
	$: subfolders = folderChildrenQuery(folderId, {}, 1, 1000);
	$: folderPath = folderPathQuery(folderId);

	// Photos query - recreated when queryVersion changes
	// queryVersion forces Svelte to detect changes in currentPage/photoParams
	$: photos = photosQuery(folderId, photoParams, currentPage + queryVersion * 0, perPage);

	const createFolder = createFolderMutation();
	const queryClient = useQueryClient();

	// Initialize domain services
	const apiBaseUrl = env.PUBLIC_API_URL || 'http://localhost:8888';
	const photoUrlBuilder = new PhotoUrlBuilder(apiBaseUrl);

	// Build upload endpoint using domain service
	$: uploadEndpoint = UploadConfiguration.buildUploadEndpoint(apiBaseUrl, folderId);

	let showUploader = false;
	let selectedPhoto: PhotoDto | null = null;

	// Store for tracking which folders are expanded in the sidebar tree
	const expandedFolders = writable<Set<string>>(new Set());

	// Toggle folder expansion in the tree (for ▶ button)
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

	// Expand folder without closing it (for folder name clicks and folder cards)
	function expandFolder(folderId: string) {
		expandedFolders.update((set) => {
			const newSet = new Set(set);
			newSet.add(folderId);
			return newSet;
		});
	}

	// Auto-expand parent folders when landing on a subfolder via direct link
	$: if ($folderPath.data) {
		// Expand all parent folders in the path
		$folderPath.data.path.forEach((folder) => {
			expandFolder(folder.id);
		});
	}

	async function handleNewRootFolder() {
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
				// No parentId = root folder
			});
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to create folder';
			alert(`Error: ${errorMsg}`);
			console.error('Failed to create folder:', error);
		}
	}

	async function handleNewSubfolder() {
		const name = prompt('Enter subfolder name:');
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
				ownerId: UploadConfiguration.DEFAULT_OWNER_ID,
				parentId: folderId
			});
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
			<button
				class="btn-new-folder"
				on:click={handleNewRootFolder}
				disabled={$createFolder.isPending}
			>
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
				{#if $folders.data.data.length === 0}
					<p class="status-message">No folders yet</p>
				{:else}
					<FolderTree
						folders={$folders.data.data}
						currentFolderId={folderId}
						{expandedFolders}
						{toggleExpand}
						{expandFolder}
					/>
				{/if}
			{/if}
		</nav>
	</aside>

	<main class="content">
		<header class="content-header">
			<h1>Photos</h1>
			<div class="header-actions">
				{#if folderId}
					<button
						class="btn-new-subfolder"
						on:click={handleNewSubfolder}
						disabled={$createFolder.isPending}
					>
						{$createFolder.isPending ? 'Creating...' : '📁 New Subfolder'}
					</button>
				{/if}
				<button class="btn-upload" on:click={() => (showUploader = !showUploader)}>
					{showUploader ? 'Cancel' : '📤 Upload Photos'}
				</button>
			</div>
		</header>

		{#if $folderPath.data}
			<Breadcrumb path={$folderPath.data.path} />
		{/if}

		<!-- Photo filters - only show when there are photos or active filters -->
		{#if $photos.data && ($photos.data.data.length > 0 || appliedFiltersCount > 0)}
			<div class="filters-wrapper">
				<PhotoFilters
					params={photoParams}
					onParamsChange={handleParamsChange}
					{appliedFiltersCount}
				/>
			</div>
		{/if}

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

			<!-- Subfolders Section - Only show when inside a folder -->
			{#if folderId}
				{#if $subfolders.isLoading}
					<p class="status-message">Loading folders...</p>
				{:else if $subfolders.isError}
					<div class="error-box">
						<p class="status-message">Unable to load subfolders.</p>
						<details>
							<summary>Technical details</summary>
							<p class="error-message">{$subfolders.error.message}</p>
						</details>
					</div>
				{:else if $subfolders.data && $subfolders.data.data.length > 0}
					<div class="folders-section">
						<h3>Folders</h3>
						<div class="grid">
							{#each $subfolders.data.data as subfolder}
								<a
									href="/photos/{subfolder.id}"
									class="folder-card"
									on:click={() => expandFolder(subfolder.id)}
								>
									<div class="folder-icon">📁</div>
									<div class="folder-info">
										<span class="folder-name">{subfolder.name}</span>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			{/if}

			<!-- Photos Section -->
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
				{#if $photos.data.data.length === 0 && (!$subfolders.data || $subfolders.data.data.length === 0)}
					<p class="status-message">No photos or folders in this folder yet</p>
				{:else if $photos.data.data.length > 0}
					<div class="photos-section">
						<h3>Photos</h3>
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

						<!-- Pagination controls -->
						{#if $photos.data.pagination.total > perPage}
							<Pagination
								currentPage={$photos.data.pagination.page}
								totalPages={Math.ceil($photos.data.pagination.total / perPage)}
								totalItems={$photos.data.pagination.total}
								onPageChange={handlePageChange}
								itemName="photos"
							/>
						{/if}
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

	.filters-wrapper {
		padding: var(--spacing-lg) var(--spacing-lg) 0;
	}

	.photos-grid {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
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

	.header-actions {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.btn-new-subfolder {
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

	.btn-new-subfolder:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-new-subfolder:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.folders-section,
	.photos-section {
		margin-bottom: var(--spacing-xl);
	}

	.folders-section h3,
	.photos-section h3 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 1.1rem;
		color: var(--color-text);
		font-weight: 600;
	}

	.folder-card {
		background: var(--color-bg-alt);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: all 0.2s;
		cursor: pointer;
		text-decoration: none;
		color: var(--color-text);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
	}

	.folder-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		border-color: var(--color-primary);
	}

	.folder-card:active {
		transform: translateY(0);
	}

	.folder-icon {
		font-size: 4rem;
		margin-bottom: var(--spacing-md);
	}

	.folder-info {
		padding: var(--spacing-sm);
		text-align: center;
		width: 100%;
	}

	.folder-name {
		font-size: 0.95rem;
		color: var(--color-text);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}
</style>
