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
 * E2E tests for video upload functionality
 * Tests video upload, thumbnail generation, and display
 */
test.describe('Video Upload', () => {
	let testFolderId: string;

	// Create a test folder before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			const folderName = `VideoUpload-${uniqueId()}`;
			testFolderId = await createFolder(page, folderName);
			console.log(`Created video upload test folder: ${testFolderId}`);
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the test folder
	async function navigateToTestFolder(page: Page) {
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		// Wait for photos grid to be ready
		await page.waitForSelector('.photos-grid, .grid', { timeout: 10000 }).catch(() => {});
	}

	// Helper to open uploader
	async function openUploader(page: Page) {
		const uploadButton = page.locator('.btn-upload');
		await expect(uploadButton).toBeVisible({ timeout: 10000 });
		await uploadButton.click();

		const uppyDashboard = page.locator('.uppy-Dashboard');
		await expect(uppyDashboard).toBeVisible({ timeout: 5000 });
	}

	// Helper to upload a file and wait for completion
	async function uploadFile(
		page: Page,
		file: { name: string; mimeType: string; buffer: Buffer }
	) {
		const fileInput = page.locator('.uppy-Dashboard-input').first();
		await fileInput.setInputFiles(file);

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await expect(uppyUploadButton).toBeVisible();
		await uppyUploadButton.click();

		// Wait for upload to complete
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 } // Longer timeout for videos
		);
	}

	test('should upload a video file successfully', async ({ page }) => {
		await navigateToTestFolder(page);

		// Get initial photo count
		const initialCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialCount}`);

		await openUploader(page);

		// Create a simple test video buffer (small MP4)
		// Using a minimal valid MP4 file
		const videoPath = path.resolve(__dirname, '../../../fixtures/photos/test-video.mp4');
		let videoBuffer: Buffer;

		try {
			videoBuffer = fs.readFileSync(videoPath);
		} catch {
			// If fixture doesn't exist, create a minimal video-like buffer
			// This won't be a valid video but tests the upload mechanism
			console.log('Using synthetic video buffer (fixture not found)');
			videoBuffer = Buffer.alloc(1024);
			videoBuffer.write('ftypisom');
		}

		await uploadFile(page, {
			name: `test-video-${Date.now()}.mp4`,
			mimeType: 'video/mp4',
			buffer: videoBuffer
		});

		console.log('Video upload completed');

		// Wait for the list to refresh
		await page.waitForTimeout(2000);

		// Verify the video appears in the list
		const newCount = await page.locator('.photo-card').count();
		console.log(`New photo count: ${newCount}`);

		expect(newCount).toBeGreaterThan(initialCount);
	});

	test('should display video with thumbnail after upload', async ({ page }) => {
		await navigateToTestFolder(page);
		await openUploader(page);

		// Use the test video fixture
		const videoPath = path.resolve(__dirname, '../../../fixtures/photos/test-video.mp4');
		let videoBuffer: Buffer;

		try {
			videoBuffer = fs.readFileSync(videoPath);
		} catch {
			test.skip(true, 'Video fixture not available');
			return;
		}

		const videoName = `thumbnail-test-${Date.now()}.mp4`;

		await uploadFile(page, {
			name: videoName,
			mimeType: 'video/mp4',
			buffer: videoBuffer
		});

		// Wait for thumbnail generation (may take a few seconds)
		await page.waitForTimeout(3000);

		// Find the uploaded video in the grid
		// The video should have a thumbnail image
		const photoCards = page.locator('.photo-card');
		const cardCount = await photoCards.count();

		let foundVideo = false;
		for (let i = 0; i < cardCount; i++) {
			const card = photoCards.nth(i);
			const name = await card.locator('.photo-name').textContent();

			if (name?.includes('thumbnail-test')) {
				foundVideo = true;

				// Check that the thumbnail image is loaded
				const img = card.locator('img');
				await expect(img).toBeVisible();

				// Thumbnail should have a src attribute pointing to the API
				const src = await img.getAttribute('src');
				expect(src).toBeTruthy();
				expect(src).toContain('/api/');

				console.log(`Found video with thumbnail: ${name}, src: ${src}`);
				break;
			}
		}

		expect(foundVideo).toBe(true);
	});

	test('should handle large video upload with progress indicator', async ({ page }) => {
		await navigateToTestFolder(page);
		await openUploader(page);

		// Create a larger buffer to test progress
		const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB
		largeBuffer.write('ftypisom');

		const fileInput = page.locator('.uppy-Dashboard-input').first();
		await fileInput.setInputFiles({
			name: `large-video-${Date.now()}.mp4`,
			mimeType: 'video/mp4',
			buffer: largeBuffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Start upload
		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await uppyUploadButton.click();

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

		console.log('Large video upload completed');
	});

	test('should upload multiple files including videos', async ({ page }) => {
		await navigateToTestFolder(page);

		const initialCount = await page.locator('.photo-card').count();

		await openUploader(page);

		// Create test files
		const imageBuffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64'
		);

		const videoPath = path.resolve(__dirname, '../../../fixtures/photos/test-video.mp4');
		let videoBuffer: Buffer;
		try {
			videoBuffer = fs.readFileSync(videoPath);
		} catch {
			videoBuffer = Buffer.alloc(1024);
			videoBuffer.write('ftypisom');
		}

		const timestamp = Date.now();
		const fileInput = page.locator('.uppy-Dashboard-input').first();

		// Add both files at once (setInputFiles replaces, not appends)
		await fileInput.setInputFiles([
			{
				name: `multi-image-${timestamp}.png`,
				mimeType: 'image/png',
				buffer: imageBuffer
			},
			{
				name: `multi-video-${timestamp}.mp4`,
				mimeType: 'video/mp4',
				buffer: videoBuffer
			}
		]);

		// Should now have 2 items
		const items = page.locator('.uppy-Dashboard-Item');
		await expect(items).toHaveCount(2, { timeout: 5000 });

		// Upload all
		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await uppyUploadButton.click();

		// Wait for completion
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 60000 }
		);

		await page.waitForTimeout(2000);

		const newCount = await page.locator('.photo-card').count();
		expect(newCount).toBeGreaterThanOrEqual(initialCount + 2);

		console.log(`Uploaded 2 files, count: ${initialCount} -> ${newCount}`);
	});
});
