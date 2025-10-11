<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Uppy from '@uppy/core';
	import Dashboard from '@uppy/dashboard';
	import XHRUpload from '@uppy/xhr-upload';

	import '@uppy/core/dist/style.min.css';
	import '@uppy/dashboard/dist/style.min.css';

	export let endpoint: string;
	export let allowedTypes: string[] = ['image/*'];
	export let maxFileSize: number = 20971520; // 20MB
	export let maxNumberOfFiles: number = 100;

	const dispatch = createEventDispatcher<{
		complete: { successful: any[]; failed: any[] };
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
				allowedFileTypes: allowedTypes
			},
			autoProceed: false
		})
			.use(Dashboard, {
				inline: true,
				target: uppyContainer,
				height: 400,
				showProgressDetails: true,
				proudlyDisplayPoweredByUppy: false
			})
			.use(XHRUpload, {
				endpoint,
				fieldName: 'file',
				formData: true,
				bundle: false // One request per file
			});

		// Forward Uppy events to Svelte
		uppy.on('complete', (result) => {
			dispatch('complete', {
				successful: result.successful,
				failed: result.failed
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
		uppy?.close();
	});
</script>

<div bind:this={uppyContainer} class="uppy-wrapper"></div>

<style>
	.uppy-wrapper {
		width: 100%;
	}
</style>
