import { createQuery } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type { FolderDto } from '../types';

export const foldersQuery = () =>
	createQuery({
		queryKey: ['folders'],
		queryFn: async () => {
			return apiClient.get<FolderDto[]>('/api/folders');
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
