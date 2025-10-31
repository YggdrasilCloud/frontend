import { test, expect, type Page } from '@playwright/test';

test.describe('Pagination', () => {
	// Helper to navigate to a folder with photos
	async function navigateToFolderWithPhotos(page: Page) {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to load
		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip(true, 'No folders available for testing');
			return null;
		}

		const folderCard = page.locator('.folder-card').first();
		const folderId = await folderCard.getAttribute('href');
		await folderCard.click();
		await page.waitForLoadState('networkidle');

		// Check if there are enough photos to enable pagination (> 50 photos)
		const photosCount = await page
			.locator('.pagination-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.catch(() => 0);

		if (photosCount <= 50) {
			test.skip(true, 'Not enough photos to test pagination (need > 50)');
			return null;
		}

		return folderId;
	}

	test('should display pagination controls when photos exceed perPage limit', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Should show pagination controls
		const pagination = page.locator('.pagination');
		await expect(pagination).toBeVisible();

		// Should show total count
		await expect(pagination.locator('.total-count')).toContainText(/\d+\s+photos/);

		// Should show page numbers
		const pageButtons = page.locator('.pagination-page');
		expect(await pageButtons.count()).toBeGreaterThan(0);

		// Should show Previous/Next buttons
		await expect(page.locator('.pagination-prev')).toBeVisible();
		await expect(page.locator('.pagination-next')).toBeVisible();
	});

	test('should navigate to page 2 on first click', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Wait for initial photos to load
		await page.waitForSelector('.photo-card', { timeout: 10000 });
		const initialFirstPhotoName = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();

		// Click on page 2
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		await page2Button.click();

		// Wait for photos to update
		await page.waitForLoadState('networkidle');

		// Verify page 2 is now active
		await expect(page2Button).toHaveClass(/active/);

		// Verify different photos are displayed
		const newFirstPhotoName = await page
			.locator('.photo-card')
			.first()
			.locator('.photo-name')
			.textContent();
		expect(newFirstPhotoName).not.toBe(initialFirstPhotoName);

		// Verify URL contains page parameter
		expect(page.url()).toContain('page=2');
	});

	test('should navigate using Next button', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Click Next button
		const nextButton = page.locator('.pagination-next');
		await nextButton.click();

		// Wait for photos to update
		await page.waitForLoadState('networkidle');

		// Verify page 2 is now active
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		await expect(page2Button).toHaveClass(/active/);

		// Verify URL updated
		expect(page.url()).toContain('page=2');
	});

	test('should navigate using Previous button', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Navigate to page 2 first
		const nextButton = page.locator('.pagination-next');
		await nextButton.click();
		await page.waitForLoadState('networkidle');

		// Click Previous button
		const prevButton = page.locator('.pagination-prev');
		await prevButton.click();
		await page.waitForLoadState('networkidle');

		// Verify page 1 is now active
		const page1Button = page.locator('.pagination-page', { hasText: '1' });
		await expect(page1Button).toHaveClass(/active/);

		// Verify URL updated (page=1 or no page param)
		const url = page.url();
		expect(url).toMatch(/page=1|photos\/[\w-]+$/);
	});

	test('should disable Previous button on first page', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Previous button should be disabled on page 1
		const prevButton = page.locator('.pagination-prev');
		await expect(prevButton).toBeDisabled();
	});

	test('should disable Next button on last page', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Get total pages count
		const pageButtons = page.locator('.pagination-page');
		const lastPageButton = pageButtons.last();
		const lastPageNumber = await lastPageButton.textContent();

		if (!lastPageNumber) return;

		// Navigate to last page
		await lastPageButton.click();
		await page.waitForLoadState('networkidle');

		// Next button should be disabled on last page
		const nextButton = page.locator('.pagination-next');
		await expect(nextButton).toBeDisabled();
	});

	test('should display ellipsis for large page counts', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Get total pages count
		const totalPhotos = await page
			.locator('.pagination-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			});

		const totalPages = Math.ceil(totalPhotos / 50);

		if (totalPages > 7) {
			// Should show ellipsis for large page counts
			const ellipsis = page.locator('.pagination-ellipsis');
			await expect(ellipsis.first()).toBeVisible();
		}
	});

	test('should navigate directly to page number', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Click on page 3 if available
		const page3Button = page.locator('.pagination-page', { hasText: '3' });
		const hasPage3 = await page3Button.isVisible().catch(() => false);

		if (!hasPage3) {
			test.skip(true, 'Not enough pages to test direct navigation');
			return;
		}

		await page3Button.click();
		await page.waitForLoadState('networkidle');

		// Verify page 3 is now active
		await expect(page3Button).toHaveClass(/active/);

		// Verify URL contains page parameter
		expect(page.url()).toContain('page=3');
	});

	test('should scroll to top when changing pages', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Scroll down
		await page.evaluate(() => window.scrollTo(0, 500));

		// Wait a bit for scroll
		await page.waitForTimeout(200);

		// Click Next button
		const nextButton = page.locator('.pagination-next');
		await nextButton.click();

		// Wait for scroll animation
		await page.waitForTimeout(300);

		// Verify page scrolled back up
		const scrollY = await page.evaluate(() => window.scrollY);
		expect(scrollY).toBeLessThan(200);
	});

	test('should maintain pagination state when using filters', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Navigate to page 2
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		await page2Button.click();
		await page.waitForLoadState('networkidle');

		// Check if sort dropdown exists
		const sortDropdown = page.locator('select[aria-label*="sort"]');
		const hasSortDropdown = await sortDropdown.isVisible().catch(() => false);

		if (hasSortDropdown) {
			// Change sort order
			await sortDropdown.selectOption({ index: 1 });
			await page.waitForLoadState('networkidle');

			// Should reset to page 1 when filters change (expected behavior)
			const page1Button = page.locator('.pagination-page', { hasText: '1' });
			await expect(page1Button).toHaveClass(/active/);
		}
	});

	test('should preserve pagination when navigating back', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Navigate to page 2
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		await page2Button.click();
		await page.waitForLoadState('networkidle');

		// Navigate away (click on folder in sidebar)
		await page.locator('.sidebar .folder-item').first().click();
		await page.waitForLoadState('networkidle');

		// Go back
		await page.goBack();
		await page.waitForLoadState('networkidle');

		// Should be on the same page (browser history)
		expect(page.url()).toContain('page=2');
	});

	test('should show correct page range information', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Get total photos count
		const totalPhotos = await page
			.locator('.pagination-info')
			.textContent()
			.then((text) => {
				const match = text?.match(/(\d+)\s+photos/);
				return match ? parseInt(match[1], 10) : 0;
			});

		// Navigate to page 2
		const nextButton = page.locator('.pagination-next');
		await nextButton.click();
		await page.waitForLoadState('networkidle');

		// Should show updated range
		const paginationInfo = page.locator('.pagination-info');
		await expect(paginationInfo).toContainText(`${totalPhotos} photos`);
	});

	test('should handle rapid pagination clicks', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Click Next button multiple times rapidly
		const nextButton = page.locator('.pagination-next');
		await nextButton.click();
		await nextButton.click();
		await nextButton.click();

		// Wait for final state
		await page.waitForLoadState('networkidle');

		// Should end up on a valid page (not broken)
		const activePageButton = page.locator('.pagination-page.active');
		await expect(activePageButton).toBeVisible();

		// Verify photos are displayed
		await expect(page.locator('.photo-card').first()).toBeVisible({ timeout: 5000 });
	});

	test('should show page 1 as active by default', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Page 1 should be active by default
		const page1Button = page.locator('.pagination-page', { hasText: '1' });
		await expect(page1Button).toHaveClass(/active/);
	});

	test('should update active page indicator when navigating', async ({ page }) => {
		const folderId = await navigateToFolderWithPhotos(page);
		if (!folderId) return;

		// Click on page 2
		const page2Button = page.locator('.pagination-page', { hasText: '2' });
		await page2Button.click();
		await page.waitForLoadState('networkidle');

		// Page 2 should be active
		await expect(page2Button).toHaveClass(/active/);

		// Page 1 should no longer be active
		const page1Button = page.locator('.pagination-page', { hasText: '1' });
		await expect(page1Button).not.toHaveClass(/active/);
	});
});
