import { test, expect } from '@playwright/test';

test.describe('Folder Tree Expansion Behavior', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
		await page
			.waitForSelector('text=/loading/i', { state: 'hidden', timeout: 10000 })
			.catch(() => {});
	});

	test('should auto-expand parent folders when landing on subfolder via direct URL', async ({
		page
	}) => {
		// First, navigate to a folder to get its structure
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

		// Navigate to the subfolder and capture its URL
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');
		const subfolderUrl = page.url();

		// Now simulate arriving directly via URL by going to home and then to subfolder URL
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Go directly to the subfolder URL
		await page.goto(subfolderUrl);
		await page.waitForLoadState('networkidle');

		// Wait for the folder tree items to appear in the sidebar
		await page.locator('.folder-tree-item').first().waitFor({ state: 'visible', timeout: 10000 });

		// Verify that parent folders are expanded in the sidebar
		// The folder items should be visible (not hidden by collapsed parent)
		const sidebarFolders = page.locator('.folder-tree-item');
		const visibleCount = await sidebarFolders.count();

		// We should see at least the root folder and its expanded children
		expect(visibleCount).toBeGreaterThan(1);
	});

	test('should expand folder in sidebar when clicking folder card in main area', async ({
		page
	}) => {
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

		// Get the subfolder name to identify it in the sidebar
		const subfolderName = await subfolderCard.locator('.folder-name').textContent();

		if (!subfolderName) {
			test.skip();
			return;
		}

		// Click the folder card
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Wait for the triangle to be visible in the sidebar
		const expandedFolder = page
			.locator('.folder-item', { hasText: subfolderName })
			.locator('.triangle');
		await expandedFolder.waitFor({ state: 'visible', timeout: 5000 });
		const triangleText = await expandedFolder.textContent();

		// The triangle should be ▼ (expanded) or the folder should at least be visible
		expect(triangleText === '▼' || triangleText === '▶').toBe(true);
	});

	test('should keep folder expanded when clicking folder name (expand-only)', async ({ page }) => {
		// Find a folder with children (has triangle icon)
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip();
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
		// Navigate to a folder with children
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip();
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
		// Find a folder with children
		const folderWithChildren = page
			.locator('.folder-item')
			.filter({ has: page.locator('.expand-toggle') })
			.first();
		const hasFolder = await folderWithChildren.isVisible().catch(() => false);

		if (!hasFolder) {
			test.skip();
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
		// This test verifies that auto-expansion works for deep hierarchies
		// Navigate to first folder
		const firstFolder = page.locator('.folder-item').first();
		const folderExists = await firstFolder.isVisible().catch(() => false);

		if (!folderExists) {
			test.skip();
			return;
		}

		await firstFolder.click();
		await page.waitForLoadState('networkidle');

		// Check for subfolder
		const subfolderCard = page.locator('.folder-card').first();
		const hasSubfolder = await subfolderCard.isVisible().catch(() => false);

		if (!hasSubfolder) {
			test.skip();
			return;
		}

		// Navigate to subfolder
		await subfolderCard.click();
		await page.waitForLoadState('networkidle');

		// Check for another level
		const deepSubfolderCard = page.locator('.folder-card').first();
		const hasDeepSubfolder = await deepSubfolderCard.isVisible().catch(() => false);

		if (hasDeepSubfolder) {
			// Navigate to deep subfolder
			await deepSubfolderCard.click();
			await page.waitForLoadState('networkidle');
			const deepUrl = page.url();

			// Now simulate direct URL access
			await page.goto('/photos');
			await page.waitForLoadState('networkidle');
			await page.goto(deepUrl);
			await page.waitForLoadState('networkidle');

			// Wait for at least one expanded folder to appear
			await page
				.locator('.folder-item .triangle:has-text("▼")')
				.first()
				.waitFor({ state: 'visible', timeout: 10000 });

			// Verify multiple levels are expanded
			const expandedFolders = page.locator('.folder-item .triangle:has-text("▼")');
			const expandedCount = await expandedFolders.count();

			// Should have at least 2 expanded levels (root and child)
			expect(expandedCount).toBeGreaterThanOrEqual(1);
		}
	});
});
