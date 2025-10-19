import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type { CreateFolderRequest, FolderDto } from '../types';

export const createFolderMutation = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (data: CreateFolderRequest) => {
			return apiClient.post<FolderDto>('/api/folders', data);
		},
		onSuccess: (_, variables) => {
			// Invalidate all folders queries (sidebar)
			queryClient.invalidateQueries({ queryKey: ['folders'] });

			// If creating a subfolder, invalidate the parent's children
			if (variables.parentId) {
				queryClient.invalidateQueries({ queryKey: ['folders', variables.parentId, 'children'] });
			}
		}
	});
};
