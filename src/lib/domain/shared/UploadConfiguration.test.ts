import { describe, it, expect } from 'vitest';
import { UploadConfiguration } from './UploadConfiguration';

describe('UploadConfiguration', () => {
	describe('constants', () => {
		it('should have correct DEFAULT_MAX_FILE_SIZE_BYTES (100 GB)', () => {
			expect(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024 * 1024);
		});

		it('should have correct MAX_NUMBER_OF_FILES', () => {
			expect(UploadConfiguration.MAX_NUMBER_OF_FILES).toBe(100);
		});

		it('should have correct ALLOWED_MIME_TYPES', () => {
			expect(UploadConfiguration.ALLOWED_MIME_TYPES).toEqual([
				// Images
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				// Vidéos
				'video/mp4',
				'video/webm',
				'video/quicktime',
				'video/x-msvideo',
				'video/x-matroska'
			]);
		});

		it('should have correct DEFAULT_OWNER_ID', () => {
			expect(UploadConfiguration.DEFAULT_OWNER_ID).toBe('00000000-0000-0000-0000-000000000000');
		});
	});

	describe('parseMaxFileSize', () => {
		it('should return default when env value is undefined', () => {
			const result = UploadConfiguration.parseMaxFileSize(undefined);

			expect(result).toBe(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES);
		});

		it('should return default when env value is empty string', () => {
			const result = UploadConfiguration.parseMaxFileSize('');

			expect(result).toBe(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES);
		});

		it('should parse valid numeric string', () => {
			const result = UploadConfiguration.parseMaxFileSize('107374182400');

			expect(result).toBe(107374182400); // 100 GB
		});

		it('should return default when env value is not a number', () => {
			const result = UploadConfiguration.parseMaxFileSize('invalid');

			expect(result).toBe(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES);
		});

		it('should return default when env value is zero', () => {
			const result = UploadConfiguration.parseMaxFileSize('0');

			expect(result).toBe(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES);
		});

		it('should return default when env value is negative', () => {
			const result = UploadConfiguration.parseMaxFileSize('-1');

			expect(result).toBe(UploadConfiguration.DEFAULT_MAX_FILE_SIZE_BYTES);
		});

		it('should parse small values', () => {
			const result = UploadConfiguration.parseMaxFileSize('1048576'); // 1 MB

			expect(result).toBe(1048576);
		});
	});

	describe('buildTusEndpoint', () => {
		it('should build correct Tus endpoint URL', () => {
			const apiBaseUrl = 'http://localhost:8000';
			const result = UploadConfiguration.buildTusEndpoint(apiBaseUrl);

			expect(result).toBe('http://localhost:8000/api/uploads/tus');
		});

		it('should handle production URL', () => {
			const apiBaseUrl = 'https://api.yggdrasil.cloud';
			const result = UploadConfiguration.buildTusEndpoint(apiBaseUrl);

			expect(result).toBe('https://api.yggdrasil.cloud/api/uploads/tus');
		});
	});

	describe('buildUploadMetadata', () => {
		it('should build metadata with folderId and default ownerId', () => {
			const folderId = '123e4567-e89b-12d3-a456-426614174000';
			const result = UploadConfiguration.buildUploadMetadata(folderId);

			expect(result).toEqual({
				folderId: '123e4567-e89b-12d3-a456-426614174000',
				ownerId: '00000000-0000-0000-0000-000000000000'
			});
		});

		it('should build metadata with custom ownerId', () => {
			const folderId = '123e4567-e89b-12d3-a456-426614174000';
			const ownerId = 'abc12345-e89b-12d3-a456-426614174000';
			const result = UploadConfiguration.buildUploadMetadata(folderId, ownerId);

			expect(result).toEqual({
				folderId: '123e4567-e89b-12d3-a456-426614174000',
				ownerId: 'abc12345-e89b-12d3-a456-426614174000'
			});
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

			it('should accept very small file (1 KB)', () => {
				const file = createFile('image/jpeg', 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid MP4 video', () => {
				const file = createFile('video/mp4', 10 * 1024 * 1024); // 10 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid WebM video', () => {
				const file = createFile('video/webm', 5 * 1024 * 1024); // 5 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid MOV video', () => {
				const file = createFile('video/quicktime', 8 * 1024 * 1024); // 8 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid AVI video', () => {
				const file = createFile('video/x-msvideo', 6 * 1024 * 1024); // 6 MB
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(true);
			});

			it('should accept valid MKV video', () => {
				const file = createFile('video/x-matroska', 12 * 1024 * 1024); // 12 MB
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

			it('should reject unsupported video format', () => {
				const file = createFile('video/3gpp', 5 * 1024 * 1024);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('not allowed');
			});
		});

		describe('invalid file sizes', () => {
			it('should reject empty file', () => {
				const file = createFile('image/jpeg', 0);
				const result = UploadConfiguration.validateFile(file);

				expect(result.isValid).toBe(false);
				expect(result.error).toBe('File is empty');
			});

			it('should reject file exceeding custom max size', () => {
				const file = createFile('image/jpeg', 30 * 1024 * 1024); // 30 MB
				const customMaxSize = 20 * 1024 * 1024; // 20 MB
				const result = UploadConfiguration.validateFile(file, customMaxSize);

				expect(result.isValid).toBe(false);
				expect(result.error).toContain('exceeds maximum');
				expect(result.error).toContain('30 MB');
				expect(result.error).toContain('20 MB');
			});

			it('should accept file within custom max size', () => {
				const file = createFile('image/jpeg', 15 * 1024 * 1024); // 15 MB
				const customMaxSize = 20 * 1024 * 1024; // 20 MB
				const result = UploadConfiguration.validateFile(file, customMaxSize);

				expect(result.isValid).toBe(true);
			});
		});
	});

	describe('formatFileSize', () => {
		it('should format bytes as MB', () => {
			expect(UploadConfiguration.formatFileSize(20 * 1024 * 1024)).toBe('20 MB');
		});

		it('should format bytes as GB for large files', () => {
			expect(UploadConfiguration.formatFileSize(5 * 1024 * 1024 * 1024)).toBe('5.0 GB');
		});

		it('should format bytes with decimals for GB', () => {
			expect(UploadConfiguration.formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
		});

		it('should format 100 GB correctly', () => {
			expect(UploadConfiguration.formatFileSize(100 * 1024 * 1024 * 1024)).toBe('100.0 GB');
		});
	});

	describe('getDefaultMaxFileSizeFormatted', () => {
		it('should return formatted default max file size (100 GB)', () => {
			const result = UploadConfiguration.getDefaultMaxFileSizeFormatted();

			expect(result).toBe('100.0 GB');
		});
	});
});
