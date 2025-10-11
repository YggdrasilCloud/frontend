import { describe, it, expect } from 'vitest';
import { PhotoFileSizeFormatter } from './PhotoFileSizeFormatter';

describe('PhotoFileSizeFormatter', () => {
	describe('format', () => {
		it('should format 0 bytes', () => {
			const result = PhotoFileSizeFormatter.format(0);
			expect(result).toBe('0 Bytes');
		});

		it('should format bytes', () => {
			const result = PhotoFileSizeFormatter.format(500);
			expect(result).toBe('500 Bytes');
		});

		it('should format kilobytes', () => {
			const result = PhotoFileSizeFormatter.format(1024);
			expect(result).toBe('1 KB');
		});

		it('should format kilobytes with decimals', () => {
			const result = PhotoFileSizeFormatter.format(1536); // 1.5 KB
			expect(result).toBe('1.5 KB');
		});

		it('should format megabytes', () => {
			const result = PhotoFileSizeFormatter.format(1048576); // 1 MB
			expect(result).toBe('1 MB');
		});

		it('should format megabytes with decimals', () => {
			const result = PhotoFileSizeFormatter.format(4194304); // 4 MB
			expect(result).toBe('4 MB');
		});

		it('should format typical photo size', () => {
			const result = PhotoFileSizeFormatter.format(4500000); // ~4.29 MB
			expect(result).toBe('4.29 MB');
		});

		it('should format gigabytes', () => {
			const result = PhotoFileSizeFormatter.format(1073741824); // 1 GB
			expect(result).toBe('1 GB');
		});

		it('should format terabytes', () => {
			const result = PhotoFileSizeFormatter.format(1099511627776); // 1 TB
			expect(result).toBe('1 TB');
		});

		it('should respect custom decimals parameter', () => {
			const result = PhotoFileSizeFormatter.format(1536, 0); // 1.5 KB with 0 decimals
			expect(result).toBe('2 KB');
		});

		it('should handle 3 decimals', () => {
			const result = PhotoFileSizeFormatter.format(1536, 3); // 1.5 KB
			expect(result).toBe('1.5 KB');
		});

		it('should handle negative decimals as 0', () => {
			const result = PhotoFileSizeFormatter.format(1536, -1);
			expect(result).toBe('2 KB');
		});
	});

	describe('toMegabytes', () => {
		it('should convert bytes to megabytes with 2 decimals', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(1048576); // 1 MB
			expect(result).toBe('1.00 MB');
		});

		it('should format typical photo size', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(4500000); // ~4.29 MB
			expect(result).toBe('4.29 MB');
		});

		it('should handle very small sizes', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(1024); // 0.001 MB
			expect(result).toBe('0.00 MB');
		});

		it('should handle zero bytes', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(0);
			expect(result).toBe('0.00 MB');
		});

		it('should handle large sizes', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(20971520); // 20 MB
			expect(result).toBe('20.00 MB');
		});

		it('should handle thumbnail size', () => {
			const result = PhotoFileSizeFormatter.toMegabytes(4096); // ~0.004 MB
			expect(result).toBe('0.00 MB');
		});
	});

	describe('isLargeFile', () => {
		it('should identify large files above default threshold (10 MB)', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(11 * 1024 * 1024); // 11 MB
			expect(result).toBe(true);
		});

		it('should identify small files below default threshold', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(9 * 1024 * 1024); // 9 MB
			expect(result).toBe(false);
		});

		it('should handle files exactly at threshold', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(10 * 1024 * 1024); // 10 MB
			expect(result).toBe(false);
		});

		it('should respect custom threshold', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(6 * 1024 * 1024, 5); // 6 MB with 5 MB threshold
			expect(result).toBe(true);
		});

		it('should handle small custom threshold', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(2 * 1024 * 1024, 1); // 2 MB with 1 MB threshold
			expect(result).toBe(true);
		});

		it('should handle zero bytes', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(0);
			expect(result).toBe(false);
		});

		it('should handle very large files', () => {
			const result = PhotoFileSizeFormatter.isLargeFile(100 * 1024 * 1024); // 100 MB
			expect(result).toBe(true);
		});
	});
});
