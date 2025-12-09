/**
 * UploadConfiguration - Service métier pour la configuration des uploads
 *
 * Responsabilité unique : centraliser toutes les règles métier concernant
 * l'upload de médias (tailles max, types autorisés, nombre de fichiers).
 *
 * Note : Ce service définit les règles MÉTIER, pas les détails techniques
 * de l'upload (qui restent dans les adapters comme UppyUploader).
 */
export class UploadConfiguration {
	/**
	 * Taille maximale par défaut d'un fichier en bytes (100 GB pour Tus)
	 * Cette valeur peut être surchargée via la variable d'environnement PUBLIC_MAX_UPLOAD_SIZE
	 */
	static readonly DEFAULT_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

	/**
	 * Nombre maximum de fichiers uploadables en une fois
	 * Règle métier : limite pour éviter la surcharge serveur
	 */
	static readonly MAX_NUMBER_OF_FILES = 100;

	/**
	 * Types MIME autorisés pour les médias (images et vidéos)
	 * Règle métier : formats supportés par l'application
	 */
	static readonly ALLOWED_MIME_TYPES = [
		// Images
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		// Vidéos
		'video/mp4',
		'video/webm',
		'video/quicktime',
		'video/x-msvideo',
		'video/x-matroska'
	] as const;

	/**
	 * Extensions de fichiers autorisées (pour validation côté client)
	 */
	static readonly ALLOWED_EXTENSIONS = [
		// Images
		'.jpg',
		'.jpeg',
		'.png',
		'.gif',
		'.webp',
		// Vidéos
		'.mp4',
		'.webm',
		'.mov',
		'.avi',
		'.mkv'
	] as const;

	/**
	 * ID propriétaire par défaut (temporaire jusqu'à implémentation de l'auth)
	 * Règle métier : UUID null pour les photos sans propriétaire
	 */
	static readonly DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000000';

	/**
	 * Parse la taille maximale depuis une variable d'environnement
	 *
	 * @param envValue - Valeur de la variable d'environnement (peut être undefined)
	 * @returns Taille en bytes
	 */
	static parseMaxFileSize(envValue: string | undefined): number {
		if (!envValue) {
			return this.DEFAULT_MAX_FILE_SIZE_BYTES;
		}
		const parsed = parseInt(envValue, 10);
		return isNaN(parsed) || parsed <= 0 ? this.DEFAULT_MAX_FILE_SIZE_BYTES : parsed;
	}

	/**
	 * Construit l'endpoint d'upload Tus
	 *
	 * @param apiBaseUrl - URL de base de l'API
	 * @returns URL complète de l'endpoint Tus
	 */
	static buildTusEndpoint(apiBaseUrl: string): string {
		return `${apiBaseUrl}/api/uploads/tus`;
	}

	/**
	 * Construit les métadonnées pour un upload Tus
	 *
	 * @param folderId - ID du dossier destination
	 * @param ownerId - ID du propriétaire (optionnel)
	 * @returns Objet de métadonnées pour Tus
	 */
	static buildUploadMetadata(folderId: string, ownerId?: string): Record<string, string> {
		return {
			folderId,
			ownerId: ownerId ?? this.DEFAULT_OWNER_ID
		};
	}

	/**
	 * Valide qu'un fichier respecte les règles métier d'upload
	 *
	 * @param file - Fichier à valider
	 * @param maxFileSize - Taille maximale autorisée (optionnel, utilise DEFAULT_MAX_FILE_SIZE_BYTES par défaut)
	 * @returns Résultat de validation avec message d'erreur si invalide
	 */
	static validateFile(
		file: File,
		maxFileSize: number = this.DEFAULT_MAX_FILE_SIZE_BYTES
	): { isValid: boolean; error?: string } {
		// Vérifier le type MIME
		const allowedTypes = this.ALLOWED_MIME_TYPES as readonly string[];
		if (!allowedTypes.includes(file.type)) {
			return {
				isValid: false,
				error: `File type "${file.type}" is not allowed. Supported types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
			};
		}

		// Vérifier la taille
		if (file.size > maxFileSize) {
			return {
				isValid: false,
				error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxFileSize)})`
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
	 * Formate une taille de fichier en format human-readable
	 *
	 * @param bytes - Taille en bytes
	 * @returns Taille formatée (ex: "20 MB", "1.5 GB")
	 */
	static formatFileSize(bytes: number): string {
		if (bytes >= 1024 * 1024 * 1024) {
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
	}

	/**
	 * Formate la taille maximale par défaut en format human-readable
	 *
	 * @returns Taille maximale formatée (ex: "100 GB")
	 */
	static getDefaultMaxFileSizeFormatted(): string {
		return this.formatFileSize(this.DEFAULT_MAX_FILE_SIZE_BYTES);
	}
}
