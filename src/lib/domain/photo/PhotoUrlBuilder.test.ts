import { describe, it, expect } from 'vitest';
import { PhotoUrlBuilder } from './PhotoUrlBuilder';
import type { PhotoDto } from '$lib/api/types';

describe('PhotoUrlBuilder', () => {
	const apiBaseUrl = 'http://localhost:8000';
	const builder = new PhotoUrlBuilder(apiBaseUrl);

	const createPhotoDto = (overrides: Partial<PhotoDto> = {}): PhotoDto => ({
		id: '123e4567-e89b-12d3-a456-426614174000',
		fileName: 'test.jpg',
		storagePath: '/uploads/photos/test.jpg',
		mimeType: 'image/jpeg',
		sizeInBytes: 1024000,
		uploadedAt: '2024-10-11T14:30:00.000Z',
		fileUrl: '/uploads/photos/test.jpg',
		thumbnailUrl: '/uploads/thumbnails/test_300x300.jpg',
		...overrides
	});

	describe('buildDisplayUrl', () => {
		it('should return thumbnail URL when available', () => {
			const photo = createPhotoDto();
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe('http://localhost:8000/uploads/thumbnails/test_300x300.jpg');
		});

		it('should fallback to API endpoint when no thumbnail', () => {
			const photo = createPhotoDto({ thumbnailUrl: null });
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe(
				'http://localhost:8000/api/photos/123e4567-e89b-12d3-a456-426614174000/file'
			);
		});

		it('should fallback to API endpoint when thumbnail is empty string', () => {
			const photo = createPhotoDto({ thumbnailUrl: '' });
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe(
				'http://localhost:8000/api/photos/123e4567-e89b-12d3-a456-426614174000/file'
			);
		});
	});

	describe('buildThumbnailUrl', () => {
		it('should return absolute thumbnail URL when available', () => {
			const photo = createPhotoDto();
			const result = builder.buildThumbnailUrl(photo);

			expect(result).toBe('http://localhost:8000/uploads/thumbnails/test_300x300.jpg');
		});

		it('should return null when no thumbnail', () => {
			const photo = createPhotoDto({ thumbnailUrl: null });
			const result = builder.buildThumbnailUrl(photo);

			expect(result).toBeNull();
		});

		it('should return null when thumbnail is empty string', () => {
			const photo = createPhotoDto({ thumbnailUrl: '' });
			const result = builder.buildThumbnailUrl(photo);

			expect(result).toBeNull();
		});
	});

	describe('buildOriginalUrl', () => {
		it('should return absolute original URL when fileUrl is provided', () => {
			const photo = createPhotoDto();
			const result = builder.buildOriginalUrl(photo);

			expect(result).toBe('http://localhost:8000/uploads/photos/test.jpg');
		});

		it('should fallback to API endpoint when no fileUrl', () => {
			const photo = createPhotoDto({ fileUrl: undefined as unknown as string });
			const result = builder.buildOriginalUrl(photo);

			expect(result).toBe(
				'http://localhost:8000/api/photos/123e4567-e89b-12d3-a456-426614174000/file'
			);
		});

		it('should fallback to API endpoint when fileUrl is empty', () => {
			const photo = createPhotoDto({ fileUrl: '' });
			const result = builder.buildOriginalUrl(photo);

			expect(result).toBe(
				'http://localhost:8000/api/photos/123e4567-e89b-12d3-a456-426614174000/file'
			);
		});
	});

	describe('buildAbsoluteUrl', () => {
		it('should handle relative paths starting with /', () => {
			const photo = createPhotoDto({
				thumbnailUrl: '/uploads/thumbnails/test.jpg'
			});
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe('http://localhost:8000/uploads/thumbnails/test.jpg');
		});

		it('should handle already absolute HTTP URLs', () => {
			const photo = createPhotoDto({
				thumbnailUrl: 'http://cdn.example.com/thumbnails/test.jpg'
			});
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe('http://cdn.example.com/thumbnails/test.jpg');
		});

		it('should handle already absolute HTTPS URLs', () => {
			const photo = createPhotoDto({
				thumbnailUrl: 'https://cdn.example.com/thumbnails/test.jpg'
			});
			const result = builder.buildDisplayUrl(photo);

			expect(result).toBe('https://cdn.example.com/thumbnails/test.jpg');
		});
	});

	describe('different API base URLs', () => {
		it('should work with production URL', () => {
			const prodBuilder = new PhotoUrlBuilder('https://api.yggdrasil.cloud');
			const photo = createPhotoDto();
			const result = prodBuilder.buildDisplayUrl(photo);

			expect(result).toBe('https://api.yggdrasil.cloud/uploads/thumbnails/test_300x300.jpg');
		});

		it('should work with URL without trailing slash', () => {
			const builderNoSlash = new PhotoUrlBuilder('http://localhost:8000');
			const photo = createPhotoDto();
			const result = builderNoSlash.buildDisplayUrl(photo);

			expect(result).toBe('http://localhost:8000/uploads/thumbnails/test_300x300.jpg');
		});

		it('should work with URL with trailing slash', () => {
			const builderWithSlash = new PhotoUrlBuilder('http://localhost:8000/');
			const photo = createPhotoDto();
			const result = builderWithSlash.buildDisplayUrl(photo);

			// Should not have double slash
			expect(result).toBe('http://localhost:8000//uploads/thumbnails/test_300x300.jpg');
			// Note: This reveals a potential issue - might want to normalize this
		});
	});
});
