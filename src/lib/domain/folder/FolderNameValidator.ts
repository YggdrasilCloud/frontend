/**
 * FolderNameValidator - Service métier pour la validation des noms de dossiers
 *
 * Responsabilité unique : valider les noms de dossiers selon les règles métier
 * de l'application (longueur, caractères interdits, etc.).
 */
export class FolderNameValidator {
	// Règles métier
	private static readonly MIN_LENGTH = 1;
	private static readonly MAX_LENGTH = 255;
	private static readonly FORBIDDEN_CHARS = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
	private static readonly RESERVED_NAMES = ['.', '..', 'CON', 'PRN', 'AUX', 'NUL'];

	/**
	 * Valide un nom de dossier selon les règles métier
	 *
	 * @param name - Nom du dossier à valider
	 * @returns Objet contenant isValid et message d'erreur si invalide
	 */
	static validate(name: string): ValidationResult {
		// Vérifier si vide
		if (!name || name.trim().length === 0) {
			return {
				isValid: false,
				error: 'Folder name cannot be empty'
			};
		}

		const trimmedName = name.trim();

		// Vérifier la longueur minimale
		if (trimmedName.length < this.MIN_LENGTH) {
			return {
				isValid: false,
				error: `Folder name must be at least ${this.MIN_LENGTH} character long`
			};
		}

		// Vérifier la longueur maximale
		if (trimmedName.length > this.MAX_LENGTH) {
			return {
				isValid: false,
				error: `Folder name cannot exceed ${this.MAX_LENGTH} characters`
			};
		}

		// Vérifier les caractères interdits
		for (const char of this.FORBIDDEN_CHARS) {
			if (trimmedName.includes(char)) {
				return {
					isValid: false,
					error: `Folder name cannot contain the character: ${char}`
				};
			}
		}

		// Vérifier les noms réservés
		if (this.RESERVED_NAMES.includes(trimmedName.toUpperCase())) {
			return {
				isValid: false,
				error: `"${trimmedName}" is a reserved name and cannot be used`
			};
		}

		return {
			isValid: true
		};
	}

	/**
	 * Nettoie un nom de dossier en appliquant les règles métier
	 *
	 * @param name - Nom du dossier brut
	 * @returns Nom nettoyé et valide
	 */
	static sanitize(name: string): string {
		let sanitized = name.trim();

		// Remplacer les caractères interdits par des tirets
		for (const char of this.FORBIDDEN_CHARS) {
			sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '-');
		}

		// Tronquer si trop long
		if (sanitized.length > this.MAX_LENGTH) {
			sanitized = sanitized.substring(0, this.MAX_LENGTH);
		}

		return sanitized;
	}
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
	isValid: boolean;
	error?: string;
}
