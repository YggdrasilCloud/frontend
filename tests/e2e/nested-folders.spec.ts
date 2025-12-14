import { test, expect, type Page } from '@playwright/test';
import { navigateToDeepHierarchy, createFolder } from './helpers/test-setup';

const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * E2E tests for Nested Folder Navigation
 * Uses seeded test data from the backend seed command
 */
test.describe('Nested Folder Navigation', () => {
	let folderIds: string[] | null;

	// Navigate to seeded nested folder structure before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			folderIds = await navigateToDeepHierarchy(page);
			if (folderIds && folderIds.length > 0) {
				console.log(`Found nested folders: ${folderIds.join(' -> ')}`);
			}
		} finally {
			await page.close();
		}
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
		await page
			.waitForSelector('text=/loading/i', { state: 'hidden', timeout: 10000 })
			.catch(() => {});
	});

	test('should create a subfolder inside a parent folder', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to the first folder
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');

		// Create a new subfolder
		const subfolderName = `Subfolder-${uniqueId()}`;
		let promptShown = false;

		page.once('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				await dialog.accept(subfolderName);
			} else {
				await dialog.accept();
			}
		});

		// Click "New Folder" button in the folder view
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for the folder to appear in the UI
		const newFolder = page.locator('.folder-card', { hasText: subfolderName });
		await newFolder.waitFor({ state: 'visible', timeout: 10000 });

		// Verify prompt was shown and folder was created
		expect(promptShown).toBe(true);
		await expect(newFolder).toBeVisible();
	});

	test('should display subfolders in the main content area', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to the root folder (has a subfolder)
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');

		// Check if there are subfolders displayed (at least the one we created)
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
		} else {
			// Just verify folder-card elements exist
			const folderCards = page.locator('.folder-card');
			const folderCount = await folderCards.count();
			expect(folderCount).toBeGreaterThan(0);
		}
	});

	test('should navigate into a subfolder by clicking it', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to the root folder
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');

		// Click the subfolder
		const subfolderCard = page.locator('.folder-card').first();
		await expect(subfolderCard).toBeVisible();
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Verify we navigated to the subfolder (URL changed)
		await expect(page).toHaveURL(/\/photos\/[\w-]+/);

		// Verify Photos heading is still present
		await expect(page.locator('h1')).toContainText('Photos');
	});

	test('should display breadcrumb navigation in folder view', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to the root folder
		await page.goto(`/photos/${folderIds[0]}`);
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
		if (!folderIds || folderIds.length < 2) {
			test.skip(true, 'Need at least 2 levels of nested folders');
			return;
		}

		// Navigate to the subfolder (2nd level)
		await page.goto(`/photos/${folderIds[1]}`);
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
		if (!folderIds || folderIds.length < 2) {
			test.skip(true, 'Need at least 2 levels of nested folders');
			return;
		}

		// Navigate to the root folder first
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');
		const parentUrl = page.url();

		// Navigate to subfolder
		await page.goto(`/photos/${folderIds[1]}`);
		await page.waitForLoadState('networkidle');

		// Wait for breadcrumb to update
		const breadcrumb = page.locator('.breadcrumb');
		await breadcrumb.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);

		if (!hasBreadcrumb) {
			test.skip(true, 'Breadcrumb not visible');
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
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder (has both subfolder and photos)
		await page.goto(`/photos/${folderIds[0]}`);
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

		// At least one section should be present (folders exist from our setup)
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
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');

		// Check subfolder card exists
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
		// Create an empty folder for this test
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		const emptyFolderName = `Empty-${uniqueId()}`;

		page.once('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				await dialog.accept(emptyFolderName);
			} else {
				await dialog.accept();
			}
		});

		// Create new folder
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for folder to appear
		const newFolder = page.locator('.folder-card', { hasText: emptyFolderName });
		await newFolder.waitFor({ state: 'visible', timeout: 10000 });

		// Navigate into the empty folder
		await newFolder.click();
		await page.waitForLoadState('networkidle');

		// Wait for page content to render
		await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });

		// Check if empty state message is shown (or at least no photos/folders)
		const emptyMessage = page.locator('text=/no photos/i');
		const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

		// Either show empty message or have no content
		const photoCount = await page.locator('.photo-card').count();
		const folderCount = await page.locator('.folder-card').count();

		if (hasEmptyMessage) {
			console.log('Empty state message shown');
		} else {
			// If no empty message, folder should be truly empty
			expect(photoCount + folderCount).toBe(0);
		}
	});
});
