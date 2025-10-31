import { createQuery } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type {
	FolderDto,
	GetFolderChildrenResponse,
	GetFolderPathResponse,
	ListFoldersResponse,
	FolderQueryParams
} from '../types';
import { buildFolderQueryString } from '../utils/buildQueryString';

/**
 * Query for fetching all folders with sorting and filtering support.
 */
export const foldersQuery = (params: FolderQueryParams = {}, page = 1, perPage = 50) =>
	createQuery({
		queryKey: ['folders', page, perPage, params],
		queryFn: async () => {
			const queryString = buildFolderQueryString({ ...params, page, perPage });
			return apiClient.get<ListFoldersResponse>(`/api/folders${queryString}`);
		}
	});

export const folderQuery = (folderId: string) =>
	createQuery({
		queryKey: ['folders', folderId],
		queryFn: async () => {
			return apiClient.get<FolderDto>(`/api/folders/${folderId}`);
		},
		enabled: !!folderId
	});

/**
 * Query for fetching folder children (subfolders) with sorting and filtering support.
 */
export const folderChildrenQuery = (
	folderId: string,
	params: FolderQueryParams = {},
	page = 1,
	perPage = 50
) =>
	createQuery({
		queryKey: ['folders', folderId, 'children', page, perPage, params],
		queryFn: async () => {
			const queryString = buildFolderQueryString({ ...params, page, perPage });
			return apiClient.get<GetFolderChildrenResponse>(
				`/api/folders/${folderId}/children${queryString}`
			);
		},
		enabled: !!folderId,
		staleTime: 60_000
	});

export const folderPathQuery = (folderId: string) =>
	createQuery({
		queryKey: ['folders', folderId, 'path'],
		queryFn: async () => {
			return apiClient.get<GetFolderPathResponse>(`/api/folders/${folderId}/path`);
		},
		enabled: !!folderId
	});
