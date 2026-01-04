<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		onConfirm,
		onCancel
	}: Props = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (dialog) {
			if (open) {
				dialog.showModal();
			} else {
				dialog.close();
			}
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}
</script>

<dialog bind:this={dialog} onkeydown={handleKeydown}>
	<div class="dialog-content">
		<h2 class="dialog-title">{title}</h2>
		<p class="dialog-message">{message}</p>
		<div class="dialog-actions">
			<button class="btn-cancel" onclick={onCancel}>
				{cancelLabel}
			</button>
			<button class="btn-confirm" class:danger onclick={onConfirm}>
				{confirmLabel}
			</button>
		</div>
	</div>
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
		margin: 0 0 var(--spacing-md) 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.dialog-message {
		margin: 0 0 var(--spacing-lg) 0;
		color: var(--color-text-secondary);
		line-height: 1.5;
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

	.btn-confirm.danger {
		background: #dc3545;
	}
</style>
