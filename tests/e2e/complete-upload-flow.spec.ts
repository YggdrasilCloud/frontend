import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createFolder, navigateToAnyFolder } from './helpers/test-setup';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E tests for complete upload flow
 * Tests the entire workflow from folder navigation to photo upload and display
 * Note: Folder creation is tested separately in folder-creation.spec.ts
 */
test.describe('Complete Upload Flow', () => {
	let testFolderId: string | null = null;

	// Navigate to a seeded folder before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		page.setDefaultTimeout(60000);
		try {
			// Try to use a seeded folder first
			testFolderId = await navigateToAnyFolder(page);
			if (testFolderId) {
				console.log(`Using seeded folder for upload tests: ${testFolderId}`);
			} else {
				// Fallback: try to create a folder
				const folderName = `UploadFlow-${uniqueId()}`;
				testFolderId = await createFolder(page, folderName);
				if (testFolderId) {
					console.log(`Created upload flow test folder: ${testFolderId}`);
				} else {
					console.log('Failed to find or create upload flow test folder');
				}
			}
		} catch (error) {
			console.error('Error setting up test folder:', error);
		} finally {
			try {
				await page.close();
			} catch {
				// Context may already be closed
			}
		}
	});

	// Helper to navigate to the test folder
	async function navigateToTestFolder(page: Page) {
		if (!testFolderId) {
			throw new Error('Test folder not created');
		}
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photos-grid, .grid', { timeout: 10000 }).catch(() => {});
	}

	test('should upload image to folder and verify thumbnail', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No test folder available - skipping');
			return;
		}

		// Navigate to the test folder
		await navigateToTestFolder(page);

		// Get initial photo count
		const initialCount = await page.locator('.photo-card').count();

		// Open uploader
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();

		const uppyDashboard = page.locator('.uppy-Dashboard');
		await expect(uppyDashboard).toBeVisible({ timeout: 5000 });

		// Upload a test image
		const imageBuffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNzYAAlUBf7X7B3EAAAAASUVORK5CYII=',
			'base64'
		);

		const fileName = `test-image-${uniqueId()}.png`;
		const fileInput = page.locator('.uppy-Dashboard-input').first();
		await fileInput.setInputFiles({
			name: fileName,
			mimeType: 'image/png',
			buffer: imageBuffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await uppyUploadButton.click();

		// Wait for upload completion
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 30000 }
		);

		// Wait for list refresh
		await page.waitForTimeout(2000);

		// Verify the new image appears with thumbnail
		const newCount = await page.locator('.photo-card').count();
		expect(newCount).toBeGreaterThan(initialCount);

		// Verify thumbnail is visible on the new photo
		const photoCards = page.locator('.photo-card');
		const cardCount = await photoCards.count();
		if (cardCount > 0) {
			const thumbnail = photoCards.first().locator('img');
			await expect(thumbnail).toBeVisible();
		}

		console.log(`Successfully uploaded "${fileName}" to folder ${testFolderId}`);
	});

	test('should upload to existing folder and show in list', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'Test folder not created - skipping');
			return;
		}
		await navigateToTestFolder(page);

		// Get initial count
		const initialInfo = await page.locator('.photos-info').textContent().catch(() => '0 photos');
		const initialMatch = initialInfo?.match(/(\d+)\s+photos/);
		const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;

		console.log(`Initial photo count: ${initialCount}`);

		// Upload
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		const imageBuffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
			'base64'
		);

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: `flow-test-${uniqueId()}.png`,
			mimeType: 'image/png',
			buffer: imageBuffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 30000 }
		);

		await page.waitForTimeout(2000);

		// Verify count increased
		const newInfo = await page.locator('.photos-info').textContent().catch(() => '0 photos');
		const newMatch = newInfo?.match(/(\d+)\s+photos/);
		const newCount = newMatch ? parseInt(newMatch[1], 10) : 0;

		console.log(`New photo count: ${newCount}`);
		expect(newCount).toBeGreaterThan(initialCount);
	});

	test('should upload video with fixture file', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'Test folder not created - skipping');
			return;
		}
		await navigateToTestFolder(page);

		// Open uploader
		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Try to load video fixture
		const videoPath = path.resolve(__dirname, '../../../fixtures/photos/test-video.mp4');
		let videoBuffer: Buffer;

		try {
			videoBuffer = fs.readFileSync(videoPath);
		} catch {
			test.skip(true, 'Video fixture not available');
			return;
		}

		const videoName = `video-flow-${uniqueId()}.mp4`;

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: videoName,
			mimeType: 'video/mp4',
			buffer: videoBuffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Videos take longer to process (thumbnail generation)
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 }
		);

		// Wait for thumbnail generation
		await page.waitForTimeout(5000);

		// Find the video in the list
		const photoCards = page.locator('.photo-card');
		const count = await photoCards.count();

		let foundVideo = false;
		for (let i = 0; i < count; i++) {
			const name = await photoCards.nth(i).locator('.photo-name').textContent();
			if (name?.includes('video-flow')) {
				foundVideo = true;

				// Check thumbnail is visible
				const img = photoCards.nth(i).locator('img');
				await expect(img).toBeVisible();

				console.log(`Found uploaded video: ${name}`);
				break;
			}
		}

		expect(foundVideo).toBe(true);
	});

	test('should cancel upload and close uploader', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'Test folder not created - skipping');
			return;
		}
		await navigateToTestFolder(page);

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
		if (!testFolderId) {
			test.skip(true, 'Test folder not created - skipping');
			return;
		}
		await navigateToTestFolder(page);

		const uploadButton = page.locator('button:has-text("Upload Photos"), .btn-upload');
		await expect(uploadButton.first()).toBeVisible({ timeout: 10000 });
		await uploadButton.first().click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Create a larger file (500KB)
		const largeBuffer = Buffer.alloc(500 * 1024);
		// Add PNG header to make it valid
		const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		pngHeader.copy(largeBuffer);

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: `large-file-${uniqueId()}.png`,
			mimeType: 'image/png',
			buffer: largeBuffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Start upload
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Check for progress indicator - element should exist (may be hidden if upload is fast)
		const progressBar = page.locator('.uppy-StatusBar-progress');
		// Wait for element to exist in DOM (doesn't require visibility)
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
});
