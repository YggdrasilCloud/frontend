import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { apiClient } from '../client';
import type {
	RenameFolderRequest,
	RenameFolderResponse,
	DeleteFolderResponse,
	MoveFolderRequest,
	MoveFolderResponse
} from '../types';

export const renameFolderMutation = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
			const request: RenameFolderRequest = { name };
			return apiClient.patch<RenameFolderResponse>(`/api/folders/${folderId}`, request);
		},
		onSuccess: (_, variables) => {
			// Invalidate all folders queries (sidebar tree)
			queryClient.invalidateQueries({ queryKey: ['folders'] });
			// Invalidate the specific folder
			queryClient.invalidateQueries({ queryKey: ['folder', variables.folderId] });
			// Invalidate folder path (breadcrumbs)
			queryClient.invalidateQueries({ queryKey: ['folder-path', variables.folderId] });
		}
	});
};

export const deleteFolderMutation = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async ({
			folderId,
			recursive = false
		}: {
			folderId: string;
			recursive?: boolean;
		}) => {
			const path = recursive
				? `/api/folders/${folderId}?recursive=true`
				: `/api/folders/${folderId}`;
			return apiClient.delete<DeleteFolderResponse>(path);
		},
		onSuccess: () => {
			// Invalidate all folders queries (sidebar tree)
			queryClient.invalidateQueries({ queryKey: ['folders'] });
		}
	});
};

export const moveFolderMutation = () => {
	const queryClient = useQueryClient();

	return createMutation({
		mutationFn: async ({
			folderId,
			targetParentId
		}: {
			folderId: string;
			targetParentId: string | null;
		}) => {
			const request: MoveFolderRequest = { targetParentId };
			return apiClient.patch<MoveFolderResponse>(`/api/folders/${folderId}/move`, request);
		},
		onSuccess: (_, variables) => {
			// Invalidate all folders queries (sidebar tree)
			queryClient.invalidateQueries({ queryKey: ['folders'] });
			// Invalidate the specific folder
			queryClient.invalidateQueries({ queryKey: ['folder', variables.folderId] });
			// Invalidate folder path (breadcrumbs)
			queryClient.invalidateQueries({ queryKey: ['folder-path', variables.folderId] });
			// Invalidate parent's children if moving to a specific parent
			if (variables.targetParentId) {
				queryClient.invalidateQueries({
					queryKey: ['folders', variables.targetParentId, 'children']
				});
			}
		}
	});
};
