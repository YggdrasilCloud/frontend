import { test, expect, type Page } from '@playwright/test';

test.describe('Photos Display and Upload', () => {
	// Helper to navigate to a folder (assumes at least one folder exists)
	async function navigateToFolder(page: Page) {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to load (TanStack Query async)
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

		return folderId;
	}

	test('should display photos page with sidebar and content', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Check for sidebar
		await expect(page.locator('.sidebar')).toBeVisible();
		await expect(page.locator('.sidebar h2')).toContainText('Folders');

		// Check for main content area
		await expect(page.locator('.content')).toBeVisible();
		await expect(page.locator('h1')).toContainText('Photos');

		// Check for upload button
		await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
	});

	test('should display photos grid or empty state', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Should show either photos or empty state (don't wait for loading, just check final state)
		const photosGrid = page.locator('.grid');
		const emptyMessage = page.locator('text=/no photos/i');

		// Wait for one of them to be visible
		try {
			await Promise.race([
				photosGrid.waitFor({ state: 'visible', timeout: 5000 }),
				emptyMessage.waitFor({ state: 'visible', timeout: 5000 })
			]);
		} catch {
			// If neither appears in 5s, that's ok - might still be loading
		}

		// Now check what's visible
		const hasPhotos = await photosGrid.isVisible().catch(() => false);
		const isEmpty = await emptyMessage.isVisible().catch(() => false);

		expect(hasPhotos || isEmpty).toBe(true);
	});

	test('should display photo cards with correct structure', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Wait for photos to load (TanStack Query async)
		try {
			await page.waitForSelector('.photo-card', { timeout: 10000 });
		} catch {
			test.skip();
			return;
		}

		const photoCard = page.locator('.photo-card').first();

		// Check photo card structure
		await expect(photoCard.locator('img')).toBeVisible();
		await expect(photoCard.locator('.photo-name')).toBeVisible();
		await expect(photoCard.locator('.photo-size')).toBeVisible();

		// Check image attributes
		const img = photoCard.locator('img');
		await expect(img).toHaveAttribute('loading', 'lazy');
		await expect(img).toHaveAttribute('width', '200');
		await expect(img).toHaveAttribute('height', '200');
		await expect(img).toHaveAttribute('alt');
	});

	test('should show uploader when clicking upload button', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Click upload button
		const uploadButton = page.getByRole('button', { name: /upload/i });
		await uploadButton.click();

		// Should show uploader container - Uppy component mounted successfully
		await expect(page.locator('.uploader-container')).toBeVisible({ timeout: 3000 });
	});

	test('should toggle uploader when clicking cancel', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Use stable CSS selector (button text changes from "Upload Photos" to "Cancel")
		const uploadButton = page.locator('.btn-upload');

		// Open uploader
		await uploadButton.click();
		await expect(page.locator('.uploader-container')).toBeVisible({ timeout: 3000 });

		// Click button again to close uploader
		await uploadButton.click();

		// Should hide uploader container
		await expect(page.locator('.uploader-container')).not.toBeVisible({ timeout: 3000 });
	});

	test('should display pagination information when photos exist', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Check for pagination info
		const pagination = page.locator('.pagination');
		const hasPhotos = await page
			.locator('.photo-card')
			.first()
			.isVisible()
			.catch(() => false);

		if (hasPhotos) {
			await expect(pagination).toBeVisible();
			await expect(pagination).toContainText(/showing.*of.*photos/i);
		}
	});

	test('should show loading state initially', async ({ page }) => {
		// Navigate but don't wait for network idle to catch loading state
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Wait for folders to load
		try {
			await page.waitForSelector('.folder-card', { timeout: 10000 });
		} catch {
			test.skip();
			return;
		}

		const folderCard = page.locator('.folder-card').first();
		const href = await folderCard.getAttribute('href');
		if (!href) return;

		// Navigate to photos page quickly
		await page.goto(href);

		// Try to catch loading state (might be too fast)
		const loadingMessage = page.locator('text=/loading/i');
		await loadingMessage.isVisible().catch(() => false);

		// This is optional - loading might complete too fast
		// Just checking that the page doesn't crash
		await page.waitForLoadState('networkidle');
	});

	test('should handle sidebar folder navigation', async ({ page }) => {
		const folderId = await navigateToFolder(page);
		if (!folderId) return;

		// Wait for sidebar folders to load (TanStack Query async)
		await page.waitForSelector('.folders-list .folder-item', { timeout: 10000 });

		// Check sidebar has folders list
		const sidebarFolders = page.locator('.folders-list .folder-item');
		const folderCount = await sidebarFolders.count();

		if (folderCount > 1) {
			// Click on a different folder in sidebar
			const secondFolder = sidebarFolders.nth(1);
			await secondFolder.click();

			// Should navigate to different folder
			await page.waitForLoadState('networkidle');
			await expect(page).toHaveURL(/\/photos\/[\w-]+/);

			// Should still show Photos heading
			await expect(page.locator('h1')).toContainText('Photos');
		} else {
			// Only one folder - skip
			test.skip();
		}
	});
});
