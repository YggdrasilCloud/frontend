<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Uppy from '@uppy/core';
	import Dashboard from '@uppy/dashboard';
	import Tus from '@uppy/tus';

	import '@uppy/core/css/style.min.css';
	import '@uppy/dashboard/css/style.min.css';

	export let endpoint: string;
	export let allowedTypes: readonly string[] | string[] = ['image/*'];
	export let maxFileSize: number = 5368709120; // 5GB default for Tus
	export let maxNumberOfFiles: number = 100;
	export let chunkSize: number = 50 * 1024 * 1024; // 50MB chunks
	export let metadata: Record<string, string> = {}; // Metadata sent with Tus upload

	const dispatch = createEventDispatcher<{
		complete: { successful: unknown[]; failed: unknown[] };
		progress: { progress: number };
		error: { error: Error };
	}>();

	let uppyContainer: HTMLDivElement;
	let uppy: Uppy | null = null;

	onMount(() => {
		uppy = new Uppy({
			restrictions: {
				maxFileSize,
				maxNumberOfFiles,
				allowedFileTypes: [...allowedTypes]
			},
			autoProceed: false
		})
			.use(Dashboard, {
				inline: true,
				target: uppyContainer,
				height: 400,
				hideProgressDetails: false,
				proudlyDisplayPoweredByUppy: false
			})
			.use(Tus, {
				endpoint,
				chunkSize,
				retryDelays: [0, 1000, 3000, 5000], // Retry delays for resumable uploads
				removeFingerprintOnSuccess: true // Clean up fingerprint after successful upload
			});

		// Set metadata for Tus uploads (folderId, ownerId, etc.)
		uppy.setMeta(metadata);

		// Forward Uppy events to Svelte
		uppy.on('complete', (result) => {
			dispatch('complete', {
				successful: result.successful ?? [],
				failed: result.failed ?? []
			});
		});

		uppy.on('progress', (progress) => {
			dispatch('progress', { progress });
		});

		uppy.on('error', (error) => {
			dispatch('error', { error });
		});
	});

	onDestroy(() => {
		if (uppy) {
			uppy.cancelAll();
			uppy.clear();
		}
	});
</script>

<div bind:this={uppyContainer} class="uppy-wrapper"></div>

<style>
	.uppy-wrapper {
		width: 100%;
	}
</style>
