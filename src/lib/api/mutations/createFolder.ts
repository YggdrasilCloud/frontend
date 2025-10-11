import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type { CreateFolderRequest, FolderDto } from '../types';

export const createFolderMutation = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (data: CreateFolderRequest) => {
			return apiClient.post<FolderDto>('/api/folders', data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['folders'] });
		}
	});
};
