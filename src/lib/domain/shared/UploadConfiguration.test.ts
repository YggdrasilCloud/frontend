import { describe, it, expect } from 'vitest';
import { UploadConfiguration } from './UploadConfiguration';

describe('UploadConfiguration', () => {
	describe('constants', () => {
		it('should have correct MAX_FILE_SIZE_BYTES (20 MB)', () => {
			expect(UploadConfiguration.MAX_FILE_SIZE_BYTES).toBe(20 * 1024 * 1024);
		});

		it('should have correct MAX_NUMBER_OF_FILES', () => {
			expect(UploadConfiguration.MAX_NUMBER_OF_FILES).toBe(100);
		});

		it('should have correct ALLOWED_MIME_TYPES', () => {
			expect(UploadConfiguration.ALLOWED_MIME_TYPES).toEqual([
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp'
			]);
		});

		it('should have correct UPLOAD_FIELD_NAME', () => {
			expect(UploadConfiguration.UPLOAD_FIELD_NAME).toBe('photo');
		});

		it('should have correct DEFAULT_OWNER_ID', () => {
			expect(UploadConfiguration.DEFAULT_OWNER_ID).toBe('00000000-0000-0000-0000-000000000000');
		});
	});

	describe('buildUploadEndpoint', () => {
		it('should build correct endpoint URL', () => {
			const apiBaseUrl = 'http://localhost:8000';
			const folderId = '123e4567-e89b-12d3-a456-426614174000';
			const result = UploadConfiguration.buildUploadEndpoint(apiBaseUrl, folderId);

			expect(result).toBe(
				'http://localhost:8000/api/folders/123e4567-e89b-12d3-a456-426614174000/photos'
			);
		});

		it('should handle production URL', () => {
			const apiBaseUrl = 'https://api.yggdrasil.cloud';
			const folderId = '123e4567-e89b-12d3-a456-426614174000';
			const result = UploadConfiguration.buildUploadEndpoint(apiBaseUrl, folderId);

			expect(result).toBe(
				'https://api.yggdrasil.cloud/api/folders/123e4567-e89b-12d3-a456-426614174000/photos'
			);
		});

		it('should handle different folder IDs', () => {
			const apiBaseUrl = 'http://localhost:8000';
			const folderId = 'abc-123';
			const result = UploadConfiguration.buildUploadEndpoint(apiBaseUrl, folderId);

			expect(result).toBe('http://localhost:8000/api/folders/abc-123/photos');
		});
	});

	describe('validateFile', () => {
		const createFile = (type: string, size: number): File => {
			return new File(['x'.repeat(size)], 'test.jpg', { type });
		};

		describe('valid files', () => {
			it('should accept valid JPEG file', () => {
				const file = createFile('image/jpeg', 1024 * 1024); // 1 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
				expect(result.error).toBeUndefined();
			});

			it('should accept valid PNG file', () => {
				const file = createFile('image/png', 5 * 1024 * 1024); // 5 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid GIF file', () => {
				const file = createFile('image/gif', 2 * 1024 * 1024); // 2 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid WebP file', () => {
				const file = createFile('image/webp', 3 * 1024 * 1024); // 3 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept file at max size (20 MB)', () => {
				const file = createFile('image/jpeg', 20 * 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept very small file (1 KB)', () => {
				const file = createFile('image/jpeg', 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});
		});

		describe('invalid file types', () => {
			it('should reject BMP file', () => {
				const file = createFile('image/bmp', 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('not allowed');
				expect(result.error).toContain('image/bmp');
			});

			it('should reject SVG file', () => {
				const file = createFile('image/svg+xml', 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('not allowed');
			});

			it('should reject PDF file', () => {
				const file = createFile('application/pdf', 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
			});

			it('should reject text file', () => {
				const file = createFile('text/plain', 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
			});

			it('should reject video file', () => {
				const file = createFile('video/mp4', 5 * 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
			});
		});

		describe('invalid file sizes', () => {
			it('should reject file exceeding max size', () => {
				const file = createFile('image/jpeg', 21 * 1024 * 1024); // 21 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('exceeds maximum');
				expect(result.error).toContain('21.00 MB');
			});

			it('should reject very large file', () => {
				const file = createFile('image/jpeg', 100 * 1024 * 1024); // 100 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('100.00 MB');
			});

			it('should reject empty file', () => {
				const file = createFile('image/jpeg', 0);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toBe('File is empty');
			});
		});
	});

	describe('getMaxFileSizeFormatted', () => {
		it('should return formatted max file size', () => {
			const result = UploadConfiguration.getMaxFileSizeFormatted();

			expect(result).toBe('20 MB');
		});
	});
});
