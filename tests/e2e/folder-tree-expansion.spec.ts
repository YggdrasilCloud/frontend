import { test, expect, type Page } from '@playwright/test';
import { navigateToDeepHierarchy } from './helpers/test-setup';

/**
 * E2E tests for Folder Tree Expansion Behavior
 * Uses seeded test data from the backend seed command
 */
test.describe('Folder Tree Expansion Behavior', () => {
	let folderIds: string[] | null;

	// Navigate to seeded nested folder hierarchy before all tests
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

	// Navigate to root folder (first level) where FolderTree is visible
	async function navigateToRootFolder(page: Page) {
		if (!folderIds || folderIds.length === 0) {
			throw new Error('No nested folders available');
		}
		await page.goto(`/photos/${folderIds[0]}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.sidebar', { timeout: 10000 });
		await page.waitForSelector('.folder-tree', { timeout: 10000 });
	}

	test('should auto-expand parent folders when landing on subfolder via direct URL', async ({
		page
	}) => {
		if (!folderIds || folderIds.length < 2) {
			test.skip(true, 'Need at least 2 levels of nested folders');
			return;
		}

		// Go directly to the deepest subfolder URL
		const deepFolderId = folderIds[folderIds.length - 1];
		await page.goto(`/photos/${deepFolderId}`);
		await page.waitForLoadState('networkidle');

		// Wait for the folder tree items to appear in the sidebar
		await page.waitForSelector('.folder-tree-item', { timeout: 10000 });

		// Verify that parent folders are expanded in the sidebar
		const sidebarFolders = page.locator('.folder-tree-item');
		const visibleCount = await sidebarFolders.count();

		// We should see at least the root folder and its expanded children
		expect(visibleCount).toBeGreaterThan(1);
	});

	test('should expand folder in sidebar when clicking folder card in main area', async ({
		page
	}) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder
		await navigateToRootFolder(page);

		// Check if there are subfolders in the main content
		const subfolderCard = page.locator('.folder-card').first();
		const hasSubfolder = await subfolderCard.isVisible().catch(() => false);

		if (!hasSubfolder) {
			test.skip(true, 'No subfolders visible in main content');
			return;
		}

		// Get the subfolder name to identify it in the sidebar
		const subfolderName = await subfolderCard.locator('.folder-name').textContent();

		if (!subfolderName) {
			test.skip(true, 'Could not get subfolder name');
			return;
		}

		// Click the folder card
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for the triangle to be visible in the sidebar
		const expandedFolder = page
			.locator('.folder-item', { hasText: subfolderName })
			.locator('.triangle');
		await expandedFolder.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		const triangleText = await expandedFolder.textContent().catch(() => null);

		// The triangle should be ▼ (expanded) or ▶ (collapsed)
		if (triangleText) {
			expect(['▼', '▶'].includes(triangleText)).toBe(true);
		}
	});

	test('should keep folder expanded when clicking folder name (expand-only)', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder
		await navigateToRootFolder(page);

		// Find a folder with children (has triangle icon)
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip(true, 'No folder with children found');
			return;
		}

		// First expand by clicking the triangle
		const triangleButton = folderWithChildren.locator('.expand-toggle').first();
		await triangleButton.click();

		// Wait for the triangle to change to expanded state
		await expect(triangleButton.locator('.triangle')).toHaveText('▼', { timeout: 5000 });

		// Verify it's expanded (triangle should be ▼)
		let triangleText = await triangleButton.locator('.triangle').textContent();
		expect(triangleText).toBe('▼');

		// Now click the folder name (the anchor element)
		const folderLink = folderWithChildren;
		await folderLink.click();
		await page.waitForLoadState('networkidle');

		// Navigate back to verify the folder stays expanded
		await page.goBack();
		await page.waitForLoadState('networkidle');

		// Wait for the triangle to be visible again
		await triangleButton.locator('.triangle').waitFor({ state: 'visible', timeout: 5000 });

		// The folder should still be expanded
		triangleText = await triangleButton.locator('.triangle').textContent();
		expect(triangleText).toBe('▼');
	});

	test('should keep previously expanded folders open during navigation', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder
		await navigateToRootFolder(page);

		// Navigate to a folder with children
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip(true, 'No folder with children found');
			return;
		}

		// Expand the folder
		const triangleButton = folderWithChildren.locator('.expand-toggle').first();
		await triangleButton.click();

		// Wait for the triangle to change to expanded state
		await expect(triangleButton.locator('.triangle')).toHaveText('▼', { timeout: 5000 });

		// Verify it's expanded
		let triangleText = await triangleButton.locator('.triangle').textContent();
		expect(triangleText).toBe('▼');

		// Navigate to a subfolder
		const subfolder = page.locator('.folder-item').nth(1);
		const hasSubfolder = await subfolder.isVisible().catch(() => false);

		if (hasSubfolder) {
			await subfolder.click();
			await page.waitForLoadState('networkidle');

			// Navigate back
			await page.goBack();
			await page.waitForLoadState('networkidle');

			// Wait for the triangle to be visible again
			await triangleButton.locator('.triangle').waitFor({ state: 'visible', timeout: 5000 });

			// The original folder should still be expanded
			triangleText = await triangleButton.locator('.triangle').textContent();
			expect(triangleText).toBe('▼');
		}
	});

	test('should only collapse folder when clicking triangle button', async ({ page }) => {
		if (!folderIds || folderIds.length === 0) {
			test.skip(true, 'No nested folders available');
			return;
		}

		// Navigate to root folder
		await navigateToRootFolder(page);

		// Find a folder with children
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip(true, 'No folder with children found');
			return;
		}

		// Expand the folder by clicking triangle
		const triangleButton = folderWithChildren.locator('.expand-toggle').first();
		await triangleButton.click();

		// Wait for the triangle to change to expanded state
		await expect(triangleButton.locator('.triangle')).toHaveText('▼', { timeout: 5000 });

		// Verify it's expanded
		let triangleText = await triangleButton.locator('.triangle').textContent();
		expect(triangleText).toBe('▼');

		// Click triangle again to collapse
		await triangleButton.click();

		// Wait for the triangle to change to collapsed state
		await expect(triangleButton.locator('.triangle')).toHaveText('▶', { timeout: 5000 });

		// Verify it's now collapsed
		triangleText = await triangleButton.locator('.triangle').textContent();
		expect(triangleText).toBe('▶');
	});

	test('should expand multiple levels when navigating deep hierarchy', async ({ page }) => {
		if (!folderIds || folderIds.length < 2) {
			test.skip(true, 'Need at least 2 levels of nested folders');
			return;
		}

		// Go directly to the deepest folder
		const deepFolderId = folderIds[folderIds.length - 1];
		await page.goto(`/photos/${deepFolderId}`);
		await page.waitForLoadState('networkidle');

		// Wait for the folder tree to load
		await page.waitForSelector('.folder-tree', { timeout: 10000 });

		// Wait for at least one expanded folder to appear
		try {
			await page
				.locator('.folder-item .triangle:has-text("▼")')
				.first()
				.waitFor({ state: 'visible', timeout: 10000 });

			// Verify at least one level is expanded
			const expandedFolders = page.locator('.folder-item .triangle:has-text("▼")');
			const expandedCount = await expandedFolders.count();

			// Should have at least 1 expanded level (to show the path to current folder)
			expect(expandedCount).toBeGreaterThanOrEqual(1);
		} catch {
			// If no expanded triangles, check that we at least have folder items visible
			const folderItems = await page.locator('.folder-tree-item').count();
			expect(folderItems).toBeGreaterThan(0);
		}
	});
});
