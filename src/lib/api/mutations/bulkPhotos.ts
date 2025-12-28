import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type {
	BulkDeletePhotosRequest,
	BulkDeleteResponse,
	BulkMovePhotosRequest,
	BulkMoveResponse
} from '../types';

export const bulkDeletePhotosMutation = (currentFolderId: string) => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (data: BulkDeletePhotosRequest) => {
			return apiClient.post<BulkDeleteResponse>('/api/photos/bulk-delete', data);
		},
		onSuccess: () => {
			// Invalidate photos for the current folder
			queryClient.invalidateQueries({ queryKey: ['photos-infinite', currentFolderId] });
		}
	});
};

export const bulkMovePhotosMutation = (currentFolderId: string) => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async (data: BulkMovePhotosRequest) => {
			return apiClient.patch<BulkMoveResponse>('/api/photos/bulk-move', data);
		},
		onSuccess: (_, variables) => {
			// Invalidate both source and target folder photo lists
			queryClient.invalidateQueries({ queryKey: ['photos-infinite', currentFolderId] });
			queryClient.invalidateQueries({
				queryKey: ['photos-infinite', variables.targetFolderId]
			});
		}
	});
};
