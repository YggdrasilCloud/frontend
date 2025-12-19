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
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await expect(videoThumbnail).toBeVisible({ timeout: 10000 });
		await videoThumbnail.click();

		// Lightbox should open
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Video player container should be visible
		const videoContainer = lightbox.locator('[data-shaka-player-container]');
		await expect(videoContainer).toBeVisible({ timeout: 10000 });

		console.log('Video opened in lightbox successfully');
	});

	test('should display video element with Shaka Player', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Video element should be present with Shaka Player attribute
		const videoElement = lightbox.locator('video[data-shaka-player]');
		await expect(videoElement).toBeVisible({ timeout: 10000 });

		console.log('Shaka Player video element rendered successfully');
	});

	test('should show Shaka Player UI controls', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox and video
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });
		await expect(lightbox.locator('[data-shaka-player-container]')).toBeVisible({ timeout: 10000 });

		// Wait for Shaka UI to initialize (loading should disappear)
		await page.waitForFunction(
			() => {
				const lightboxEl = document.querySelector('.lightbox-overlay');
				const loading = lightboxEl?.querySelector('.video-loading');
				return !loading;
			},
			{ timeout: 30000 }
		);

		// Shaka Player controls should be present
		const shakaControls = lightbox.locator('.shaka-controls-container, .shaka-bottom-controls');
		await expect(shakaControls.first()).toBeVisible({ timeout: 10000 });

		console.log('Shaka Player UI controls displayed successfully');
	});

	test('should hide loading indicator after video loads', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Loading indicator should eventually disappear
		await page.waitForFunction(
			() => {
				const lightboxEl = document.querySelector('.lightbox-overlay');
				const loading = lightboxEl?.querySelector('.video-loading');
				return !loading;
			},
			{ timeout: 30000 }
		);

		// Verify loading is gone
		await expect(lightbox.locator('.video-loading')).not.toBeVisible();

		console.log('Video loading completed, indicator hidden');
	});

	test('should close lightbox with Escape key', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
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
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Click close button (inside lightbox)
		const closeButton = lightbox.locator('.close-button');
		await closeButton.click();

		// Lightbox should be closed
		await expect(lightbox).not.toBeVisible({ timeout: 3000 });

		console.log('Lightbox closed with close button');
	});

	test('should have video player container when opening video', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Video player container should be present (it exists even if video fails to load)
		const videoContainer = lightbox.locator('[data-shaka-player-container]');
		await expect(videoContainer).toBeVisible({ timeout: 10000 });

		console.log('Video player container present for video file');
	});

	test('should display video filename in lightbox info', async ({ page }) => {
		// Find the uploaded video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Photo info should show the filename (use lightbox-specific selector)
		const photoInfo = lightbox.locator('.photo-info .photo-name');
		await expect(photoInfo).toBeVisible();

		// Filename should match the uploaded video name
		const filename = await photoInfo.textContent();
		expect(filename).toBe(uploadedVideoName);

		console.log(`Video filename displayed: ${filename}`);
	});

	test('should navigate between items in lightbox', async ({ page }) => {
		// The folder already has images from the seed, and a video from beforeEach
		// Open the video by its filename
		const videoThumbnail = page.locator(
			`.photo-card:has(.photo-name:text("${uploadedVideoName}"))`
		);
		await videoThumbnail.click();

		// Wait for lightbox
		const lightbox = page.locator('.lightbox-overlay');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Check the counter shows we're on item 1
		const counter = lightbox.locator('.photo-counter');
		await expect(counter).toBeVisible();
		const initialCounter = await counter.textContent();
		expect(initialCounter).toMatch(/1 \/ \d+/);

		// Navigate to next item
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(500);

		// Counter should change to show we're on item 2
		const newCounter = await counter.textContent();
		expect(newCounter).toMatch(/2 \/ \d+/);

		console.log(`Navigation works: ${initialCounter} -> ${newCounter}`);
	});
});
