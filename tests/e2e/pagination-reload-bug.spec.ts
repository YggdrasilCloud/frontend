import { test, expect } from '@playwright/test';

/**
 * Test to reproduce the pagination bug after page reload
 *
 * Scenario:
 * 1. Navigate to a folder with photos
 * 2. Reload the browser (simulating user refresh)
 * 3. Click on page 2
 * 4. Photos should change on FIRST click (currently fails)
 */
test.describe('Pagination After Page Reload', () => {
	test('should work on first click after browser reload', async ({ page }) => {
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
			test.skip(true, 'Not enough photos to test pagination (need > 50)');
			return;
		}

		// Check if page 2 exists
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		const hasPage2 = await page2Button.isVisible().catch(() => false);

		if (!hasPage2) {
			test.skip(true, 'Only 1 page available');
			return;
		}

		console.log('✓ Found pagination with page 2 button');

		// Get URL before reload
		const folderUrl = page.url();
		console.log('Current URL:', folderUrl);

		// RELOAD THE PAGE (this is the key part that reproduces the bug)
		console.log('🔄 Reloading page...');
		await page.reload();
		await page.waitForLoadState('networkidle');

		console.log('✓ Page reloaded');

		// Wait for photos to load after reload
		await page.waitForSelector('.photo-card', { timeout: 10000 });

		// Get first photo name on page 1 (after reload)
		const firstPhotoOnPage1 = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();

		console.log('First photo on page 1 after reload:', firstPhotoOnPage1);

		// Verify we're on page 1
		const page1Button = page.locator('.pagination-page', { hasText: '1' });
		await expect(page1Button).toHaveClass(/active/);

		// Now click on page 2 button (FIRST CLICK AFTER RELOAD)
		console.log('🖱️  Clicking page 2 button (first click after reload)...');
		const page2ButtonAfterReload = page.locator('.pagination-page', { hasText: '2' });
		await page2ButtonAfterReload.click();

		// Wait for the network request to complete
		await page.waitForLoadState('networkidle');

		// Small wait to let the UI update
		await page.waitForTimeout(500);

		// Verify page 2 is now active (this should work on FIRST click)
		console.log('Checking if page 2 is active after first click...');
		const isPage2Active = await page2ButtonAfterReload.evaluate((el) =>
			el.classList.contains('active')
		);
		console.log('Is page 2 active?', isPage2Active);

		// Get first photo name after click
		const firstPhotoAfterClick = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent()
			.catch(() => 'ERROR: Could not get photo name');

		console.log('First photo after first click:', firstPhotoAfterClick);

		// ASSERTIONS - These should pass but currently fail on first click after reload
		await expect(page2ButtonAfterReload).toHaveClass(/active/, {
			timeout: 2000
		});

		expect(firstPhotoAfterClick).not.toBe(firstPhotoOnPage1);
		expect(page.url()).toContain('page=2');

		console.log('✅ Test passed - pagination works on first click after reload!');
	});

	test('should work on first click without reload (control test)', async ({ page }) => {
		// This is a control test - should work fine
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available');
			return;
		}

		const folderCard = page.locator('.folder-card').first();
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		const pagination = page.locator('.pagination');
		const hasPagination = await pagination.isVisible().catch(() => false);

		if (!hasPagination) {
			test.skip(true, 'Not enough photos');
			return;
		}

		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		const hasPage2 = await page2Button.isVisible().catch(() => false);

		if (!hasPage2) {
			test.skip(true, 'Only 1 page');
			return;
		}

		// NO RELOAD - just click directly
		const firstPhotoOnPage1 = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();

		console.log('Control test - clicking page 2 without reload...');
		await page2Button.click();
		await page.waitForLoadState('networkidle');

		const firstPhotoAfterClick = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();

		await expect(page2Button).toHaveClass(/active/);
		expect(firstPhotoAfterClick).not.toBe(firstPhotoOnPage1);

		console.log('✅ Control test passed - pagination works without reload');
	});
});
