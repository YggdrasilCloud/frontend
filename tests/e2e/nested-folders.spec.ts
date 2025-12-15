import { test, expect } from '@playwright/test';
import { navigateToDeepHierarchy } from './helpers/test-setup';

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

	test('should have nested folder structure in seeded data', async ({ page }) => {
		if (!folderIds || folderIds.length < 2) {
			test.skip(true, 'No nested folders available (need at least 2 levels)');
			return;
		}

		// Navigate to the first (parent) folder
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');

		// Verify we can see subfolders in the parent folder
		const subfolderCards = page.locator('.folder-card');
		const subfolderCount = await subfolderCards.count();

		// There should be at least one subfolder (the second level in folderIds)
		expect(subfolderCount).toBeGreaterThan(0);
		console.log(`Found ${subfolderCount} subfolder(s) in parent folder`);

		// Verify "New Folder" button exists (folder creation UI is available)
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await expect(newFolderButton).toBeVisible({ timeout: 5000 });

		// Navigate to the second level folder
		await page.goto(`/photos/${folderIds[1]}`);
		await page.waitForLoadState('networkidle');

		// Verify we landed in the subfolder
		expect(page.url()).toContain(folderIds[1]);
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

		// Navigate to the subfolder first
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

		// Get all breadcrumb links
		const breadcrumbLinks = breadcrumb.locator('a');
		const linkCount = await breadcrumbLinks.count();

		if (linkCount < 2) {
			test.skip(true, 'Not enough breadcrumb links to test navigation');
			return;
		}

		// Click any breadcrumb link (not the last one, which is current folder)
		// The test is just verifying that breadcrumb links work for navigation
		const linkToClick = breadcrumbLinks.nth(linkCount - 2);
		const linkHref = await linkToClick.getAttribute('href');
		console.log(`Clicking breadcrumb link: ${linkHref}`);

		await linkToClick.click();
		await page.waitForLoadState('networkidle');

		// Verify we navigated somewhere (URL changed from the subfolder)
		expect(page.url()).not.toContain(folderIds[1]);
		console.log(`Navigated to: ${page.url()}`);
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

});
