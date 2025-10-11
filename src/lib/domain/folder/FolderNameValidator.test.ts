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

		it('should reject folder name with forward slash', () => {
			const result = FolderNameValidator.validate('Photos/2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: /');
		});

		it('should reject folder name with backslash', () => {
			const result = FolderNameValidator.validate('Photos\\2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: \\');
		});

		it('should reject folder name with colon', () => {
			const result = FolderNameValidator.validate('Photos:2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: :');
		});

		it('should reject folder name with asterisk', () => {
			const result = FolderNameValidator.validate('Photos*');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: *');
		});

		it('should reject folder name with question mark', () => {
			const result = FolderNameValidator.validate('Photos?');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: ?');
		});

		it('should reject folder name with double quote', () => {
			const result = FolderNameValidator.validate('Photos"2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: "');
		});

		it('should reject folder name with less than', () => {
			const result = FolderNameValidator.validate('Photos<2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: <');
		});

		it('should reject folder name with greater than', () => {
			const result = FolderNameValidator.validate('Photos>2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: >');
		});

		it('should reject folder name with pipe', () => {
			const result = FolderNameValidator.validate('Photos|2024');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot contain the character: |');
		});

		it('should reject reserved name "."', () => {
			const result = FolderNameValidator.validate('.');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('reserved name');
		});

		it('should reject reserved name ".."', () => {
			const result = FolderNameValidator.validate('..');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('reserved name');
		});

		it('should reject reserved name "CON"', () => {
			const result = FolderNameValidator.validate('CON');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('reserved name');
		});

		it('should reject reserved name "PRN"', () => {
			const result = FolderNameValidator.validate('PRN');

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('reserved name');
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

		it('should reject names with leading/trailing whitespace', () => {
			const result = FolderNameValidator.validate('  My Photos  ');

			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Folder name cannot start or end with whitespace');
		});
	});

	describe('sanitize', () => {
		it('should trim whitespace', () => {
			const result = FolderNameValidator.sanitize('  My Photos  ');

			expect(result).toBe('My Photos');
		});

		it('should replace forward slashes with hyphens', () => {
			const result = FolderNameValidator.sanitize('Photos/2024');

			expect(result).toBe('Photos-2024');
		});

		it('should replace backslashes with hyphens', () => {
			const result = FolderNameValidator.sanitize('Photos\\2024');

			expect(result).toBe('Photos-2024');
		});

		it('should replace multiple forbidden characters', () => {
			const result = FolderNameValidator.sanitize('Photos:2024*?');

			expect(result).toBe('Photos-2024--');
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

		it('should replace all forbidden characters in complex name', () => {
			const result = FolderNameValidator.sanitize('My/Photos\\2024:Best*Moments?<Now>|');

			// Each forbidden character is replaced individually, so > and | become --
			expect(result).toBe('My-Photos-2024-Best-Moments--Now--');
		});
	});
});
