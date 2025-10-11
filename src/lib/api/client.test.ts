import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './client';

// Mock SvelteKit env module
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_URL: 'http://localhost:8000'
	}
}));

describe('ApiClient', () => {
	let client: ApiClient;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		client = new ApiClient();
		fetchMock = vi.fn();
		global.fetch = fetchMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with default base URL', () => {
			const newClient = new ApiClient();
			expect(newClient).toBeInstanceOf(ApiClient);
		});
	});

	describe('setToken', () => {
		it('should set authentication token', () => {
			const token = 'test-jwt-token';
			client.setToken(token);
			// Token is set internally, we'll verify it's used in requests
			expect(client).toBeDefined();
		});
	});

	describe('get', () => {
		it('should make GET request and return JSON data', async () => {
			const mockData = { id: '1', name: 'Test' };
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData
			});

			const result = await client.get('/api/test');

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('/api/test'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);
			expect(result).toEqual(mockData);
		});

		it('should include Authorization header when token is set', async () => {
			const token = 'test-token';
			client.setToken(token);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.get('/api/test');

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${token}`
					})
				})
			);
		});

		it('should throw error on non-ok response', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(client.get('/api/test')).rejects.toThrow('API Error: 404 Not Found');
		});

		it('should throw error on 500 response', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(client.get('/api/test')).rejects.toThrow('API Error: 500 Internal Server Error');
		});
	});

	describe('post', () => {
		it('should make POST request with JSON body', async () => {
			const mockData = { id: '1', name: 'Created' };
			const postData = { name: 'New Item' };

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData
			});

			const result = await client.post('/api/test', postData);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('/api/test'),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					}),
					body: JSON.stringify(postData)
				})
			);
			expect(result).toEqual(mockData);
		});

		it('should include Authorization header in POST when token is set', async () => {
			const token = 'test-token';
			client.setToken(token);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.post('/api/test', { data: 'test' });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${token}`
					})
				})
			);
		});

		it('should throw error on POST non-ok response', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 400,
				statusText: 'Bad Request'
			});

			await expect(client.post('/api/test', {})).rejects.toThrow('API Error: 400 Bad Request');
		});

		it('should handle empty POST body', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true })
			});

			const result = await client.post('/api/test', {});

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({})
				})
			);
			expect(result).toEqual({ success: true });
		});
	});

	describe('postFormData', () => {
		it('should make POST request with FormData', async () => {
			const mockData = { id: '1', fileName: 'test.jpg' };
			const formData = new FormData();
			formData.append('file', new Blob(['test']), 'test.jpg');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData
			});

			const result = await client.postFormData('/api/upload', formData);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('/api/upload'),
				expect.objectContaining({
					method: 'POST',
					body: formData
				})
			);
			expect(result).toEqual(mockData);
		});

		it('should not set Content-Type header for FormData (browser sets it)', async () => {
			const formData = new FormData();
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.postFormData('/api/upload', formData);

			const callArgs = fetchMock.mock.calls[0][1];
			expect(callArgs.headers['Content-Type']).toBeUndefined();
		});

		it('should include Authorization header in FormData POST when token is set', async () => {
			const token = 'test-token';
			client.setToken(token);

			const formData = new FormData();
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.postFormData('/api/upload', formData);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${token}`
					})
				})
			);
		});

		it('should throw error on FormData POST non-ok response', async () => {
			const formData = new FormData();
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 413,
				statusText: 'Payload Too Large'
			});

			await expect(client.postFormData('/api/upload', formData)).rejects.toThrow(
				'API Error: 413 Payload Too Large'
			);
		});
	});

	describe('error handling', () => {
		it('should handle network errors', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			await expect(client.get('/api/test')).rejects.toThrow('Network error');
		});

		it('should handle fetch timeout', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Timeout'));

			await expect(client.post('/api/test', {})).rejects.toThrow('Timeout');
		});

		it('should handle invalid JSON response', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error('Invalid JSON');
				}
			});

			await expect(client.get('/api/test')).rejects.toThrow('Invalid JSON');
		});
	});

	describe('base URL configuration', () => {
		it('should construct full URL with base URL', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.get('/api/test');

			const calledUrl = fetchMock.mock.calls[0][0];
			expect(calledUrl).toMatch(/^http:\/\/.+\/api\/test$/);
		});

		it('should handle paths with leading slash', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await client.get('/api/folders');

			const calledUrl = fetchMock.mock.calls[0][0];
			expect(calledUrl).toContain('/api/folders');
		});
	});
});
