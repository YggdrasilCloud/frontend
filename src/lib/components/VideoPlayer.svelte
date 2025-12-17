<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let src: string;
	export let posterUrl: string | null = null;
	export let mimeType: string = 'video/mp4';

	let videoContainer: HTMLDivElement;
	let videoElement: HTMLVideoElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let player: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let ui: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let shakaModule: any = null;
	let error: string | null = null;
	let isLoading = true;
	let isInitialized = false;

	async function initPlayer() {
		if (!shakaModule) return;

		// Check browser support
		if (!shakaModule.Player.isBrowserSupported()) {
			error = 'Browser not supported for video playback';
			isLoading = false;
			return;
		}

		try {
			// Create player instance
			player = new shakaModule.Player();
			await player.attach(videoElement);

			// Configure player
			player.configure({
				streaming: {
					bufferingGoal: 30,
					rebufferingGoal: 2,
					bufferBehind: 30
				}
			});

			// Initialize UI
			ui = new shakaModule.ui.Overlay(player, videoContainer, videoElement);
			const controls = ui.getControls();

			// Configure UI controls
			if (controls) {
				controls.configure({
					controlPanelElements: [
						'play_pause',
						'time_and_duration',
						'spacer',
						'mute',
						'volume',
						'fullscreen'
					],
					overflowMenuButtons: ['playback_rate', 'picture_in_picture'],
					addBigPlayButton: true,
					enableKeyboardPlaybackControls: true,
					doubleClickForFullscreen: true,
					singleClickForPlayAndPause: true,
					enableTooltips: true,
					seekBarColors: {
						base: 'rgba(255, 255, 255, 0.3)',
						buffered: 'rgba(255, 255, 255, 0.5)',
						played: 'rgba(255, 255, 255, 0.9)'
					}
				});
			}

			// Handle errors
			player.addEventListener('error', onPlayerError);

			// Load the video
			await player.load(src, undefined, mimeType);
			isLoading = false;
			isInitialized = true;
		} catch (e) {
			onPlayerError(e);
		}
	}

	function onPlayerError(event: unknown) {
		let errorMessage = 'Failed to load video';

		if (event && typeof event === 'object' && 'detail' in event) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const detail = (event as { detail: any }).detail;
			errorMessage = `Error code: ${detail.code} - ${detail.message || 'Unknown error'}`;
			console.error('Shaka Player error:', detail);
		} else if (event instanceof Error) {
			errorMessage = event.message;
			console.error('Video error:', event);
		}

		error = errorMessage;
		isLoading = false;
	}

	async function destroyPlayer() {
		if (ui) {
			await ui.destroy();
			ui = null;
		}
		if (player) {
			player.removeEventListener('error', onPlayerError);
			await player.destroy();
			player = null;
		}
		isInitialized = false;
	}

	onMount(async () => {
		// Dynamic import for client-side only
		shakaModule = await import('shaka-player/dist/shaka-player.ui');
		// Import CSS
		await import('shaka-player/dist/controls.css');
		initPlayer();
	});

	onDestroy(() => {
		destroyPlayer();
	});

	// Reload video when src changes
	$: if (isInitialized && player && src) {
		isLoading = true;
		error = null;
		player
			.load(src, undefined, mimeType)
			.then(() => {
				isLoading = false;
			})
			.catch(onPlayerError);
	}
</script>

<div class="video-player-container" bind:this={videoContainer} data-shaka-player-container>
	{#if error}
		<div class="video-error">
			<span class="error-icon">&#9888;</span>
			<span>{error}</span>
		</div>
	{:else}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoElement}
			class="video-element"
			poster={posterUrl || undefined}
			data-shaka-player
		>
			Your browser does not support video playback.
		</video>
		{#if isLoading}
			<div class="video-loading">
				<div class="loading-spinner"></div>
				<span>Loading video...</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.video-player-container {
		position: relative;
		width: 100%;
		height: 100%;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.video-element {
		width: 100%;
		height: 100%;
		max-height: 90vh;
		object-fit: contain;
	}

	.video-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		color: #ff6b6b;
		text-align: center;
		padding: var(--spacing-xl);
	}

	.error-icon {
		font-size: 3rem;
	}

	.video-loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		color: white;
		z-index: 10;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Shaka Player UI customizations */
	:global(.video-player-container .shaka-controls-button-panel) {
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	}

	:global(.video-player-container .shaka-play-button-container) {
		background: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
	}

	:global(.video-player-container .shaka-scrim-container) {
		background: transparent;
	}
</style>
