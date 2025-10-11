import { describe, it, expect } from 'vitest';
import { ApiErrorFormatter } from './ApiErrorFormatter';

describe('ApiErrorFormatter', () => {
	describe('formatError', () => {
		it('should format network errors', () => {
			const error = new Error('NetworkError: Failed to fetch');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Unable to connect to the API. Make sure the backend is running.');
		});

		it('should format fetch failures', () => {
			const error = new Error('Failed to fetch resource');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Unable to connect to the API. Make sure the backend is running.');
		});

		it('should format 401 authentication errors', () => {
			const error = new Error('401 Unauthorized');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Authentication required. Please log in.');
		});

		it('should format 403 authorization errors', () => {
			const error = new Error('403 Forbidden');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Access denied. You do not have permission to perform this action.');
		});

		it('should format 404 not found errors', () => {
			const error = new Error('404 Not Found');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Resource not found.');
		});

		it('should format 422 validation errors', () => {
			const error = new Error('422 Unprocessable Entity');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Invalid data provided. Please check your input.');
		});

		it('should format 500 server errors', () => {
			const error = new Error('500 Internal Server Error');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Server error. Please try again later.');
		});

		it('should format 409 conflict errors', () => {
			const error = new Error('API Error: 409 Conflict');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('Conflict detected. The resource may already exist.');
		});

		it('should format timeout errors as generic errors', () => {
			const error = new Error('Request timeout');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('API Error: Request timeout');
		});

		it('should format CORS errors as generic errors', () => {
			const error = new Error('CORS error: Access denied');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('API Error: CORS error: Access denied');
		});

		it('should return generic error message for unknown errors', () => {
			const error = new Error('Something went wrong');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('API Error: Something went wrong');
		});

		it('should handle empty error messages', () => {
			const error = new Error('');
			const result = ApiErrorFormatter.formatError(error);

			expect(result).toBe('API Error: ');
		});
	});

	describe('isCriticalError', () => {
		it('should identify 500 errors as critical', () => {
			const error = new Error('500 Internal Server Error');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(true);
		});

		it('should identify 503 errors as critical', () => {
			const error = new Error('503 Service Unavailable');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(true);
		});

		it('should identify network errors as critical', () => {
			const error = new Error('NetworkError: Connection failed');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(true);
		});

		it('should not identify 404 errors as critical', () => {
			const error = new Error('404 Not Found');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(false);
		});

		it('should not identify 401 errors as critical', () => {
			const error = new Error('401 Unauthorized');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(false);
		});

		it('should not identify validation errors as critical', () => {
			const error = new Error('Validation failed');
			const result = ApiErrorFormatter.isCriticalError(error);

			expect(result).toBe(false);
		});
	});

	describe('isAuthError', () => {
		it('should identify 401 errors as auth errors', () => {
			const error = new Error('401 Unauthorized');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(true);
		});

		it('should identify 403 errors as auth errors', () => {
			const error = new Error('403 Forbidden');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(true);
		});

		it('should not identify generic authentication messages as auth errors', () => {
			const error = new Error('Authentication failed');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(false);
		});

		it('should not identify generic authorization messages as auth errors', () => {
			const error = new Error('Authorization required');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(false);
		});

		it('should not identify 404 errors as auth errors', () => {
			const error = new Error('404 Not Found');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(false);
		});

		it('should not identify 500 errors as auth errors', () => {
			const error = new Error('500 Internal Server Error');
			const result = ApiErrorFormatter.isAuthError(error);

			expect(result).toBe(false);
		});
	});
});
