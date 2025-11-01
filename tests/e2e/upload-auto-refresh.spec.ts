import { test, expect } from '@playwright/test';

/**
 * E2E test to verify that uploaded photos appear automatically
 * without requiring a manual page refresh
 */
test.describe('Upload Auto-Refresh', () => {
	test('should automatically display newly uploaded photos without page refresh', async ({
		page
	}) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to load
		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available for testing');
			return;
		}

		// Click on first folder to enter
		const folderCard = page.locator('.folder-card').first();
		const folderName = await folderCard.locator('h3').textContent();
		console.log(`📁 Opening folder: ${folderName}`);

		await folderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for page to be fully loaded
		await page.waitForSelector('.photos-grid', { timeout: 10000 });

		// Get initial photo count
		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`📊 Initial photo count: ${initialPhotoCount}`);

		// Get initial total from photos-info if available
		const initialTotal = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : initialPhotoCount;
			})
			.catch(() => initialPhotoCount);

		console.log(`📊 Initial total photos: ${initialTotal}`);

		// Click "Upload Photos" button
		const uploadButton = page.locator('button:has-text("Upload Photos")');
		await expect(uploadButton).toBeVisible();
		await uploadButton.click();

		// Wait for Uppy dashboard to appear
		const uppyDashboard = page.locator('.uppy-Dashboard');
		await expect(uppyDashboard).toBeVisible({ timeout: 5000 });
		console.log('📤 Uppy dashboard opened');

		// Upload file using Uppy's file input
		const fileInput = page.locator('.uppy-Dashboard-input');

		// If test image doesn't exist, create a simple one
		// For now, we'll use setInputFiles with a buffer
		const buffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64'
		);

		await fileInput.setInputFiles({
			name: 'test-upload-auto-refresh.png',
			mimeType: 'image/png',
			buffer: buffer
		});

		console.log('📁 File selected for upload');

		// Wait for file to be added to Uppy
		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });

		// Click the "Upload" button in Uppy
		const uppyUploadButton = page.locator('.uppy-StatusBar-actionBtn--upload');
		await expect(uppyUploadButton).toBeVisible();
		await uppyUploadButton.click();

		console.log('🚀 Upload started');

		// Wait for upload to complete (Uppy shows complete state)
		await page.waitForSelector('.uppy-StatusBar-statusPrimary:has-text("Complete")', {
			timeout: 15000
		});
		console.log('✅ Upload completed');

		// Wait a bit for the uploader to close
		await page.waitForTimeout(1000);

		// Now verify that the photo appears automatically WITHOUT page refresh
		// The photo list should have been invalidated and refetched automatically

		// Wait for the new photo to appear in the grid
		const newPhotoCount = await page
			.waitForFunction(
				(expectedCount) => {
					const cards = document.querySelectorAll('.photo-card');
					return cards.length > expectedCount;
				},
				initialPhotoCount,
				{ timeout: 10000 }
			)
			.then(() => page.locator('.photo-card').count())
			.catch(() => page.locator('.photo-card').count());

		console.log(`📊 New photo count: ${newPhotoCount}`);

		// Verify photo count increased
		expect(newPhotoCount).toBeGreaterThan(initialPhotoCount);

		// Verify total count increased in photos-info
		const newTotal = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			});

		console.log(`📊 New total photos: ${newTotal}`);
		expect(newTotal).toBe(initialTotal + 1);

		// Verify we didn't do a page reload
		// If we had to reload, navigation history would change
		const navigationEntries = await page.evaluate(() =>
			window.performance.getEntriesByType('navigation')
		);
		const reloadCount = navigationEntries.filter(
			(entry: PerformanceEntry) => (entry as PerformanceNavigationTiming).type === 'reload'
		).length;

		expect(reloadCount).toBe(0); // Should be 0 - no page reload happened

		console.log('✅ Photos refreshed automatically without page reload!');
	});

	test('should update photo count in header after upload', async ({ page }) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available');
			return;
		}

		// Click first folder
		await page.locator('.folder-card').first().click();
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photos-grid', { timeout: 10000 });

		// Get initial count from header
		const initialText = await page.locator('.photos-info').textContent();
		const initialMatch = initialText?.match(/(\d+)\s+photos/);
		const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;

		console.log(`Initial count: ${initialCount}`);

		// Upload a photo
		await page.locator('button:has-text("Upload Photos")').click();
		await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

		const buffer = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64'
		);

		await page.locator('.uppy-Dashboard-input').setInputFiles({
			name: 'test-count-update.png',
			mimeType: 'image/png',
			buffer: buffer
		});

		await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
		await page.locator('.uppy-StatusBar-actionBtn--upload').click();
		await page.waitForSelector('.uppy-StatusBar-statusPrimary:has-text("Complete")', {
			timeout: 15000
		});

		// Wait for count to update
		await page.waitForTimeout(2000);

		// Verify count increased
		const newText = await page.locator('.photos-info').textContent();
		const newMatch = newText?.match(/(\d+)\s+photos/);
		const newCount = newMatch ? parseInt(newMatch[1], 10) : 0;

		console.log(`New count: ${newCount}`);
		expect(newCount).toBe(initialCount + 1);
	});
});
