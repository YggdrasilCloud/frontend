<script lang="ts">
	import type { PhotoQueryParams } from '$lib/api/types';
	import { useDebouncedValue } from '$lib/hooks/useDebouncedValue';

	// Props
	export let params: PhotoQueryParams = {};
	export let onParamsChange: (newParams: PhotoQueryParams) => void;
	export let appliedFiltersCount = 0;

	// Local state with debouncing for search (300ms delay for performance)
	const [debouncedSearch, setSearch] = useDebouncedValue(params.search || '', 300);
	let searchInput = params.search || '';

	// React to debounced search changes
	$: if ($debouncedSearch !== params.search) {
		onParamsChange({ ...params, search: $debouncedSearch || undefined });
	}

	// Handle search input changes
	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchInput = value;
		setSearch(value);
	}

	// Handle sort changes (no debounce needed - immediate feedback)
	function handleSortChange(field: PhotoQueryParams['sortBy']) {
		// Toggle sort order if clicking same field, otherwise default to desc
		const newOrder =
			params.sortBy === field && params.sortOrder === 'desc' ? 'asc' : 'desc';
		onParamsChange({ ...params, sortBy: field, sortOrder: newOrder });
	}

	// Clear all filters
	function clearFilters() {
		searchInput = '';
		setSearch('');
		onParamsChange({
			sortBy: 'uploadedAt',
			sortOrder: 'desc'
		});
	}

	// Show/hide advanced filters
	let showAdvanced = false;
</script>

<div class="filters-container">
	<!-- Quick controls bar -->
	<div class="quick-controls">
		<!-- Search (debounced) -->
		<div class="search-box">
			<input
				type="search"
				placeholder="Search photos..."
				value={searchInput}
				on:input={handleSearchInput}
				class="search-input"
			/>
		</div>

		<!-- Sort dropdown -->
		<div class="sort-dropdown">
			<label>
				Sort by:
				<select
					value={params.sortBy || 'uploadedAt'}
					on:change={(e) =>
						onParamsChange({
							...params,
							sortBy: e.currentTarget.value as PhotoQueryParams['sortBy']
						})}
				>
					<option value="uploadedAt">Upload Date</option>
					<option value="takenAt">Taken Date</option>
					<option value="fileName">File Name</option>
					<option value="sizeInBytes">File Size</option>
					<option value="mimeType">Type</option>
				</select>
			</label>

			<button
				class="sort-order-btn"
				on:click={() =>
					onParamsChange({
						...params,
						sortOrder: params.sortOrder === 'asc' ? 'desc' : 'asc'
					})}
				title={params.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
			>
				{params.sortOrder === 'asc' ? '↑' : '↓'}
			</button>
		</div>

		<!-- Filter toggle & count -->
		<button class="filter-toggle-btn" on:click={() => (showAdvanced = !showAdvanced)}>
			<span>Filters</span>
			{#if appliedFiltersCount > 0}
				<span class="filter-badge">{appliedFiltersCount}</span>
			{/if}
		</button>

		<!-- Clear all -->
		{#if appliedFiltersCount > 0 || params.sortBy !== 'uploadedAt'}
			<button class="clear-btn" on:click={clearFilters}> Clear all </button>
		{/if}
	</div>

	<!-- Advanced filters (collapsible) -->
	{#if showAdvanced}
		<div class="advanced-filters">
			<div class="filter-grid">
				<!-- MIME type filter -->
				<div class="filter-group">
					<label for="mime-filter">Type:</label>
					<select
						id="mime-filter"
						value={params.mimeType || ''}
						on:change={(e) => {
							const value = e.currentTarget.value;
							onParamsChange({ ...params, mimeType: value || undefined });
						}}
					>
						<option value="">All types</option>
						<option value="image/jpeg">JPEG</option>
						<option value="image/png">PNG</option>
						<option value="image/gif">GIF</option>
						<option value="image/webp">WebP</option>
					</select>
				</div>

				<!-- Size range -->
				<div class="filter-group">
					<label for="size-min">Min size (MB):</label>
					<input
						id="size-min"
						type="number"
						min="0"
						step="0.1"
						placeholder="Min"
						value={params.sizeMin ? params.sizeMin / 1024 / 1024 : ''}
						on:input={(e) => {
							const value = e.currentTarget.value;
							const bytes = value ? Math.round(parseFloat(value) * 1024 * 1024) : undefined;
							onParamsChange({ ...params, sizeMin: bytes });
						}}
					/>
				</div>

				<div class="filter-group">
					<label for="size-max">Max size (MB):</label>
					<input
						id="size-max"
						type="number"
						min="0"
						step="0.1"
						placeholder="Max"
						value={params.sizeMax ? params.sizeMax / 1024 / 1024 : ''}
						on:input={(e) => {
							const value = e.currentTarget.value;
							const bytes = value ? Math.round(parseFloat(value) * 1024 * 1024) : undefined;
							onParamsChange({ ...params, sizeMax: bytes });
						}}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.filters-container {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.quick-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 200px;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #007bff;
	}

	.sort-dropdown {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.sort-dropdown select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 6px;
	}

	.sort-order-btn {
		padding: 0.5rem 0.75rem;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1.2rem;
		transition: background 0.2s;
	}

	.sort-order-btn:hover {
		background: #e9e9e9;
	}

	.filter-toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.filter-toggle-btn:hover {
		background: #0056b3;
	}

	.filter-badge {
		background: #ffc107;
		color: #000;
		padding: 0.15rem 0.5rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.clear-btn {
		padding: 0.5rem 1rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.clear-btn:hover {
		background: #5a6268;
	}

	.advanced-filters {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-group label {
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
	}

	.filter-group input,
	.filter-group select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #007bff;
	}
</style>
