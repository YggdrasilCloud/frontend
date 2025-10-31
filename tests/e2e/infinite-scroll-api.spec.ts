import { test, expect } from '@playwright/test';

/**
 * E2E test to verify that infinite scroll makes API calls
 */
test.describe('Infinite Scroll API Calls', () => {
	test('should make API call for page 2 when scrolling to bottom', async ({ page }) => {
		// Track API requests
		const apiRequests: string[] = [];

		page.on('request', (request) => {
			const url = request.url();
			if (url.includes('/api/folders/') && url.includes('/photos')) {
				apiRequests.push(url);
				console.log('API Request:', url);
			}
		});

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

		// Verify initial API call (page 1)
		const initialRequest = apiRequests.find((url) => url.includes('page=1'));
		console.log('Initial request found:', !!initialRequest);
		expect(initialRequest).toBeTruthy();

		// Check total photos count
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

		// Clear previous requests
		apiRequests.length = 0;

		// Scroll the load-more-trigger into view to trigger Intersection Observer
		console.log('Scrolling load-more-trigger into view...');
		const trigger = page.locator('.load-more-trigger');
		await trigger.scrollIntoViewIfNeeded();

		// Wait a bit for Intersection Observer to trigger
		await page.waitForTimeout(500);

		// Wait for loading indicator
		const loadingIndicator = page.locator('.loading-more');
		try {
			await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
			console.log('Loading indicator visible');
		} catch (e) {
			console.error('Loading indicator not visible:', e);
		}

		// Wait for page 2 API call
		await page.waitForTimeout(1500);

		// Verify page 2 API call was made
		const page2Request = apiRequests.find((url) => url.includes('page=2'));
		console.log('Page 2 request found:', !!page2Request);
		console.log('All API requests after scroll:', apiRequests);

		// This is the critical assertion
		expect(page2Request, 'Page 2 API call should be made when scrolling').toBeTruthy();

		// Verify more photos were loaded
		const photoCountAfterScroll = await page.locator('.photo-card').count();
		console.log(`Photo count after scroll: ${photoCountAfterScroll}`);
		expect(photoCountAfterScroll).toBeGreaterThan(50);
	});

	test('should display load-more-trigger div', async ({ page }) => {
		// Navigate to photos page
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available');
			return;
		}

		// Click on first folder
		await page.locator('.folder-card').first().click();
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Check that load-more-trigger exists
		const trigger = page.locator('.load-more-trigger');
		await expect(trigger).toBeVisible();
		console.log('Load more trigger is visible');
	});
});
