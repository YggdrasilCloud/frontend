import { describe, it, expect } from 'vitest';
import { FolderNameValidator } from './FolderNameValidator';

describe('FolderNameValidator', () => {
	describe('validate', () => {
		it('should accept valid folder name', () => {
			const result = FolderNameValidator.validate('My Photos');

			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should accept folder name with numbers', () => {
			const result = FolderNameValidator.validate('Photos 2024');

			expect(result.isValid).toBe(true);
		});

		it('should accept folder name with hyphens', () => {
			const result = FolderNameValidator.validate('my-photos');

			expect(result.isValid).toBe(true);
		});

		it('should accept folder name with underscores', () => {
			const result = FolderNameValidator.validate('my_photos');

			expect(result.isValid).toBe(true);
		});

		it('should accept folder name with special characters (backend validates)', () => {
			// These characters are now accepted by client - backend will validate
			const result1 = FolderNameValidator.validate('Photos/2024');
			const result2 = FolderNameValidator.validate('Photos:2024');
			const result3 = FolderNameValidator.validate('Photos*');

			expect(result1.isValid).toBe(true);
			expect(result2.isValid).toBe(true);
			expect(result3.isValid).toBe(true);
		});

		it('should accept reserved names (backend validates)', () => {
			// Reserved names are now accepted by client - backend will validate
			const result1 = FolderNameValidator.validate('.');
			const result2 = FolderNameValidator.validate('..');
			const result3 = FolderNameValidator.validate('CON');

			expect(result1.isValid).toBe(true);
			expect(result2.isValid).toBe(true);
			expect(result3.isValid).toBe(true);
		});

		it('should reject empty string', () => {
			const result = FolderNameValidator.validate('');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot be empty');
		});

		it('should reject whitespace-only string', () => {
			const result = FolderNameValidator.validate('   ');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot be empty');
		});

		it('should reject name exceeding max length (255)', () => {
			const longName = 'a'.repeat(256);
			const result = FolderNameValidator.validate(longName);

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot exceed 255 characters');
		});

		it('should accept name at max length (255)', () => {
			const maxName = 'a'.repeat(255);
			const result = FolderNameValidator.validate(maxName);

			expect(result.isValid).toBe(true);
		});

		it('should accept names already trimmed (workflow: sanitize then validate)', () => {
			// The proper workflow is: sanitize() first, then validate()
			const sanitized = FolderNameValidator.sanitize('  My Photos  ');
			const result = FolderNameValidator.validate(sanitized);

			expect(sanitized).toBe('My Photos');
			expect(result.isValid).toBe(true);
		});
	});

	describe('sanitize', () => {
		it('should trim whitespace', () => {
			const result = FolderNameValidator.sanitize('  My Photos  ');

			expect(result).toBe('My Photos');
		});

		it('should not replace special characters (backend handles)', () => {
			// Special characters are preserved - backend will handle them
			const result1 = FolderNameValidator.sanitize('Photos/2024');
			const result2 = FolderNameValidator.sanitize('Photos\\2024');
			const result3 = FolderNameValidator.sanitize('Photos:2024*?');

			expect(result1).toBe('Photos/2024');
			expect(result2).toBe('Photos\\2024');
			expect(result3).toBe('Photos:2024*?');
		});

		it('should truncate to max length', () => {
			const longName = 'a'.repeat(300);
			const result = FolderNameValidator.sanitize(longName);

			expect(result.length).toBe(255);
		});

		it('should not modify valid names', () => {
			const result = FolderNameValidator.sanitize('My Photos 2024');

			expect(result).toBe('My Photos 2024');
		});

		it('should handle empty string', () => {
			const result = FolderNameValidator.sanitize('');

			expect(result).toBe('');
		});

		it('should handle whitespace-only string', () => {
			const result = FolderNameValidator.sanitize('   ');

			expect(result).toBe('');
		});

		it('should trim and truncate in complex case', () => {
			const longNameWithSpaces = '  ' + 'a'.repeat(300) + '  ';
			const result = FolderNameValidator.sanitize(longNameWithSpaces);

			expect(result.length).toBe(255);
			expect(result).toBe('a'.repeat(255));
		});
	});
});
