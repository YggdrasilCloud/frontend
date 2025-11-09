import { test, expect } from '@playwright/test';
import { navigateToInfiniteScrollTestFolder } from './helpers/test-data';

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

		// Navigate to Infinite Scroll Test folder (60 photos)
		try {
			await navigateToInfiniteScrollTestFolder(page);
		} catch {
			test.skip(true, 'Infinite Scroll Test folder not available');
			return;
		}

		// Wait for initial photos to load
		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Verify initial API call (page 1)
		const initialRequest = apiRequests.find((url) => url.includes('page=1'));
		console.log('Initial request found:', !!initialRequest);
		expect(initialRequest).toBeTruthy();

		// Check total photos count (should be 60 from seed data)
		const totalPhotos = await page
			.locator('.photos-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		console.log(`Total photos in folder: ${totalPhotos}`);
		expect(totalPhotos).toBeGreaterThan(50); // Should have 60 photos from seed

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
		// Navigate to Infinite Scroll Test folder (60 photos)
		try {
			await navigateToInfiniteScrollTestFolder(page);
		} catch {
			test.skip(true, 'Infinite Scroll Test folder not available');
			return;
		}

		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Check that load-more-trigger exists
		const trigger = page.locator('.load-more-trigger');
		await expect(trigger).toBeVisible();
		console.log('Load more trigger is visible');
	});
});
