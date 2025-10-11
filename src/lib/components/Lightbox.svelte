<script lang="ts">
	import { onMount } from 'svelte';
	import type { PhotoDto } from '$lib/api/types';
	import { PhotoUrlBuilder } from '$lib/domain/photo/PhotoUrlBuilder';

	export let photo: PhotoDto;
	export let photos: PhotoDto[];
	export let apiBaseUrl: string;
	export let onClose: () => void;

	const photoUrlBuilder = new PhotoUrlBuilder(apiBaseUrl);

	let imgElement: HTMLImageElement;
	let isOriginalLoaded = false;
	let currentIndex = photos.findIndex((p) => p.id === photo.id);
	let currentPhoto = photo;

	$: thumbnailUrl = photoUrlBuilder.buildThumbnailUrl(currentPhoto) || '';
	$: originalUrl = photoUrlBuilder.buildOriginalUrl(currentPhoto);

	async function loadOriginal() {
		if (!imgElement || isOriginalLoaded) return;

		// Create a temporary image to preload the original
		const tempImg = new Image();
		tempImg.src = originalUrl;

		try {
			// Wait for the image to load
			await tempImg.decode();

			// Once decoded, smoothly transition to the original
			isOriginalLoaded = true;
			imgElement.src = originalUrl;
		} catch (error) {
			console.error('Failed to load original image:', error);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Escape':
				onClose();
				break;
			case 'ArrowLeft':
				navigatePrevious();
				break;
			case 'ArrowRight':
				navigateNext();
				break;
		}
	}

	function navigatePrevious() {
		if (currentIndex > 0) {
			currentIndex--;
			currentPhoto = photos[currentIndex];
			isOriginalLoaded = false;
			loadOriginal();
		}
	}

	function navigateNext() {
		if (currentIndex < photos.length - 1) {
			currentIndex++;
			currentPhoto = photos[currentIndex];
			isOriginalLoaded = false;
			loadOriginal();
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		// Close only if clicking on the overlay itself, not the image
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	onMount(() => {
		// Start loading the original immediately
		loadOriginal();

		// Add keyboard listener
		window.addEventListener('keydown', handleKeydown);

		// Cleanup
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div
	class="lightbox-overlay"
	on:click={handleOverlayClick}
	on:keydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button class="close-button" on:click={onClose} aria-label="Close lightbox">×</button>

	{#if currentIndex > 0}
		<button class="nav-button nav-previous" on:click={navigatePrevious} aria-label="Previous photo">
			‹
		</button>
	{/if}

	<div class="lightbox-content">
		<img
			bind:this={imgElement}
			src={thumbnailUrl}
			alt={currentPhoto.fileName}
			class="lightbox-image"
			class:loaded={isOriginalLoaded}
		/>
		{#if !isOriginalLoaded}
			<div class="loading-indicator">Loading original...</div>
		{/if}
	</div>

	{#if currentIndex < photos.length - 1}
		<button class="nav-button nav-next" on:click={navigateNext} aria-label="Next photo">›</button>
	{/if}

	<div class="photo-info">
		<span class="photo-name">{currentPhoto.fileName}</span>
		<span class="photo-counter">{currentIndex + 1} / {photos.length}</span>
	</div>
</div>

<style>
	.lightbox-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.lightbox-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-image {
		max-width: 100%;
		max-height: 90vh;
		object-fit: contain;
		transition: opacity 0.3s ease-in-out;
	}

	.lightbox-image:not(.loaded) {
		filter: blur(10px);
		transform: scale(1.05);
	}

	.lightbox-image.loaded {
		filter: none;
		transform: scale(1);
	}

	.loading-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 0.9rem;
		background: rgba(0, 0, 0, 0.7);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		pointer-events: none;
	}

	.close-button {
		position: absolute;
		top: var(--spacing-lg);
		right: var(--spacing-lg);
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		font-size: 2rem;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 1001;
	}

	.close-button:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.nav-button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		font-size: 3rem;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 1001;
	}

	.nav-button:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-50%) scale(1.1);
	}

	.nav-previous {
		left: var(--spacing-lg);
	}

	.nav-next {
		right: var(--spacing-lg);
	}

	.photo-info {
		position: absolute;
		bottom: var(--spacing-lg);
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		z-index: 1001;
	}

	.photo-name {
		color: white;
		font-size: 0.9rem;
		max-width: 400px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.photo-counter {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.close-button,
		.nav-button {
			width: 40px;
			height: 40px;
			font-size: 1.5rem;
		}

		.nav-button {
			font-size: 2rem;
		}

		.close-button {
			top: var(--spacing-md);
			right: var(--spacing-md);
		}

		.nav-previous {
			left: var(--spacing-md);
		}

		.nav-next {
			right: var(--spacing-md);
		}

		.photo-info {
			max-width: 80vw;
		}

		.photo-name {
			max-width: 60vw;
		}
	}
</style>
