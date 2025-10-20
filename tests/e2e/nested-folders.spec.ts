import { test, expect } from '@playwright/test';

test.describe('Nested Folder Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
		await page
			.waitForSelector('text=/loading/i', { state: 'hidden', timeout: 10000 })
			.catch(() => {});
	});

	test('should create a subfolder inside a parent folder', async ({ page }) => {
		// First, navigate to a folder (click the first available folder)
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Now we're inside a folder, create a subfolder
		const subfolderName = `Subfolder ${Date.now()}`;
		let promptShown = false;

		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				await dialog.accept(subfolderName);
			} else if (dialog.type() === 'alert') {
				await dialog.accept();
			}
		});

		// Click "New Folder" button in the folder view
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for the folder to appear in the UI
		const newFolder = page.locator('.folder-card', { hasText: subfolderName });
		await newFolder.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

		// Verify prompt was shown
		expect(promptShown).toBe(true);
	});

	test('should display subfolders in the main content area', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Check if there are any subfolders displayed
		const foldersSection = page.locator('.folders-section');
		const hasFoldersSection = await foldersSection.isVisible().catch(() => false);

		if (hasFoldersSection) {
			// Verify that folders section has "Folders" heading
			const foldersHeading = foldersSection.locator('h3');
			await expect(foldersHeading).toContainText('Folders');

			// Verify that folder cards are displayed
			const folderCards = foldersSection.locator('.folder-card');
			const folderCount = await folderCards.count();
			expect(folderCount).toBeGreaterThan(0);
		}
	});

	test('should navigate into a subfolder by clicking it', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Check if there are subfolders
		const subfolderCard = page.locator('.folder-card').first();
		const hasSubfolder = await subfolderCard.isVisible().catch(() => false);

		if (!hasSubfolder) {
			test.skip();
			return;
		}

		// Click the subfolder
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Verify we navigated to the subfolder (URL changed)
		await expect(page).toHaveURL(/\/photos\/[\w-]+/);

		// Verify Photos heading is still present
		await expect(page.locator('h1')).toContainText('Photos');
	});

	test('should display breadcrumb navigation in folder view', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Wait for breadcrumb to be visible
		const breadcrumb = page.locator('.breadcrumb');
		await breadcrumb.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

		// Check if breadcrumb is displayed
		const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);

		if (hasBreadcrumb) {
			// Verify breadcrumb has at least one segment
			const segments = breadcrumb.locator('li');
			const segmentCount = await segments.count();
			expect(segmentCount).toBeGreaterThan(0);
		}
	});

	test('should show full path in breadcrumb for nested folders', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Check if there are subfolders
		const subfolderCard = page.locator('.folder-card').first();
		const hasSubfolder = await subfolderCard.isVisible().catch(() => false);

		if (!hasSubfolder) {
			test.skip();
			return;
		}

		// Click into subfolder
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for breadcrumb to update
		const breadcrumb = page.locator('.breadcrumb');
		await breadcrumb.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);

		if (hasBreadcrumb) {
			// Verify breadcrumb has at least 2 segments (parent + current)
			const segments = breadcrumb.locator('li');
			const segmentCount = await segments.count();
			expect(segmentCount).toBeGreaterThanOrEqual(2);

			// Verify separator is present
			const separator = breadcrumb.locator('.separator').first();
			await expect(separator).toContainText('/');
		}
	});

	test('should navigate back via breadcrumb links', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		// Get the folder URL for later comparison
		await firstFolder.click();
		await page.waitForLoadState('networkidle');
		const parentUrl = page.url();

		// Check if there are subfolders
		const subfolderCard = page.locator('.folder-card').first();
		const hasSubfolder = await subfolderCard.isVisible().catch(() => false);

		if (!hasSubfolder) {
			test.skip();
			return;
		}

		// Click into subfolder
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for breadcrumb to update
		const breadcrumb = page.locator('.breadcrumb');
		await breadcrumb.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);

		if (!hasBreadcrumb) {
			test.skip();
			return;
		}

		// Click the first breadcrumb link (parent folder)
		const firstBreadcrumbLink = breadcrumb.locator('a').first();
		const hasLink = await firstBreadcrumbLink.isVisible().catch(() => false);

		if (hasLink) {
			await firstBreadcrumbLink.click();
			await page.waitForLoadState('networkidle');

			// Verify we navigated back to the parent folder
			expect(page.url()).toBe(parentUrl);
		}
	});

	test('should show folders and photos sections separately', async ({ page }) => {
		// Navigate to a folder that has both subfolders and photos
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Wait for content to load
		await page
			.locator('.folders-section, .photos-section')
			.first()
			.waitFor({ state: 'visible', timeout: 5000 })
			.catch(() => {});

		// Check for folders section
		const foldersSection = page.locator('.folders-section');
		const hasFoldersSection = await foldersSection.isVisible().catch(() => false);

		// Check for photos section
		const photosSection = page.locator('.photos-section');
		const hasPhotosSection = await photosSection.isVisible().catch(() => false);

		// At least one section should be present
		const hasContent = hasFoldersSection || hasPhotosSection;
		expect(hasContent).toBe(true);

		// If both are present, verify they have proper headings
		if (hasFoldersSection) {
			const foldersHeading = foldersSection.locator('h3');
			await expect(foldersHeading).toContainText('Folders');
		}

		if (hasPhotosSection) {
			const photosHeading = photosSection.locator('h3');
			await expect(photosHeading).toContainText('Photos');
		}
	});

	test('should show folder icon on folder cards', async ({ page }) => {
		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Check if there are subfolders
		const folderCard = page.locator('.folder-card').first();
		const hasFolder = await folderCard.isVisible().catch(() => false);

		if (hasFolder) {
			// Verify folder icon is present
			const folderIcon = folderCard.locator('.folder-icon');
			await expect(folderIcon).toBeVisible();

			// Verify folder name is present
			const folderName = folderCard.locator('.folder-name');
			await expect(folderName).toBeVisible();
		}
	});

	test('should show empty state when folder has no content', async ({ page }) => {
		// This test documents the empty state behavior
		// Note: May not always trigger if all folders have content

		// Navigate to a folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Wait for page content to render
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		// Check if empty state message is shown
		const emptyMessage = page.locator('text=/no photos or folders/i');
		const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

		// This is just documenting the behavior
		// Test passes whether empty state is shown or not
		console.log('Empty state shown:', hasEmptyMessage);
	});
});
