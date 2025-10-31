import { test, expect } from '@playwright/test';

/**
 * Simple test to reproduce the pagination double-click bug
 * This test should FAIL until the bug is fixed
 */
test.describe('Pagination Bug Reproduction', () => {
	test('should navigate to page 2 on FIRST click (bug test)', async ({ page }) => {
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

		// Wait for photos and pagination to load
		const pagination = page.locator('.pagination');
		const hasPagination = await pagination.isVisible().catch(() => false);

		if (!hasPagination) {
			test.skip(true, 'Not enough photos to test pagination');
			return;
		}

		// Get first photo name on page 1
		await page.waitForSelector('.photo-card', { timeout: 5000 });
		const firstPhotoOnPage1 = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();

		console.log('First photo on page 1:', firstPhotoOnPage1);

		// Click on page 2 button ONCE
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		const hasPage2 = await page2Button.isVisible().catch(() => false);

		if (!hasPage2) {
			test.skip(true, 'Only 1 page available');
			return;
		}

		console.log('Clicking page 2 button...');
		await page2Button.click();

		// Wait a bit for the query to execute
		await page.waitForTimeout(1000);

		// Check if page 2 is active (this should work immediately after ONE click)
		const isPage2Active = await page2Button.evaluate((el) => el.classList.contains('active'));
		console.log('Is page 2 active after first click?', isPage2Active);

		// Get first photo name after click
		const firstPhotoAfterClick = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent()
			.catch(() => 'ERROR: Could not get photo name');

		console.log('First photo after first click:', firstPhotoAfterClick);

		// Verify page 2 is active (should work after first click)
		await expect(page2Button).toHaveClass(/active/, { timeout: 2000 });

		// Verify photos changed
		expect(firstPhotoAfterClick).not.toBe(firstPhotoOnPage1);

		// Verify URL updated
		expect(page.url()).toContain('page=2');
	});
});
