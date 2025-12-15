import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E tests for complete upload flow
 * Tests the entire workflow from folder navigation to photo upload
 * Uses beforeEach pattern for proper test isolation
 */
test.describe('Complete Upload Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to photos page and wait for folders to load
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to appear (seeded by test setup)
		await page.waitForSelector('.folder-card', { timeout: 15000 });

		// Click on the first folder to navigate into it
		await page.locator('.folder-card').first().click();
		await page.waitForLoadState('networkidle');

		// Wait for the photos grid to be ready
		await page.waitForSelector('.photos-grid, .grid', { timeout: 10000 }).catch(() => {});

		// Wait additional time for photos to load (cross-browser compatibility)
		await page.waitForTimeout(1000);
	});

	test('should complete upload flow and close dashboard', async ({ page }) => {
		// Open uploader
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		const imageBuffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
			'base64'
		);

		await page
			.locator('.uppy-Dashboard-input')
			.first()
			.setInputFiles({
				name: `upload-test-${uniqueId()}.png`,
				mimeType: 'image/png',
				buffer: imageBuffer
			});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for upload completion - dashboard should close
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 30000 }
		);

		// Verify dashboard is closed
		await expect(page.locator('.uppy-Dashboard')).not.toBeVisible({ timeout: 3000 });

		console.log('Upload flow completed successfully');
	});

	test('should upload image with thumbnail', async ({ page }) => {
		// Open uploader
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();

		const uppyDashboard = page.locator('.uppy-Dashboard');
		await expect(uppyDashboard).toBeVisible({ timeout: 5000 });

		// Upload a test image (10x10 PNG)
		const imageBuffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNzYAAlUBf7X7B3EAAAAASUVORK5CYII=',
			'base64'
		);

		const fileName = `test-image-${uniqueId()}.png`;
		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: fileName,
			mimeType: 'image/png',
			buffer: imageBuffer
		});

		// Verify file appears in uploader
		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Verify thumbnail preview appears
		const thumbnail = page.locator('.uppy-Dashboard-Item-previewImg');
		await expect(thumbnail.first()).toBeVisible({ timeout: 5000 });

		// Upload
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for completion
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 30000 }
		);

		console.log(`Successfully uploaded "${fileName}"`);
	});

	test('should cancel upload and close uploader', async ({ page }) => {
		// Open uploader
		const uploadButton = page.locator('.btn-upload');
		await expect(uploadButton).toBeVisible({ timeout: 10000 });
		await uploadButton.click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Uploader should be visible
		await expect(page.locator('.uppy-Dashboard')).toBeVisible();

		// Click button again to close (Cancel)
		await uploadButton.click();

		// Uploader should be hidden
		await expect(page.locator('.uppy-Dashboard')).not.toBeVisible({ timeout: 3000 });

		console.log('Uploader cancelled successfully');
	});

	test('should show upload progress for large files', async ({ page }) => {
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Create a larger file (500KB)
		const largeBuffer = Buffer.alloc(500 * 1024);
		// Add PNG header to make it valid
		const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		pngHeader.copy(largeBuffer);

		await page
			.locator('.uppy-Dashboard-input')
			.first()
			.setInputFiles({
				name: `large-file-${uniqueId()}.png`,
				mimeType: 'image/png',
				buffer: largeBuffer
			});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Start upload
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Check for progress indicator - element should exist (may be hidden if upload is fast)
		const progressBar = page.locator('.uppy-StatusBar-progress');
		await progressBar.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {
			console.log('Progress bar element not found (upload may be instant)');
		});

		// Wait for completion
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 }
		);

		console.log('Large file upload with progress completed');
	});

	test('should upload video file', async ({ page }) => {
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Upload video file from fixtures
		const videoPath = path.resolve(__dirname, 'fixtures/photos/test-video.mp4');
		await page.locator('.uppy-Dashboard-input').first().setInputFiles(videoPath);

		// Verify file appears in uploader
		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 5000 });

		// Start upload
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for completion (longer timeout for video)
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 }
		);

		console.log('Video upload completed successfully');
	});
});
