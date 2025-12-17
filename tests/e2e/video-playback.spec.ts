import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E tests for video playback in lightbox
 * Tests the video player functionality with Shaka Player
 */
test.describe('Video Playback', () => {
	let uploadedVideoName: string;

	test.beforeEach(async ({ page }) => {
		// Navigate to photos page and wait for folders to load
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to appear
		await page.waitForSelector('.folder-card', { timeout: 15000 });

		// Click on the first folder to navigate into it
		await page.locator('.folder-card').first().click();
		await page.waitForLoadState('networkidle');

		// Wait for the photos grid to be ready
		await page.waitForSelector('.photos-grid, .grid', { timeout: 10000 }).catch(() => {});
		await page.waitForTimeout(1000);

		// Upload a video for testing
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Upload video file from fixtures
		const videoPath = path.resolve(__dirname, 'fixtures/photos/test-video.mp4');
		uploadedVideoName = `test-video-${uniqueId()}.mp4`;

		await page
			.locator('.uppy-Dashboard-input')
			.first()
			.setInputFiles({
				name: uploadedVideoName,
				mimeType: 'video/mp4',
				buffer: await import('fs').then((fs) => fs.readFileSync(videoPath))
			});

		// Wait for file to appear and upload
		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 5000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for upload completion
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 }
		);

		// Wait for the grid to refresh with the new video
		await page.waitForTimeout(2000);
	});

	test('should open video in lightbox', async ({ page }) => {
		// Find and click on a video thumbnail (videos have video mime type)
		const videoThumbnail = page.locator('.photo-card').last();
		await expect(videoThumbnail).toBeVisible({ timeout: 10000 });
		await videoThumbnail.click();

		// Lightbox should open
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Video player container should be visible
		const videoContainer = page.locator('[data-shaka-player-container]');
		await expect(videoContainer).toBeVisible({ timeout: 10000 });

		console.log('Video opened in lightbox successfully');
	});

	test('should display video element with Shaka Player', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		await expect(page.locator('.lightbox-overlay')).toBeVisible({ timeout: 5000 });

		// Video element should be present with Shaka Player attribute
		const videoElement = page.locator('video[data-shaka-player]');
		await expect(videoElement).toBeVisible({ timeout: 10000 });

		console.log('Shaka Player video element rendered successfully');
	});

	test('should show Shaka Player UI controls', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox and video
		await expect(page.locator('.lightbox-overlay')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('[data-shaka-player-container]')).toBeVisible({ timeout: 10000 });

		// Wait for Shaka UI to initialize (loading should disappear)
		await page.waitForFunction(
			() => {
				const loading = document.querySelector('.video-loading');
				return !loading;
			},
			{ timeout: 30000 }
		);

		// Shaka Player controls should be present
		const shakaControls = page.locator('.shaka-controls-container, .shaka-bottom-controls');
		await expect(shakaControls.first()).toBeVisible({ timeout: 10000 });

		console.log('Shaka Player UI controls displayed successfully');
	});

	test('should hide loading indicator after video loads', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		await expect(page.locator('.lightbox-overlay')).toBeVisible({ timeout: 5000 });

		// Loading indicator should eventually disappear
		await page.waitForFunction(
			() => {
				const loading = document.querySelector('.video-loading');
				return !loading;
			},
			{ timeout: 30000 }
		);

		// Verify loading is gone
		await expect(page.locator('.video-loading')).not.toBeVisible();

		console.log('Video loading completed, indicator hidden');
	});

	test('should close lightbox with Escape key', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Press Escape to close
		await page.keyboard.press('Escape');

		// Lightbox should be closed
		await expect(lightbox).not.toBeVisible({ timeout: 3000 });

		console.log('Lightbox closed with Escape key');
	});

	test('should close lightbox with close button', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Click close button
		const closeButton = page.locator('.close-button');
		await closeButton.click();

		// Lightbox should be closed
		await expect(lightbox).not.toBeVisible({ timeout: 3000 });

		console.log('Lightbox closed with close button');
	});

	test('should not show error state for valid video', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		await expect(page.locator('.lightbox-overlay')).toBeVisible({ timeout: 5000 });

		// Wait for video to attempt loading
		await page.waitForTimeout(3000);

		// Error state should not be visible
		const errorState = page.locator('.video-error');
		await expect(errorState).not.toBeVisible();

		console.log('No error state for valid video');
	});

	test('should display video filename in lightbox info', async ({ page }) => {
		// Click on video thumbnail
		const videoThumbnail = page.locator('.photo-card').last();
		await videoThumbnail.click();

		// Wait for lightbox
		await expect(page.locator('.lightbox-overlay')).toBeVisible({ timeout: 5000 });

		// Photo info should show the filename
		const photoInfo = page.locator('.photo-info .photo-name');
		await expect(photoInfo).toBeVisible();

		// Filename should contain video extension
		const filename = await photoInfo.textContent();
		expect(filename).toMatch(/\.(mp4|mov|webm|mkv|avi)$/i);

		console.log(`Video filename displayed: ${filename}`);
	});
});
