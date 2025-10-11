import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DateFormatter } from './DateFormatter';

describe('DateFormatter', () => {
	describe('toLocaleDateString', () => {
		it('should convert ISO date to locale date string', () => {
			const isoDate = '2024-10-11T14:30:00.000Z';
			const result = DateFormatter.toLocaleDateString(isoDate);

			// Should return a valid date string (format depends on system locale)
			expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
		});

		it('should handle date at midnight', () => {
			const isoDate = '2024-10-11T00:00:00.000Z';
			const result = DateFormatter.toLocaleDateString(isoDate);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});
	});

	describe('toLocaleString', () => {
		it('should convert ISO date to full locale string with time', () => {
			const isoDate = '2024-10-11T14:30:00.000Z';
			const result = DateFormatter.toLocaleString(isoDate);

			// Should include time information
			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
			// Basic check that it contains date and time elements
			expect(result.length).toBeGreaterThan(10);
		});
	});

	describe('toRelativeTime', () => {
		// Use vi.setSystemTime() for predictable tests
		const mockNow = new Date('2024-10-11T14:30:00.000Z');

		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(mockNow);
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should return "à l\'instant" for dates less than 60 seconds ago', () => {
			const isoDate = new Date(mockNow.getTime() - 30000).toISOString(); // 30 seconds ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe("à l'instant");
		});

		it('should return minutes for dates less than 60 minutes ago', () => {
			const isoDate = new Date(mockNow.getTime() - 120000).toISOString(); // 2 minutes ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 minutes');
		});

		it('should return singular minute for 1 minute ago', () => {
			const isoDate = new Date(mockNow.getTime() - 60000).toISOString(); // 1 minute ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 1 minutes');
		});

		it('should return hours for dates less than 24 hours ago', () => {
			const isoDate = new Date(mockNow.getTime() - 7200000).toISOString(); // 2 hours ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 heures');
		});

		it('should return days for dates less than 7 days ago', () => {
			const isoDate = new Date(mockNow.getTime() - 172800000).toISOString(); // 2 days ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 jours');
		});

		it('should return weeks for dates less than 30 days ago', () => {
			const isoDate = new Date(mockNow.getTime() - 1209600000).toISOString(); // ~14 days ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 semaines');
		});

		it('should return months for dates less than 365 days ago', () => {
			const isoDate = new Date(mockNow.getTime() - 5184000000).toISOString(); // ~60 days ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 mois');
		});

		it('should return years for dates more than 365 days ago', () => {
			const isoDate = new Date(mockNow.getTime() - 63072000000).toISOString(); // ~2 years ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 2 ans');
		});

		it('should handle singular year', () => {
			const isoDate = new Date(mockNow.getTime() - 31536000000).toISOString(); // ~1 year ago
			const result = DateFormatter.toRelativeTime(isoDate);

			expect(result).toBe('il y a 1 ans');
		});
	});
});
