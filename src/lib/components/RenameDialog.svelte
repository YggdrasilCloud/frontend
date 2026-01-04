<script lang="ts">
	import { FolderNameValidator } from '$lib/domain/folder/FolderNameValidator';

	interface Props {
		open: boolean;
		currentName: string;
		onConfirm: (newName: string) => void;
		onCancel: () => void;
	}

	let { open, currentName, onConfirm, onCancel }: Props = $props();

	let dialog: HTMLDialogElement;
	let inputElement: HTMLInputElement;
	let newName = $state(currentName);
	let error = $state<string | null>(null);

	$effect(() => {
		if (dialog) {
			if (open) {
				newName = currentName;
				error = null;
				dialog.showModal();
				// Focus input after dialog opens
				setTimeout(() => inputElement?.select(), 0);
			} else {
				dialog.close();
			}
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmedName = newName.trim();

		const validation = FolderNameValidator.validate(trimmedName);
		if (!validation.isValid) {
			error = validation.error ?? 'Invalid name';
			return;
		}

		onConfirm(trimmedName);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}

	function handleInput() {
		error = null;
	}
</script>

<dialog bind:this={dialog} onkeydown={handleKeydown}>
	<form class="dialog-content" onsubmit={handleSubmit}>
		<h2 class="dialog-title">Rename Folder</h2>
		<div class="input-group">
			<label for="folder-name">New name</label>
			<input
				bind:this={inputElement}
				type="text"
				id="folder-name"
				bind:value={newName}
				oninput={handleInput}
				class:error={error !== null}
				maxlength="255"
			/>
			{#if error}
				<span class="error-message">{error}</span>
			{/if}
		</div>
		<div class="dialog-actions">
			<button type="button" class="btn-cancel" onclick={onCancel}> Cancel </button>
			<button type="submit" class="btn-confirm"> Rename </button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		border: none;
		border-radius: var(--radius-md);
		padding: 0;
		max-width: 400px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		background: var(--color-bg);
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	.dialog-content {
		padding: var(--spacing-lg);
	}

	.dialog-title {
		margin: 0 0 var(--spacing-lg) 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.input-group {
		margin-bottom: var(--spacing-lg);
	}

	.input-group label {
		display: block;
		margin-bottom: var(--spacing-xs);
		font-size: 0.9rem;
		color: var(--color-text-secondary);
	}

	.input-group input {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 1rem;
		background: var(--color-bg);
		color: var(--color-text);
	}

	.input-group input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
	}

	.input-group input.error {
		border-color: #dc3545;
	}

	.error-message {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: 0.85rem;
		color: #dc3545;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	.btn-cancel,
	.btn-confirm {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.btn-cancel {
		background: var(--color-bg-alt);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-cancel:hover {
		background: var(--color-border);
	}

	.btn-confirm {
		background: var(--color-primary);
		color: white;
	}

	.btn-confirm:hover {
		opacity: 0.9;
	}
</style>
