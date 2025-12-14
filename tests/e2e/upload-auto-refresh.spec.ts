import { test, expect, type Page } from '@playwright/test';
import { createFolder } from './helpers/test-setup';

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E test to verify that uploaded photos appear automatically
 * without requiring a manual page refresh
 */
test.describe('Upload Auto-Refresh', () => {
	let testFolderId: string;

	// Create a test folder before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			const folderName = `AutoRefresh-${uniqueId()}`;
			testFolderId = await createFolder(page, folderName);
			console.log(`Created auto-refresh test folder: ${testFolderId}`);
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the test folder
	async function navigateToTestFolder(page: Page) {
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photos-grid', { timeout: 10000 });
	}

	test('should automatically display newly uploaded photos without page refresh', async ({
		page
	}) => {
		await navigateToTestFolder(page);

		// Get initial photo count
		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialPhotoCount}`);

		// Get initial total from photos-info if available
		const initialTotal = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : initialPhotoCount;
			})
			.catch(() => initialPhotoCount);

		console.log(`Initial total photos: ${initialTotal}`);

		// Click "Upload Photos" button
		const uploadButton = page.locator('.btn-upload');
		await expect(uploadButton).toBeVisible();
		await uploadButton.click();

		// Wait for Uppy dashboard to appear
		const uppyDashboard = page.locator('.uppy-Dashboard');
		await expect(uppyDashboard).toBeVisible({ timeout: 5000 });
		console.log('Uppy dashboard opened');

		// Upload file using Uppy's file input
		const fileInput = page.locator('.uppy-Dashboard-input').first();

		const buffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64'
		);

		await fileInput.setInputFiles({
			name: `test-upload-auto-refresh-${uniqueId()}.png`,
			mimeType: 'image/png',
			buffer: buffer
		});

		console.log('File selected for upload');

		// Wait for file to be added to Uppy
		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Click the "Upload" button in Uppy
		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await expect(uppyUploadButton).toBeVisible();
		await uppyUploadButton.click();

		console.log('Upload started');

		// Wait for upload to complete and uploader to close
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 20000 }
		);
		console.log('Upload completed, uploader closed');

		// Wait for the query to refetch - indicated by total count increasing
		await page.waitForFunction(
			(expectedTotal) => {
				const info = document.querySelector('.photos-info');
				if (!info) return false;
				const match = info.textContent?.match(/(\d+)\s+photos/);
				const currentTotal = match ? parseInt(match[1], 10) : 0;
				return currentTotal > expectedTotal;
			},
			initialTotal,
			{ timeout: 10000 }
		);

		console.log('Total count increased, refetch completed');

		// Wait a bit more for the DOM to update
		await page.waitForTimeout(1000);

		// Get the new photo count
		const newPhotoCount = await page.locator('.photo-card').count();

		console.log(`New photo count on page: ${newPhotoCount}`);

		// Verify total count increased
		const newTotal = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			});

		console.log(`New total photos: ${newTotal} (was ${initialTotal})`);
		expect(newTotal).toBeGreaterThan(initialTotal);

		// Verify we didn't do a page reload
		const navigationEntries = await page.evaluate(() =>
			window.performance.getEntriesByType('navigation')
		);
		const reloadCount = navigationEntries.filter(
			(entry: PerformanceEntry) => (entry as PerformanceNavigationTiming).type === 'reload'
		).length;

		expect(reloadCount).toBe(0);

		console.log('Photos refreshed automatically without page reload!');
	});

	test('should update photo count in header after upload', async ({ page }) => {
		await navigateToTestFolder(page);

		// Get initial count from header
		const initialText = await page.locator('.photos-info').textContent();
		const initialMatch = initialText?.match(/(\d+)\s+photos/);
		const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;

		console.log(`Initial count: ${initialCount}`);

		// Upload a photo
		await page.locator('.btn-upload').click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		const buffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64'
		);

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: `test-count-update-${uniqueId()}.png`,
			mimeType: 'image/png',
			buffer: buffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for upload to complete
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 20000 }
		);

		// Wait for count to update
		await page.waitForTimeout(1000);

		// Verify count increased
		const newText = await page.locator('.photos-info').textContent();
		const newMatch = newText?.match(/(\d+)\s+photos/);
		const newCount = newMatch ? parseInt(newMatch[1], 10) : 0;

		console.log(`New count: ${newCount}`);
		expect(newCount).toBeGreaterThan(initialCount);
	});

	test('should accept video file uploads (MP4)', async ({ page }) => {
		await navigateToTestFolder(page);

		// Get initial count
		const initialText = await page.locator('.photos-info').textContent();
		const initialMatch = initialText?.match(/(\d+)\s+photos/);
		const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;

		console.log(`Initial count: ${initialCount}`);

		// Upload a video
		await page.locator('.btn-upload').click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Minimal MP4 file header (ftyp box)
		const mp4Header = Buffer.from(
			'0000001c667479706d703432000000006d7034326d7034316973366d',
			'hex'
		);

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: `test-video-${uniqueId()}.mp4`,
			mimeType: 'video/mp4',
			buffer: mp4Header
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Verify the file was accepted
		const fileItem = page.locator('.uppy-Dashboard-Item');
		await expect(fileItem).toBeVisible();

		// Check there's no error message about file type
		const errorMessage = page.locator('.uppy-Dashboard-Item-errorMessage');
		const hasError = await errorMessage.isVisible().catch(() => false);
		expect(hasError).toBe(false);

		console.log('MP4 video file accepted by uploader');

		// Start upload
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();

		// Wait for upload to complete
		await page.waitForFunction(
			() => {
				const dashboard = document.querySelector('.uppy-Dashboard');
				return !dashboard || getComputedStyle(dashboard).display === 'none';
			},
			{ timeout: 20000 }
		);

		// Wait for count to update
		await page.waitForTimeout(1000);

		// Verify count increased
		const newText = await page.locator('.photos-info').textContent();
		const newMatch = newText?.match(/(\d+)\s+photos/);
		const newCount = newMatch ? parseInt(newMatch[1], 10) : 0;

		console.log(`New count after video upload: ${newCount}`);
		expect(newCount).toBeGreaterThan(initialCount);

		console.log('Video uploaded successfully via Tus!');
	});

	test('should reject unsupported file types', async ({ page }) => {
		await navigateToTestFolder(page);

		// Open uploader
		await page.locator('.btn-upload').click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		// Try to upload a text file (should be rejected)
		const textBuffer = Buffer.from('This is a text file', 'utf-8');

		await page.locator('.uppy-Dashboard-input').first().setInputFiles({
			name: 'test.txt',
			mimeType: 'text/plain',
			buffer: textBuffer
		});

		// Wait a bit for Uppy to process
		await page.waitForTimeout(500);

		// Either the file is not added, or there's an error message
		const fileItem = page.locator('.uppy-Dashboard-Item');
		const fileItemVisible = await fileItem.isVisible().catch(() => false);

		if (fileItemVisible) {
			// If file was added, it should have an error
			const errorMessage = page.locator('.uppy-Dashboard-Item-errorMessage');
			const hasError = await errorMessage.isVisible().catch(() => false);
			expect(hasError).toBe(true);
			console.log('Text file was rejected with error message');
		} else {
			// File was not added at all (which is also correct behavior)
			console.log('Text file was not added to uploader');
		}
	});
});
