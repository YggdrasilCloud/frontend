<script lang="ts">
	/**
	 * Pagination component with page numbers, Previous/Next buttons, and ellipsis.
	 *
	 * Features:
	 * - Shows first page, last page, current page, and 2 pages on each side of current
	 * - Ellipsis (...) for large page ranges
	 * - Previous/Next navigation
	 * - Total items display
	 * - Responsive design
	 */

	export let currentPage: number;
	export let totalPages: number;
	export let totalItems: number;
	export let onPageChange: (page: number) => void;
	export let itemName = 'items'; // "photos", "folders", etc.

	/**
	 * Generate array of page numbers to display with ellipsis logic.
	 * Shows: [1] ... [4] [5] [6] ... [10]
	 */
	function getPageNumbers(): (number | string)[] {
		if (totalPages <= 7) {
			// Show all pages if 7 or fewer
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const pages: (number | string)[] = [];
		const showEllipsisStart = currentPage > 3;
		const showEllipsisEnd = currentPage < totalPages - 2;

		// Always show first page
		pages.push(1);

		if (showEllipsisStart) {
			pages.push('...');
		}

		// Show pages around current page
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);

		for (let i = start; i <= end; i++) {
			if (!pages.includes(i)) {
				pages.push(i);
			}
		}

		if (showEllipsisEnd) {
			pages.push('...');
		}

		// Always show last page
		if (!pages.includes(totalPages)) {
			pages.push(totalPages);
		}

		return pages;
	}

	$: pageNumbers = getPageNumbers();
	$: canGoPrevious = currentPage > 1;
	$: canGoNext = currentPage < totalPages;

	function handlePageClick(page: number) {
		if (page !== currentPage && page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	}

	function handlePrevious() {
		if (canGoPrevious) {
			onPageChange(currentPage - 1);
		}
	}

	function handleNext() {
		if (canGoNext) {
			onPageChange(currentPage + 1);
		}
	}
</script>

<div class="pagination">
	<div class="pagination-info">
		<span class="total-count">{totalItems} {itemName}</span>
	</div>

	<div class="pagination-controls">
		<!-- Previous button -->
		<button
			class="pagination-btn pagination-prev"
			on:click={handlePrevious}
			disabled={!canGoPrevious}
			aria-label="Previous page"
		>
			← Previous
		</button>

		<!-- Page numbers -->
		<div class="pagination-pages">
			{#each pageNumbers as page}
				{#if page === '...'}
					<span class="pagination-ellipsis">...</span>
				{:else if typeof page === 'number'}
					<button
						class="pagination-page"
						class:active={page === currentPage}
						on:click={() => handlePageClick(page)}
						aria-label="Go to page {page}"
						aria-current={page === currentPage ? 'page' : undefined}
					>
						{page}
					</button>
				{/if}
			{/each}
		</div>

		<!-- Next button -->
		<button
			class="pagination-btn pagination-next"
			on:click={handleNext}
			disabled={!canGoNext}
			aria-label="Next page"
		>
			Next →
		</button>
	</div>
</div>

<style>
	.pagination {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		align-items: center;
		padding: var(--spacing-lg) 0;
		margin-top: var(--spacing-lg);
	}

	.pagination-info {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	.total-count {
		font-weight: 500;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		justify-content: center;
	}

	.pagination-pages {
		display: flex;
		gap: var(--spacing-xs);
	}

	.pagination-btn,
	.pagination-page {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
		transition: all 0.2s;
		min-width: 40px;
		text-align: center;
	}

	.pagination-btn:hover:not(:disabled),
	.pagination-page:hover:not(.active) {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.pagination-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-page.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
		font-weight: 600;
		cursor: default;
	}

	.pagination-ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.pagination-prev {
		margin-right: var(--spacing-sm);
	}

	.pagination-next {
		margin-left: var(--spacing-sm);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.pagination-controls {
			gap: var(--spacing-xs);
		}

		.pagination-btn {
			font-size: 0.85rem;
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.pagination-page {
			min-width: 36px;
			padding: var(--spacing-xs) var(--spacing-sm);
			font-size: 0.85rem;
		}
	}
</style>
