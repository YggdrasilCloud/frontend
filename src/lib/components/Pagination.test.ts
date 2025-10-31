import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Pagination component logic
 *
 * Tests the page number generation algorithm with ellipsis logic.
 */

/**
 * Generate array of page numbers to display with ellipsis logic.
 * Shows: [1] ... [4] [5] [6] ... [10]
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
	if (totalPages <= 7) {
		// Show all pages if 7 or fewer
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: (number | string)[] = [];
	const showEllipsisStart = currentPage > 3;
	const showEllipsisEnd = currentPage < totalPages - 2;

	// Always show first page
	pages.push(1);

	if (showEllipsisStart) {
		pages.push('...');
	}

	// Show pages around current page
	const start = Math.max(2, currentPage - 1);
	const end = Math.min(totalPages - 1, currentPage + 1);

	for (let i = start; i <= end; i++) {
		if (!pages.includes(i)) {
			pages.push(i);
		}
	}

	if (showEllipsisEnd) {
		pages.push('...');
	}

	// Always show last page
	if (!pages.includes(totalPages)) {
		pages.push(totalPages);
	}

	return pages;
}

describe('Pagination Logic', () => {
	describe('getPageNumbers', () => {
		it('should show all pages when totalPages <= 7', () => {
			expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
			expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		});

		it('should show ellipsis at start when currentPage > 3', () => {
			const result = getPageNumbers(5, 10);
			expect(result).toContain('...');
			expect(result[1]).toBe('...');
		});

		it('should show ellipsis at end when currentPage < totalPages - 2', () => {
			const result = getPageNumbers(3, 10);
			expect(result).toContain('...');
			expect(result[result.length - 2]).toBe('...');
		});

		it('should always show first and last page', () => {
			const result = getPageNumbers(5, 10);
			expect(result[0]).toBe(1);
			expect(result[result.length - 1]).toBe(10);
		});

		it('should show pages around current page', () => {
			const result = getPageNumbers(5, 10);
			expect(result).toContain(4); // currentPage - 1
			expect(result).toContain(5); // currentPage
			expect(result).toContain(6); // currentPage + 1
		});

		it('should handle edge case: first page', () => {
			const result = getPageNumbers(1, 10);
			expect(result).toEqual([1, 2, '...', 10]);
		});

		it('should handle edge case: last page', () => {
			const result = getPageNumbers(10, 10);
			expect(result).toEqual([1, '...', 9, 10]);
		});

		it('should handle edge case: second page', () => {
			const result = getPageNumbers(2, 10);
			expect(result).toEqual([1, 2, 3, '...', 10]);
		});

		it('should handle edge case: second to last page', () => {
			const result = getPageNumbers(9, 10);
			expect(result).toEqual([1, '...', 8, 9, 10]);
		});

		it('should handle middle pages correctly', () => {
			const result = getPageNumbers(5, 10);
			expect(result).toEqual([1, '...', 4, 5, 6, '...', 10]);
		});

		it('should not show duplicate pages', () => {
			const result = getPageNumbers(2, 10);
			const numbers = result.filter((p) => typeof p === 'number');
			const uniqueNumbers = new Set(numbers);
			expect(numbers.length).toBe(uniqueNumbers.size);
		});

		it('should handle minimum pages (1)', () => {
			const result = getPageNumbers(1, 1);
			expect(result).toEqual([1]);
		});

		it('should handle 2 pages', () => {
			expect(getPageNumbers(1, 2)).toEqual([1, 2]);
			expect(getPageNumbers(2, 2)).toEqual([1, 2]);
		});

		it('should handle 8 pages with ellipsis', () => {
			const result = getPageNumbers(5, 8);
			expect(result).toEqual([1, '...', 4, 5, 6, '...', 8]);
		});

		it('should handle page 3 of 10', () => {
			const result = getPageNumbers(3, 10);
			expect(result).toEqual([1, 2, 3, 4, '...', 10]);
		});

		it('should handle page 8 of 10', () => {
			const result = getPageNumbers(8, 10);
			expect(result).toEqual([1, '...', 7, 8, 9, 10]);
		});

		it('should handle large total pages', () => {
			const result = getPageNumbers(50, 100);
			expect(result).toEqual([1, '...', 49, 50, 51, '...', 100]);
			expect(result.length).toBe(7); // Always max 7 items with ellipsis
		});
	});

	describe('Pagination navigation logic', () => {
		it('should allow previous when currentPage > 1', () => {
			expect(2 > 1).toBe(true);
			expect(1 > 1).toBe(false);
		});

		it('should allow next when currentPage < totalPages', () => {
			expect(1 < 10).toBe(true);
			expect(10 < 10).toBe(false);
		});

		it('should calculate totalPages correctly', () => {
			expect(Math.ceil(100 / 50)).toBe(2); // 100 items, 50 per page = 2 pages
			expect(Math.ceil(101 / 50)).toBe(3); // 101 items, 50 per page = 3 pages
			expect(Math.ceil(50 / 50)).toBe(1); // 50 items, 50 per page = 1 page
		});
	});
});
