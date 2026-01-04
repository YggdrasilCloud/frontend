import { env } from '$env/dynamic/public';

export class ApiClient {
	private baseUrl: string;
	private token: string | null = null;

	constructor() {
		this.baseUrl = env.PUBLIC_API_URL || 'http://localhost:8000';
	}

	setToken(token: string) {
		this.token = token;
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		return headers;
	}

	async get<T>(path: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method: 'GET',
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async post<T>(path: string, data: unknown): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async postFormData<T>(path: string, formData: FormData): Promise<T> {
		const headers: HeadersInit = {};
		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		const response = await fetch(`${this.baseUrl}${path}`, {
			method: 'POST',
			headers,
			body: formData
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async patch<T>(path: string, data: unknown): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method: 'PATCH',
			headers: this.getHeaders(),
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async delete<T>(path: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method: 'DELETE',
			headers: this.getHeaders()
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}
}

export const apiClient = new ApiClient();
