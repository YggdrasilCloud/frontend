import { describe, it, expect } from 'vitest';
import { getMediaCategory, isImage, isVideo, getMediaTypeLabel } from './MediaTypeDetector';

describe('MediaTypeDetector', () => {
	describe('isImage', () => {
		it('returns true for image MIME types', () => {
			expect(isImage('image/jpeg')).toBe(true);
			expect(isImage('image/png')).toBe(true);
			expect(isImage('image/gif')).toBe(true);
			expect(isImage('image/webp')).toBe(true);
			expect(isImage('image/svg+xml')).toBe(true);
		});

		it('returns false for non-image MIME types', () => {
			expect(isImage('video/mp4')).toBe(false);
			expect(isImage('application/pdf')).toBe(false);
			expect(isImage('text/plain')).toBe(false);
		});
	});

	describe('isVideo', () => {
		it('returns true for video MIME types', () => {
			expect(isVideo('video/mp4')).toBe(true);
			expect(isVideo('video/webm')).toBe(true);
			expect(isVideo('video/quicktime')).toBe(true);
			expect(isVideo('video/x-msvideo')).toBe(true);
			expect(isVideo('video/x-matroska')).toBe(true);
		});

		it('returns false for non-video MIME types', () => {
			expect(isVideo('image/jpeg')).toBe(false);
			expect(isVideo('application/pdf')).toBe(false);
			expect(isVideo('audio/mpeg')).toBe(false);
		});
	});

	describe('getMediaCategory', () => {
		it('returns "image" for image MIME types', () => {
			expect(getMediaCategory('image/jpeg')).toBe('image');
			expect(getMediaCategory('image/png')).toBe('image');
		});

		it('returns "video" for video MIME types', () => {
			expect(getMediaCategory('video/mp4')).toBe('video');
			expect(getMediaCategory('video/webm')).toBe('video');
		});

		it('returns "unknown" for other MIME types', () => {
			expect(getMediaCategory('application/pdf')).toBe('unknown');
			expect(getMediaCategory('audio/mpeg')).toBe('unknown');
			expect(getMediaCategory('text/plain')).toBe('unknown');
		});
	});

	describe('getMediaTypeLabel', () => {
		it('returns "Image" for image MIME types', () => {
			expect(getMediaTypeLabel('image/jpeg')).toBe('Image');
			expect(getMediaTypeLabel('image/png')).toBe('Image');
		});

		it('returns "Video" for video MIME types', () => {
			expect(getMediaTypeLabel('video/mp4')).toBe('Video');
			expect(getMediaTypeLabel('video/webm')).toBe('Video');
		});

		it('returns "File" for unknown MIME types', () => {
			expect(getMediaTypeLabel('application/pdf')).toBe('File');
			expect(getMediaTypeLabel('audio/mpeg')).toBe('File');
		});
	});
});
