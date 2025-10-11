/**
 * DateFormatter - Service métier pour le formatage des dates
 *
 * Responsabilité unique : transformer des dates ISO en format localisé
 * selon les règles métier de l'application.
 */
export class DateFormatter {
	/**
	 * Formate une date ISO en format localisé court
	 *
	 * @param isoDate - Date au format ISO 8601 (ex: "2024-10-11T12:34:56Z")
	 * @returns Date formatée selon la locale du navigateur (ex: "11/10/2024")
	 */
	static toLocaleDateString(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString();
	}

	/**
	 * Formate une date ISO en format complet avec heure
	 *
	 * @param isoDate - Date au format ISO 8601
	 * @returns Date et heure formatées (ex: "11/10/2024, 12:34:56")
	 */
	static toLocaleString(isoDate: string): string {
		return new Date(isoDate).toLocaleString();
	}

	/**
	 * Formate une date en format relatif (ex: "il y a 2 jours")
	 *
	 * @param isoDate - Date au format ISO 8601
	 * @returns Format relatif en français
	 */
	static toRelativeTime(isoDate: string): string {
		const date = new Date(isoDate);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return "à l'instant";
		if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} minutes`;
		if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} heures`;
		if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} jours`;
		if (diffInSeconds < 2592000) return `il y a ${Math.floor(diffInSeconds / 604800)} semaines`;
		if (diffInSeconds < 31536000) return `il y a ${Math.floor(diffInSeconds / 2592000)} mois`;

		return `il y a ${Math.floor(diffInSeconds / 31536000)} ans`;
	}
}
