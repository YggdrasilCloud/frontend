/**
 * PhotoFileSizeFormatter - Service métier pour le formatage des tailles de fichiers
 *
 * Responsabilité unique : transformer les tailles de fichiers en bytes
 * en format lisible par l'utilisateur (KB, MB, GB).
 */
export class PhotoFileSizeFormatter {
	/**
	 * Formate une taille en bytes vers un format human-readable
	 *
	 * @param sizeInBytes - Taille du fichier en bytes
	 * @param decimals - Nombre de décimales (défaut: 2)
	 * @returns Taille formatée avec unité (ex: "2.45 MB")
	 */
	static format(sizeInBytes: number, decimals: number = 2): string {
		if (sizeInBytes === 0) return '0 Bytes';

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

		const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));

		return `${parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	/**
	 * Formate spécifiquement en MB (pour les photos)
	 *
	 * @param sizeInBytes - Taille du fichier en bytes
	 * @returns Taille formatée en MB (ex: "2.45 MB")
	 */
	static toMegabytes(sizeInBytes: number): string {
		const sizeInMB = sizeInBytes / (1024 * 1024);
		return `${sizeInMB.toFixed(2)} MB`;
	}

	/**
	 * Détermine si un fichier est considéré comme "large"
	 *
	 * @param sizeInBytes - Taille du fichier en bytes
	 * @param thresholdMB - Seuil en MB (défaut: 10 MB)
	 * @returns true si le fichier dépasse le seuil
	 */
	static isLargeFile(sizeInBytes: number, thresholdMB: number = 10): boolean {
		const sizeInMB = sizeInBytes / (1024 * 1024);
		return sizeInMB > thresholdMB;
	}
}
