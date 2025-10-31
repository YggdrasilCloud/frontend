import { createQuery } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type { ListPhotosResponse, PhotoQueryParams } from '../types';
import { buildPhotoQueryString } from '../utils/buildQueryString';

/**
 * Query for fetching photos with sorting and filtering support.
 *
 * Performance optimizations:
 * - Cache key includes all query parameters for granular caching
 * - 1-minute stale time to reduce redundant API calls
 * - Only retry once to avoid long loading times
 */
export const photosQuery = (
	folderId: string,
	params: PhotoQueryParams = {},
	page = 1,
	perPage = 50
) =>
	createQuery({
		// Cache key includes all parameters for granular caching
		queryKey: ['photos', folderId, page, perPage, params],
		queryFn: async () => {
			const queryString = buildPhotoQueryString({ ...params, page, perPage });
			return apiClient.get<ListPhotosResponse>(`/api/folders/${folderId}/photos${queryString}`);
		},
		enabled: !!folderId,
		staleTime: 60_000, // Cache for 1 minute
		retry: 1 // Only retry once to avoid infinite loading
	});
