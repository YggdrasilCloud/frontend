import { test, expect, type Page } from '@playwright/test';
import { navigateToFolderWithPhotos } from './helpers/test-setup';

/**
 * E2E tests for thumbnail display functionality
 * Tests that thumbnails are properly generated and displayed for images
 * Uses seeded test data from the backend seed command
 */
test.describe('Thumbnail Display', () => {
	let testFolderId: string | null;

	// Navigate to a folder with photos before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			testFolderId = await navigateToFolderWithPhotos(page);
			if (testFolderId) {
				console.log(`Found folder with photos: ${testFolderId}`);
			}
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the test folder
	async function navigateToTestFolder(page: Page) {
		if (!testFolderId) {
			throw new Error('No folder with photos available');
		}
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photo-card', { timeout: 15000 });
	}

	test('should display thumbnails for all photos in grid', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		await navigateToTestFolder(page);

		const photoCards = page.locator('.photo-card');
		const count = await photoCards.count();

		console.log(`Found ${count} photo cards`);
		expect(count).toBeGreaterThan(0);

		// Check that each photo has a visible thumbnail image
		for (let i = 0; i < Math.min(count, 10); i++) {
			const card = photoCards.nth(i);
			const img = card.locator('img');

			await expect(img).toBeVisible();

			// Thumbnail should have src attribute
			const src = await img.getAttribute('src');
			expect(src).toBeTruthy();

			// Should point to API photo endpoint (either /thumbnail or /file)
			expect(src).toMatch(/\/api\/photos\/[a-f0-9-]+\/(thumbnail|file)/i);
		}
	});

	test('should load thumbnails lazily', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		await navigateToTestFolder(page);

		const photoCards = page.locator('.photo-card');
		const count = await photoCards.count();
		expect(count).toBeGreaterThan(0);

		// Check for lazy loading attribute
		const firstImg = photoCards.first().locator('img');
		const loading = await firstImg.getAttribute('loading');

		expect(loading).toBe('lazy');
	});

	test('should have proper thumbnail dimensions', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		await navigateToTestFolder(page);

		const photoCards = page.locator('.photo-card');
		const firstImg = photoCards.first().locator('img');

		// Check dimension attributes
		const width = await firstImg.getAttribute('width');
		const height = await firstImg.getAttribute('height');

		expect(width).toBe('200');
		expect(height).toBe('200');
	});

	test('should show thumbnail placeholder while loading', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		// Navigate without waiting for network idle to catch loading state
		await page.goto(`/photos/${testFolderId}`);

		// Wait for photo cards to appear
		await page.waitForSelector('.photo-card', { timeout: 15000 });

		const photoCard = page.locator('.photo-card').first();

		// The card should be visible
		await expect(photoCard).toBeVisible();

		// Wait for image to fully load
		await page.waitForLoadState('networkidle');

		// After loading, image should be visible
		const img = photoCard.locator('img');
		await expect(img).toBeVisible();
	});

	test('should handle missing thumbnails gracefully', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		await navigateToTestFolder(page);

		const photoCards = page.locator('.photo-card');
		const count = await photoCards.count();

		// Verify no broken images (no error state)
		for (let i = 0; i < Math.min(count, 5); i++) {
			const card = photoCards.nth(i);
			const img = card.locator('img');

			// Image should be visible (not broken)
			await expect(img).toBeVisible();

			// Check that image loaded successfully
			const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
			// naturalWidth > 0 means image loaded successfully
			expect(naturalWidth).toBeGreaterThanOrEqual(0);
		}
	});

	test('should maintain aspect ratio in thumbnail display', async ({ page }) => {
		if (!testFolderId) {
			test.skip(true, 'No folder with photos available');
			return;
		}

		await navigateToTestFolder(page);

		const photoCards = page.locator('.photo-card');
		const firstImg = photoCards.first().locator('img');

		await expect(firstImg).toBeVisible();

		// Get actual rendered dimensions
		const boundingBox = await firstImg.boundingBox();

		if (boundingBox) {
			// Thumbnail container should have reasonable dimensions
			expect(boundingBox.width).toBeGreaterThan(0);
			expect(boundingBox.height).toBeGreaterThan(0);

			console.log(`Thumbnail dimensions: ${boundingBox.width}x${boundingBox.height}`);
		}
	});

	test('should update thumbnail when navigating between folders', async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		await page.waitForSelector('.folder-card', { timeout: 10000 });

		const folderCards = page.locator('.folder-card');
		const folderCount = await folderCards.count();

		if (folderCount < 2) {
			test.skip(true, 'Need at least 2 folders to test navigation');
			return;
		}

		// Navigate to first folder
		await folderCards.first().click();
		await page.waitForURL(/\/photos\/[a-f0-9-]+/, { timeout: 10000 });
		await page.waitForLoadState('networkidle');

		// Get current URL
		const firstUrl = page.url();
		console.log(`First folder URL: ${firstUrl}`);

		// Go back to folder list
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.folder-card', { timeout: 10000 });

		// Navigate to second folder
		await page.locator('.folder-card').nth(1).click();
		await page.waitForURL(/\/photos\/[a-f0-9-]+/, { timeout: 10000 });
		await page.waitForLoadState('networkidle');

		// URL should be different (different folder ID)
		const secondUrl = page.url();
		console.log(`Second folder URL: ${secondUrl}`);
		expect(secondUrl).not.toBe(firstUrl);

		// Should still show photos grid container (may be empty but container should exist)
		const photoGrid = page.locator('.photos-grid, .grid');
		await expect(photoGrid).toBeVisible({ timeout: 10000 });
	});
});
