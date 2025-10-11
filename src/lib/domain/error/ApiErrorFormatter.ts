/**
 * ApiErrorFormatter - Service métier pour le formatage des erreurs API
 *
 * Responsabilité unique : transformer les erreurs techniques de l'API
 * en messages utilisateur compréhensibles selon les règles métier.
 */
export class ApiErrorFormatter {
	/**
	 * Formate une erreur API en message utilisateur friendly
	 *
	 * @param error - Erreur brute de l'API
	 * @returns Message formaté pour l'utilisateur
	 */
	static formatError(error: Error): string {
		const message = error.message;

		// Erreurs réseau (backend inaccessible)
		if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
			return 'Unable to connect to the API. Make sure the backend is running.';
		}

		// Erreurs HTTP spécifiques
		if (message.includes('401')) {
			return 'Authentication required. Please log in.';
		}

		if (message.includes('403')) {
			return 'Access denied. You do not have permission to perform this action.';
		}

		if (message.includes('404')) {
			return 'Resource not found.';
		}

		if (message.includes('409')) {
			return 'Conflict detected. The resource may already exist.';
		}

		if (message.includes('422')) {
			return 'Invalid data provided. Please check your input.';
		}

		if (message.includes('500') || message.includes('502') || message.includes('503')) {
			return 'Server error. Please try again later.';
		}

		// Erreur générique si le format n'est pas reconnu
		return `API Error: ${message}`;
	}

	/**
	 * Détermine si une erreur est critique (nécessite intervention utilisateur)
	 *
	 * @param error - Erreur à analyser
	 * @returns true si l'erreur est critique
	 */
	static isCriticalError(error: Error): boolean {
		const message = error.message;
		return (
			message.includes('500') ||
			message.includes('502') ||
			message.includes('503') ||
			message.includes('NetworkError') ||
			message.includes('Failed to fetch')
		);
	}

	/**
	 * Détermine si une erreur nécessite une authentification
	 *
	 * @param error - Erreur à analyser
	 * @returns true si l'erreur est liée à l'authentification
	 */
	static isAuthError(error: Error): boolean {
		const message = error.message;
		return message.includes('401') || message.includes('403');
	}
}
