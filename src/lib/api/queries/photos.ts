import { createQuery } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type { ListPhotosResponse } from '../types';

export const photosQuery = (folderId: string, page = 1, perPage = 50) =>
	createQuery({
		queryKey: ['photos', folderId, page, perPage],
		queryFn: async () => {
			return apiClient.get<ListPhotosResponse>(
				`/api/folders/${folderId}/photos?page=${page}&perPage=${perPage}`
			);
		},
		enabled: !!folderId,
		staleTime: 60_000, // Cache for 1 minute
		retry: 1 // Only retry once to avoid infinite loading
	});
