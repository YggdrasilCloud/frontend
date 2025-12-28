export interface FolderDto {
	id: string;
	name: string;
	createdAt: string;
	parentId?: string | null;
}

export interface PhotoDto {
	id: string;
	fileName: string;
	storageKey: string;
	mimeType: string;
	sizeInBytes: number;
	uploadedAt: string;
	takenAt: string | null; // EXIF capture date if available
	fileUrl: string;
	thumbnailUrl: string | null; // null for old photos without thumbnails
}

export interface PhotoQueryParams {
	sortBy?: 'uploadedAt' | 'takenAt' | 'fileName' | 'sizeInBytes' | 'mimeType';
	sortOrder?: 'asc' | 'desc';
	search?: string;
	mimeType?: string | string[]; // Supports comma-separated or array
	extension?: string | string[];
	sizeMin?: number;
	sizeMax?: number;
	dateFrom?: string; // ISO 8601
	dateTo?: string; // ISO 8601
}

export interface ListPhotosResponse {
	data: PhotoDto[];
	pagination: {
		page: number;
		perPage: number;
		total: number;
	};
	filters: {
		sortBy: string;
		sortOrder: string;
		search: string | null;
		mimeTypes: string[];
		extensions: string[];
		sizeMin: number | null;
		sizeMax: number | null;
		dateFrom: string | null;
		dateTo: string | null;
		appliedFilters: number;
	};
}

export interface CreateFolderRequest {
	name: string;
	ownerId: string;
	parentId?: string;
}

export interface FolderQueryParams {
	sortBy?: 'name' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
	search?: string;
	dateFrom?: string; // ISO 8601
	dateTo?: string; // ISO 8601
}

export interface GetFolderChildrenResponse {
	data: FolderDto[];
	pagination: {
		page: number;
		perPage: number;
		total: number;
	};
	filters: {
		sortBy: string;
		sortOrder: string;
		search: string | null;
		dateFrom: string | null;
		dateTo: string | null;
		appliedFilters: number;
	};
}

export interface ListFoldersResponse {
	data: FolderDto[];
	pagination: {
		page: number;
		perPage: number;
		total: number;
	};
	filters: {
		sortBy: string;
		sortOrder: string;
		search: string | null;
		dateFrom: string | null;
		dateTo: string | null;
		appliedFilters: number;
	};
}

export interface PathSegmentDto {
	id: string;
	name: string;
}

export interface GetFolderPathResponse {
	path: PathSegmentDto[];
}

export interface UploadPhotoResponse {
	id: string;
	fileName: string;
	mimeType: string;
	sizeInBytes: number;
}

// Bulk operations types
export interface BulkDeletePhotosRequest {
	photoIds: string[];
}

export interface BulkMovePhotosRequest {
	photoIds: string[];
	targetFolderId: string;
}

export interface BulkOperationFailure {
	photoId: string;
	reason: string;
}

export interface BulkOperationSummary {
	total: number;
	deletedCount?: number;
	movedCount?: number;
	failedCount: number;
}

export interface BulkDeleteResponse {
	deleted: string[];
	failed: BulkOperationFailure[];
	summary: BulkOperationSummary;
}

export interface BulkMoveResponse {
	moved: string[];
	failed: BulkOperationFailure[];
	summary: BulkOperationSummary;
}
