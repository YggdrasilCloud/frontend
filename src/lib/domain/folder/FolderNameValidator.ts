/**
 * FolderNameValidator - Service métier pour la validation des noms de dossiers
 *
 * Responsabilité unique : validation UX basique côté client.
 * Le backend gère la validation complète des caractères et noms réservés.
 */
export class FolderNameValidator {
	// Règles UX basiques
	private static readonly MAX_LENGTH = 255;

	/**
	 * Valide un nom de dossier selon les règles UX basiques
	 * Le backend effectue la validation métier complète.
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

		// Vérifier la longueur maximale
		if (trimmedName.length > this.MAX_LENGTH) {
			return {
				isValid: false,
				error: `Folder name cannot exceed ${this.MAX_LENGTH} characters`
			};
		}

		return {
			isValid: true
		};
	}

	/**
	 * Nettoie un nom de dossier en appliquant les règles UX basiques
	 *
	 * @param name - Nom du dossier brut
	 * @returns Nom nettoyé
	 */
	static sanitize(name: string): string {
		let sanitized = name.trim();

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
