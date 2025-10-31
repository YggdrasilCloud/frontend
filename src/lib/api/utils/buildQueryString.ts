import type { PhotoQueryParams, FolderQueryParams } from '../types';

/**
 * Build URL query string from query parameters.
 * Optimized for performance - only includes non-empty parameters.
 */
export function buildPhotoQueryString(
	params: PhotoQueryParams & { page?: number; perPage?: number }
): string {
	const searchParams = new URLSearchParams();

	// Pagination
	if (params.page) searchParams.set('page', params.page.toString());
	if (params.perPage) searchParams.set('perPage', params.perPage.toString());

	// Sorting
	if (params.sortBy) searchParams.set('sortBy', params.sortBy);
	if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

	// Filtering
	if (params.search) searchParams.set('search', params.search);

	// Handle array parameters (mimeType, extension)
	if (params.mimeType) {
		const mimeTypes = Array.isArray(params.mimeType) ? params.mimeType.join(',') : params.mimeType;
		if (mimeTypes) searchParams.set('mimeType', mimeTypes);
	}

	if (params.extension) {
		const extensions = Array.isArray(params.extension)
			? params.extension.join(',')
			: params.extension;
		if (extensions) searchParams.set('extension', extensions);
	}

	// Size range
	if (params.sizeMin !== undefined) searchParams.set('sizeMin', params.sizeMin.toString());
	if (params.sizeMax !== undefined) searchParams.set('sizeMax', params.sizeMax.toString());

	// Date range
	if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
	if (params.dateTo) searchParams.set('dateTo', params.dateTo);

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
}

/**
 * Build URL query string from folder query parameters.
 */
export function buildFolderQueryString(
	params: FolderQueryParams & { page?: number; perPage?: number }
): string {
	const searchParams = new URLSearchParams();

	// Pagination
	if (params.page) searchParams.set('page', params.page.toString());
	if (params.perPage) searchParams.set('perPage', params.perPage.toString());

	// Sorting
	if (params.sortBy) searchParams.set('sortBy', params.sortBy);
	if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

	// Filtering
	if (params.search) searchParams.set('search', params.search);

	// Date range
	if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
	if (params.dateTo) searchParams.set('dateTo', params.dateTo);

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
}
