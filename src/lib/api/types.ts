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
	fileUrl: string;
	thumbnailUrl: string | null; // null for old photos without thumbnails
}

export interface ListPhotosResponse {
	data: PhotoDto[];
	pagination: {
		page: number;
		perPage: number;
		total: number;
	};
}

export interface CreateFolderRequest {
	name: string;
	ownerId: string;
	parentId?: string;
}

export interface GetFolderChildrenResponse {
	children: FolderDto[];
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
