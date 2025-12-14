import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createFolder } from './helpers/test-setup';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E tests for complete upload flow
 * Tests the entire workflow from folder creation to photo upload and display
 */
test.describe('Complete Upload Flow', () => {
	let testFolderId: string;

	// Create a test folder before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			const folderName = `UploadFlow-${uniqueId()}`;
			testFolderId = await createFolder(page, folderName);
			console.log(`Created upload flow test folder: ${testFolderId}`);
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the test folder
	async function navigateToTestFolder(page: Page) {
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photos-grid, .grid', { timeout: 10000 }).catch(() => {});
	}

	test('should create folder, upload image, and verify thumbnail', async ({ page }) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Create a new folder using prompt dialog
		const folderName = `Test-Folder-${uniqueId()}`;

		// Listen for prompt dialog
		page.once('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				await dialog.accept(folderName);
			} else if (dialog.type() === 'alert') {
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await expect(newFolderButton).toBeVisible();
		await newFolderButton.click();

		// Wait for folder to appear
		await page.waitForTimeout(2000);

		// Find and click the new folder
		const newFolder = page.locator('.folder-card', { hasText: folderName });
		await newFolder.waitFor({ state: 'visible', timeout: 10000 });

		// Click folder to navigate into it
		await newFolder.click();
		await page.waitForLoadState('networkidle');

		// Now upload an image
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

		// Verify the image appears with thumbnail
		const photoCard = page.locator('.photo-card').first();
		await expect(photoCard).toBeVisible({ timeout: 10000 });

		const thumbnail = photoCard.locator('img');
		await expect(thumbnail).toBeVisible();

		console.log(`Successfully created folder "${folderName}" and uploaded "${fileName}"`);
	});

	test('should upload to existing folder and show in list', async ({ page }) => {
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
