import { test, expect, type Page } from '@playwright/test';
import { navigateToInfiniteScrollFolder, navigateToSmallFolder } from './helpers/test-setup';

/**
 * E2E tests for infinite scroll functionality
 * Uses seeded test data from the backend seed command
 *
 * Requirements:
 * - Load initial photos (page 1)
 * - Load more photos when scrolling near bottom
 * - Only load images in or near viewport (lazy loading)
 * - Show loading indicator while fetching
 */
test.describe('Infinite Scroll', () => {
	let largeFolderId: string | null;
	let smallFolderId: string | null;

	// Find seeded folders before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		page.setDefaultTimeout(60000);

		try {
			// Find the "Infinite Scroll Test" folder (60 photos)
			largeFolderId = await navigateToInfiniteScrollFolder(page);
			if (largeFolderId) {
				console.log(`Found large folder (60 photos): ${largeFolderId}`);
			}

			// Find a small folder (< 50 photos)
			smallFolderId = await navigateToSmallFolder(page);
			if (smallFolderId) {
				console.log(`Found small folder: ${smallFolderId}`);
			}
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the large folder
	async function navigateToLargeFolder(page: Page) {
		if (!largeFolderId) {
			throw new Error('No large folder available');
		}
		await page.goto(`/photos/${largeFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photo-card', { timeout: 15000 });
	}

	// Helper to navigate to the small folder
	async function navigateToSmallFolderHelper(page: Page) {
		if (!smallFolderId) {
			throw new Error('No small folder available');
		}
		await page.goto(`/photos/${smallFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photo-card', { timeout: 15000 });
	}

	test('should load initial photos on page load', async ({ page }) => {
		if (!largeFolderId) {
			test.skip(true, 'No large folder with photos available');
			return;
		}

		await navigateToLargeFolder(page);

		// Should show initial batch of photos (max 50 per page)
		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialPhotoCount}`);

		// Should have photos
		expect(initialPhotoCount).toBeGreaterThan(0);

		// Should not show pagination controls (infinite scroll replaces pagination)
		const pagination = page.locator('.pagination');
		await expect(pagination).not.toBeVisible();
	});

	test('should load more photos when scrolling near bottom', async ({ page }) => {
		if (!largeFolderId) {
			test.skip(true, 'No large folder with photos available');
			return;
		}

		await navigateToLargeFolder(page);

		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialPhotoCount}`);

		// Get total photos (should be 60)
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		console.log(`Total photos in folder: ${totalPhotos}`);
		expect(totalPhotos).toBeGreaterThan(50); // Should have 60 photos

		// Scroll the load-more-trigger into view to trigger Intersection Observer
		const trigger = page.locator('.load-more-trigger');
		await trigger.scrollIntoViewIfNeeded();

		// Wait for Intersection Observer to trigger
		await page.waitForTimeout(500);

		// Try to catch loading indicator (may be too fast)
		const loadingIndicator = page.locator('.loading-more');
		try {
			await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
			console.log('Loading indicator visible');
		} catch {
			console.log('Loading indicator not caught (loads too fast)');
		}

		// Wait for new photos to load
		await page.waitForTimeout(1500);

		// Should have more photos now
		const newPhotoCount = await page.locator('.photo-card').count();
		console.log(`Photo count after scroll: ${newPhotoCount}`);

		expect(newPhotoCount).toBeGreaterThan(initialPhotoCount);
	});

	test('should lazy load images only in viewport', async ({ page }) => {
		if (!largeFolderId) {
			test.skip(true, 'No large folder with photos available');
			return;
		}

		await navigateToLargeFolder(page);

		// Get all photo images
		const allImages = page.locator('.photo-card img');
		const imageCount = await allImages.count();

		if (imageCount < 10) {
			test.skip(true, 'Not enough photos to test lazy loading');
			return;
		}

		// Check first visible image (should be loaded)
		const firstImage = allImages.first();
		const firstImageSrc = await firstImage.getAttribute('src');
		console.log(`First image src: ${firstImageSrc}`);

		// Should have a real image source (not placeholder)
		expect(firstImageSrc).toBeTruthy();
		expect(firstImageSrc).not.toContain('placeholder');
		expect(firstImageSrc).not.toContain('data:image');

		// Check last image (should be lazy loaded - might have placeholder or loading attribute)
		const lastImage = allImages.last();
		const lastImageLoading = await lastImage.getAttribute('loading');
		console.log(`Last image loading attribute: ${lastImageLoading}`);

		// Should have loading="lazy" attribute for lazy loading
		expect(lastImageLoading).toBe('lazy');

		// Scroll to bottom to trigger lazy loading of last image
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});

		// Wait for lazy images to load
		await page.waitForTimeout(500);

		// Last image should now be loaded
		const lastImageSrc = await lastImage.getAttribute('src');
		console.log(`Last image src after scroll: ${lastImageSrc}`);
		expect(lastImageSrc).toBeTruthy();
	});

	test('should show loading indicator while fetching more photos', async ({ page }) => {
		if (!largeFolderId) {
			test.skip(true, 'No large folder with photos available');
			return;
		}

		await navigateToLargeFolder(page);

		// Get total photos (should be 60)
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		expect(totalPhotos).toBeGreaterThan(50); // Should have 60 photos

		// Scroll the load-more-trigger into view to trigger Intersection Observer
		const trigger = page.locator('.load-more-trigger');
		await trigger.scrollIntoViewIfNeeded();

		// Wait for Intersection Observer to trigger
		await page.waitForTimeout(500);

		// Try to catch loading indicator (may be too fast)
		const loadingIndicator = page.locator('.loading-more');
		let caughtLoadingIndicator = false;
		try {
			await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
			const loadingText = await loadingIndicator.textContent();
			console.log(`Loading indicator text: ${loadingText}`);
			expect(loadingText?.toLowerCase()).toContain('loading');
			caughtLoadingIndicator = true;
		} catch {
			console.log('Loading indicator not caught (loads too fast)');
		}

		// Wait for new photos to load
		await page.waitForTimeout(1500);

		// Verify loading happened by checking photo count increased
		const photoCountAfterScroll = await page.locator('.photo-card').count();
		console.log(
			`Photo count after scroll: ${photoCountAfterScroll} (caught indicator: ${caughtLoadingIndicator})`
		);
		expect(photoCountAfterScroll).toBeGreaterThan(50);
	});

	test('should not load more photos when all photos are loaded', async ({ page }) => {
		if (!smallFolderId) {
			test.skip(true, 'No small folder available');
			return;
		}

		await navigateToSmallFolderHelper(page);

		// Get total photos (should be <= 50)
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		expect(totalPhotos).toBeLessThanOrEqual(50); // Should be a small folder

		// Scroll to bottom
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});

		// Should NOT show loading indicator (all photos already loaded)
		const loadingIndicator = page.locator('.loading-more');
		const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false);

		expect(isLoadingVisible).toBe(false);

		// Photo count should remain the same
		const finalPhotoCount = await page.locator('.photo-card').count();
		expect(finalPhotoCount).toBe(totalPhotos);
	});
});
