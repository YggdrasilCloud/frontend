export interface FolderDto {
	id: string;
	name: string;
	createdAt: string;
}

export interface PhotoDto {
	id: string;
	fileName: string;
	storagePath: string;
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
}

export interface UploadPhotoResponse {
	id: string;
	fileName: string;
	mimeType: string;
	sizeInBytes: number;
}
