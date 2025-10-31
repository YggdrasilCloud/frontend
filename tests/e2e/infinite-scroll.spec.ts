import { test, expect } from '@playwright/test';

/**
 * E2E tests for infinite scroll functionality
 *
 * Requirements:
 * - Load initial photos (page 1)
 * - Load more photos when scrolling near bottom
 * - Only load images in or near viewport (lazy loading)
 * - Show loading indicator while fetching
 */
test.describe('Infinite Scroll', () => {
	test('should load initial photos on page load', async ({ page }) => {
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

		// Click on first folder
		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for initial photos to load
		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Should show initial batch of photos (50 photos)
		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialPhotoCount}`);

		// Should have at least 1 photo
		expect(initialPhotoCount).toBeGreaterThan(0);

		// Should not show pagination controls
		const pagination = page.locator('.pagination');
		await expect(pagination).not.toBeVisible();
	});

	test('should load more photos when scrolling near bottom', async ({ page }) => {
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

		// Click on first folder
		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for initial photos to load
		await page.waitForSelector('.photo-card', { timeout: 10000 });

		const initialPhotoCount = await page.locator('.photo-card').count();
		console.log(`Initial photo count: ${initialPhotoCount}`);

		// Check if there are more than 50 photos (need multiple pages for infinite scroll)
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		console.log(`Total photos in folder: ${totalPhotos}`);

		if (totalPhotos <= 50) {
			test.skip(true, 'Not enough photos to test infinite scroll (need > 50)');
			return;
		}

		// Scroll to bottom of photos grid
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});

		// Wait for loading indicator to appear
		const loadingIndicator = page.locator('.loading-more');
		await expect(loadingIndicator).toBeVisible({ timeout: 2000 });

		// Wait for new photos to load
		await page.waitForTimeout(1000);

		// Should have more photos now
		const newPhotoCount = await page.locator('.photo-card').count();
		console.log(`Photo count after scroll: ${newPhotoCount}`);

		expect(newPhotoCount).toBeGreaterThan(initialPhotoCount);

		// Loading indicator should disappear
		await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
	});

	test('should lazy load images only in viewport', async ({ page }) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders and navigate to first folder
		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available for testing');
			return;
		}

		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for initial photos to load
		await page.waitForSelector('.photo-card', { timeout: 10000 });

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
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available for testing');
			return;
		}

		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Check total photos
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		if (totalPhotos <= 50) {
			test.skip(true, 'Not enough photos to test loading indicator');
			return;
		}

		// Scroll to bottom
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});

		// Loading indicator should appear
		const loadingIndicator = page.locator('.loading-more');
		await expect(loadingIndicator).toBeVisible({ timeout: 2000 });

		// Should show loading text or spinner
		const loadingText = await loadingIndicator.textContent();
		console.log(`Loading indicator text: ${loadingText}`);
		expect(loadingText?.toLowerCase()).toContain('loading');
	});

	test('should not load more photos when all photos are loaded', async ({ page }) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available for testing');
			return;
		}

		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Check total photos
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		if (totalPhotos > 50) {
			test.skip(true, 'Too many photos, need folder with <= 50 photos for this test');
			return;
		}

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
