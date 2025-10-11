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
}

export interface ListPhotosResponse {
	items: PhotoDto[];
	total: number;
	page: number;
	perPage: number;
}

export interface CreateFolderRequest {
	name: string;
}

export interface UploadPhotoResponse {
	id: string;
	fileName: string;
	mimeType: string;
	sizeInBytes: number;
}
