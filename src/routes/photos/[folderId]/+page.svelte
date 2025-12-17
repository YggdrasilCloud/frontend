<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { createInfiniteQuery, useQueryClient } from '@tanstack/svelte-query';
	import { foldersQuery, folderChildrenQuery, folderPathQuery } from '$lib/api/queries/folders';
	import { createFolderMutation } from '$lib/api/mutations/createFolder';
	import UppyUploader from '$lib/components/UppyUploader.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import FolderTree from '$lib/components/FolderTree.svelte';
	import PhotoFilters from '$lib/components/PhotoFilters.svelte';
	import { env } from '$env/dynamic/public';
	import type { PhotoDto, PhotoQueryParams, ListPhotosResponse } from '$lib/api/types';
	import { PhotoUrlBuilder } from '$lib/domain/photo/PhotoUrlBuilder';
	import { PhotoFileSizeFormatter } from '$lib/domain/photo/PhotoFileSizeFormatter';
	import { FolderNameValidator } from '$lib/domain/folder/FolderNameValidator';
	import { UploadConfiguration } from '$lib/domain/shared/UploadConfiguration';
	import { apiClient } from '$lib/api/client';
	import { buildPhotoQueryString } from '$lib/api/utils/buildQueryString';

	// Photo filtering and sorting state
	let photoParams: PhotoQueryParams = $state({
		sortBy: 'uploadedAt',
		sortOrder: 'desc'
	});

	const perPage = 50;

	// Intersection Observer for infinite scroll
	let loadMoreTrigger = $state<HTMLDivElement>();

	// Handle filter changes - reset infinite query
	function handleParamsChange(newParams: PhotoQueryParams) {
		photoParams = { ...newParams }; // Create new object reference
	}

	// Derived reactive values
	const folderId = $derived($page.params.folderId ?? '');
	const paramsKey = $derived(JSON.stringify(photoParams));
	const appliedFiltersCount = $derived(
		(photoParams.search ? 1 : 0) +
			(photoParams.mimeType ? 1 : 0) +
			(photoParams.extension ? 1 : 0) +
			(photoParams.sizeMin !== undefined ? 1 : 0) +
			(photoParams.sizeMax !== undefined ? 1 : 0) +
			(photoParams.dateFrom ? 1 : 0) +
			(photoParams.dateTo ? 1 : 0)
	);

	// Query client for cache invalidation
	const queryClient = useQueryClient();

	// Create queries using helper functions
	const folders = foldersQuery({}, 1, 1000);
	const subfolders = $derived(folderChildrenQuery(folderId, {}, 1, 1000));
	const folderPath = $derived(folderPathQuery(folderId));
	// Safe derived value to avoid race condition when accessing folder path
	const folderPathData = $derived($folderPath?.data?.path ?? []);

	// Photos infinite query for infinite scroll
	const photos = $derived(
		createInfiniteQuery({
			queryKey: ['photos-infinite', folderId, paramsKey],
			queryFn: async ({ pageParam = 1 }) => {
				const queryString = buildPhotoQueryString({
					...photoParams,
					page: pageParam,
					perPage
				});
				return apiClient.get<ListPhotosResponse>(`/api/folders/${folderId}/photos${queryString}`);
			},
			enabled: !!folderId,
			getNextPageParam: (lastPage, allPages) => {
				const currentPage = allPages.length;
				const totalPages = Math.ceil(lastPage.pagination.total / perPage);
				return currentPage < totalPages ? currentPage + 1 : undefined;
			},
			initialPageParam: 1,
			staleTime: 60_000,
			retry: 1
		})
	);

	// Flatten all photos from all pages and deduplicate by ID
	const allPhotos = $derived.by(() => {
		if (!$photos.data?.pages) return [];

		const photosMap = new Map();
		for (const page of $photos.data.pages) {
			for (const photo of page.data) {
				photosMap.set(photo.id, photo);
			}
		}
		const uniquePhotos = Array.from(photosMap.values());

		// Log duplicates
		const totalPhotos = $photos.data.pages.flatMap((p) => p.data).length;
		if (totalPhotos !== uniquePhotos.length) {
			console.warn(`⚠️ Removed ${totalPhotos - uniquePhotos.length} duplicate photos`, {
				total: totalPhotos,
				unique: uniquePhotos.length
			});
		}

		return uniquePhotos;
	});
	const totalPhotos = $derived($photos.data?.pages[0]?.pagination.total ?? 0);

	// Debug logging
	$effect(() => {
		console.log('📊 Photos state:', {
			pagesLoaded: $photos.data?.pages.length ?? 0,
			photosInPages: allPhotos.length,
			totalPhotos,
			hasNextPage: $photos.hasNextPage,
			isFetching: $photos.isFetchingNextPage
		});
	});

	// Setup Intersection Observer for infinite scroll
	$effect(() => {
		if (!loadMoreTrigger) {
			console.log('⚠️ loadMoreTrigger not available yet');
			return;
		}

		console.log('✅ Setting up Intersection Observer');

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				console.log('👁️ Intersection:', {
					isIntersecting: entry.isIntersecting,
					hasNextPage: $photos.hasNextPage,
					isFetching: $photos.isFetchingNextPage
				});

				if (entry.isIntersecting && $photos.hasNextPage && !$photos.isFetchingNextPage) {
					console.log('🚀 Fetching next page...');
					$photos.fetchNextPage();
				}
			},
			{ rootMargin: '200px' } // Start loading 200px before reaching the trigger
		);

		observer.observe(loadMoreTrigger);

		return () => {
			console.log('🧹 Cleaning up Intersection Observer');
			observer.disconnect();
		};
	});

	const createFolder = createFolderMutation();

	// Initialize domain services
	const apiBaseUrl = env.PUBLIC_API_URL || 'http://localhost:8888';
	const photoUrlBuilder = new PhotoUrlBuilder(apiBaseUrl);

	// Build Tus upload endpoint and metadata using domain service
	const tusEndpoint = UploadConfiguration.buildTusEndpoint(apiBaseUrl);
	const uploadMetadata = $derived(UploadConfiguration.buildUploadMetadata(folderId));

	// Parse max upload size from environment variable
	const maxUploadSize = UploadConfiguration.parseMaxFileSize(env.PUBLIC_MAX_UPLOAD_SIZE);

	let showUploader = $state(false);
	let selectedPhoto = $state<PhotoDto | null>(null);

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
	$effect(() => {
		if (folderPathData.length > 0) {
			// Expand all parent folders in the path
			folderPathData.forEach((folder) => {
				expandFolder(folder.id);
			});
		}
	});

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
		// Refetch photos to refresh the list (refetchQueries ensures infinite query pages are refetched)
		// Using exact: false to refetch all queries for this folder regardless of paramsKey
		queryClient.refetchQueries({ queryKey: ['photos-infinite', folderId], exact: false });
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
				onclick={handleNewRootFolder}
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
						onclick={handleNewSubfolder}
						disabled={$createFolder.isPending}
					>
						{$createFolder.isPending ? 'Creating...' : '📁 New Subfolder'}
					</button>
				{/if}
				<button class="btn-upload" onclick={() => (showUploader = !showUploader)}>
					{showUploader ? 'Cancel' : '📤 Upload Photos'}
				</button>
			</div>
		</header>

		{#if folderPathData.length > 0}
			<Breadcrumb path={folderPathData} />
		{/if}

		<!-- Photo filters - only show when there are photos or active filters -->
		{#if $photos.data && (allPhotos.length > 0 || appliedFiltersCount > 0)}
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
						endpoint={tusEndpoint}
						metadata={uploadMetadata}
						allowedTypes={UploadConfiguration.ALLOWED_MIME_TYPES}
						maxFileSize={maxUploadSize}
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
									onclick={() => expandFolder(subfolder.id)}
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
				{#if allPhotos.length === 0 && (!$subfolders.data || $subfolders.data.data.length === 0)}
					<p class="status-message">No photos or folders in this folder yet</p>
				{:else if allPhotos.length > 0}
					<div class="photos-section">
						<div class="photos-header">
							<h3>Photos</h3>
							<span class="photos-info">{totalPhotos} photos</span>
						</div>
						<div class="grid">
							{#each allPhotos as photo (photo.id)}
								<div
									class="photo-card"
									onclick={() => openLightbox(photo)}
									onkeydown={(e) => handlePhotoKeydown(e, photo)}
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

						<!-- Infinite scroll trigger and loading indicator -->
						<div bind:this={loadMoreTrigger} class="load-more-trigger">
							{#if $photos.isFetchingNextPage}
								<p class="loading-more">Loading more photos...</p>
							{:else if $photos.hasNextPage}
								<p class="load-more-message">Scroll to load more</p>
							{:else if totalPhotos > perPage}
								<p class="all-loaded">All {totalPhotos} photos loaded</p>
							{/if}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</main>
</div>

{#if selectedPhoto}
	<Lightbox photo={selectedPhoto} photos={allPhotos} {apiBaseUrl} onClose={closeLightbox} />
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

	.photos-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.photos-info {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.load-more-trigger {
		margin-top: var(--spacing-xl);
		padding: var(--spacing-lg);
		text-align: center;
		min-height: 60px;
	}

	.loading-more {
		color: var(--color-text-secondary);
		font-size: 0.95rem;
		font-weight: 500;
		margin: 0;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.load-more-message {
		color: var(--color-text-tertiary);
		font-size: 0.85rem;
		margin: 0;
	}

	.all-loaded {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-style: italic;
		margin: 0;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
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
