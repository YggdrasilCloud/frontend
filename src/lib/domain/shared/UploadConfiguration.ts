/**
 * UploadConfiguration - Service métier pour la configuration des uploads
 *
 * Responsabilité unique : centraliser toutes les règles métier concernant
 * l'upload de photos (tailles max, types autorisés, nombre de fichiers).
 *
 * Note : Ce service définit les règles MÉTIER, pas les détails techniques
 * de l'upload (qui restent dans les adapters comme UppyUploader).
 */
export class UploadConfiguration {
	/**
	 * Taille maximale d'un fichier photo en bytes (20 MB)
	 * Règle métier : limite imposée par l'infrastructure backend
	 */
	static readonly MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

	/**
	 * Nombre maximum de fichiers uploadables en une fois
	 * Règle métier : limite pour éviter la surcharge serveur
	 */
	static readonly MAX_NUMBER_OF_FILES = 100;

	/**
	 * Types MIME autorisés pour les photos
	 * Règle métier : formats d'image supportés par l'application
	 */
	static readonly ALLOWED_MIME_TYPES = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp'
	] as const;

	/**
	 * Extensions de fichiers autorisées (pour validation côté client)
	 */
	static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;

	/**
	 * Nom du champ de formulaire pour l'upload de photo
	 * Règle métier : convention définie par l'API backend
	 */
	static readonly UPLOAD_FIELD_NAME = 'photo';

	/**
	 * ID propriétaire par défaut (temporaire jusqu'à implémentation de l'auth)
	 * Règle métier : UUID null pour les photos sans propriétaire
	 */
	static readonly DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000000';

	/**
	 * Construit l'endpoint d'upload pour un dossier donné
	 *
	 * @param apiBaseUrl - URL de base de l'API
	 * @param folderId - ID du dossier destination
	 * @returns URL complète de l'endpoint d'upload
	 */
	static buildUploadEndpoint(apiBaseUrl: string, folderId: string): string {
		return `${apiBaseUrl}/api/folders/${folderId}/photos`;
	}

	/**
	 * Valide qu'un fichier respecte les règles métier d'upload
	 *
	 * @param file - Fichier à valider
	 * @returns Résultat de validation avec message d'erreur si invalide
	 */
	static validateFile(file: File): { isValid: boolean; error?: string } {
		// Vérifier le type MIME
		const allowedTypes = this.ALLOWED_MIME_TYPES as readonly string[];
		if (!allowedTypes.includes(file.type)) {
			return {
				isValid: false,
				error: `File type "${file.type}" is not allowed. Supported types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
			};
		}

		// Vérifier la taille
		if (file.size > this.MAX_FILE_SIZE_BYTES) {
			return {
				isValid: false,
				error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size (${this.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)`
			};
		}

		// Vérifier que le fichier n'est pas vide
		if (file.size === 0) {
			return {
				isValid: false,
				error: 'File is empty'
			};
		}

		return { isValid: true };
	}

	/**
	 * Formate la taille maximale en format human-readable
	 *
	 * @returns Taille maximale formatée (ex: "20 MB")
	 */
	static getMaxFileSizeFormatted(): string {
		return `${this.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`;
	}
}
