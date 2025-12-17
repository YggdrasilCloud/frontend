/**
 * Utility for detecting media types based on MIME type
 */

export type MediaCategory = 'image' | 'video' | 'unknown';

const IMAGE_MIME_PREFIXES = ['image/'];
const VIDEO_MIME_PREFIXES = ['video/'];

/**
 * Determines the media category based on MIME type
 */
export function getMediaCategory(mimeType: string): MediaCategory {
	if (isImage(mimeType)) return 'image';
	if (isVideo(mimeType)) return 'video';
	return 'unknown';
}

/**
 * Checks if the MIME type represents an image
 */
export function isImage(mimeType: string): boolean {
	return IMAGE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

/**
 * Checks if the MIME type represents a video
 */
export function isVideo(mimeType: string): boolean {
	return VIDEO_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

/**
 * Gets a human-readable media type label
 */
export function getMediaTypeLabel(mimeType: string): string {
	const category = getMediaCategory(mimeType);
	switch (category) {
		case 'image':
			return 'Image';
		case 'video':
			return 'Video';
		default:
			return 'File';
	}
}
