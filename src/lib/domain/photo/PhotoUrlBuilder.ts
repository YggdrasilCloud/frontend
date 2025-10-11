import type { PhotoDto } from '$lib/api/types';

/**
 * PhotoUrlBuilder - Service métier pour la construction d'URLs de photos
 *
 * Responsabilité unique : construire les URLs d'accès aux photos et thumbnails
 * en appliquant la stratégie d'optimisation (thumbnail first, fallback sur original).
 *
 * Principe : Utilise les thumbnails optimisés (300x300, ~4KB) pour la grille,
 * avec fallback sur l'image originale si le thumbnail n'existe pas.
 */
export class PhotoUrlBuilder {
	private readonly apiBaseUrl: string;

	constructor(apiBaseUrl: string) {
		this.apiBaseUrl = apiBaseUrl;
	}

	/**
	 * Construit l'URL d'affichage optimisée pour une photo
	 *
	 * Stratégie : Privilégie le thumbnail si disponible, sinon utilise l'image originale.
	 *
	 * @param photo - DTO de la photo contenant les URLs
	 * @returns URL complète pour afficher la photo
	 */
	buildDisplayUrl(photo: PhotoDto): string {
		// Stratégie d'optimisation : thumbnail first
		if (photo.thumbnailUrl) {
			return this.buildAbsoluteUrl(photo.thumbnailUrl);
		}

		// Fallback : image originale via endpoint
		return this.buildPhotoFileUrl(photo.id);
	}

	/**
	 * Construit l'URL du thumbnail si disponible
	 *
	 * @param photo - DTO de la photo
	 * @returns URL du thumbnail ou null si non disponible
	 */
	buildThumbnailUrl(photo: PhotoDto): string | null {
		if (!photo.thumbnailUrl) {
			return null;
		}
		return this.buildAbsoluteUrl(photo.thumbnailUrl);
	}

	/**
	 * Construit l'URL de l'image originale
	 *
	 * @param photo - DTO de la photo
	 * @returns URL de l'image originale
	 */
	buildOriginalUrl(photo: PhotoDto): string {
		if (photo.fileUrl) {
			return this.buildAbsoluteUrl(photo.fileUrl);
		}
		// Fallback vers l'endpoint si fileUrl non disponible
		return this.buildPhotoFileUrl(photo.id);
	}

	/**
	 * Construit l'URL de l'endpoint API pour servir le fichier
	 *
	 * @param photoId - ID de la photo
	 * @returns URL de l'endpoint API
	 */
	private buildPhotoFileUrl(photoId: string): string {
		return `${this.apiBaseUrl}/api/photos/${photoId}/file`;
	}

	/**
	 * Construit une URL absolue à partir d'un chemin relatif
	 *
	 * @param relativePath - Chemin relatif (ex: "/uploads/thumbnails/photo.jpg")
	 * @returns URL absolue
	 */
	private buildAbsoluteUrl(relativePath: string): string {
		// Si le chemin est déjà absolu (commence par http), le retourner tel quel
		if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
			return relativePath;
		}

		// Construire l'URL absolue
		return `${this.apiBaseUrl}${relativePath}`;
	}
}
