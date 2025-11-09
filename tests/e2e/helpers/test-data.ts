import { type Page } from '@playwright/test';

/**
 * Helper functions to navigate to test folders with known data
 */

/**
 * Navigate to the "Infinite Scroll Test" folder which contains 60 photos
 * This folder is created by the backend seed command for E2E tests
 */
export async function navigateToInfiniteScrollTestFolder(page: Page): Promise<void> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	// Wait for folders to load
	await page.waitForSelector('.folder-card', { timeout: 10000 });

	// Find the "Infinite Scroll Test" folder
	const scrollTestFolder = page.locator('.folder-card', {
		hasText: 'Infinite Scroll Test'
	});

	const folderExists = await scrollTestFolder.count();
	if (folderExists === 0) {
		throw new Error('Infinite Scroll Test folder not found. Make sure test data is seeded.');
	}

	await scrollTestFolder.click();
	await page.waitForLoadState('networkidle');
}

/**
 * Navigate to a folder with few photos (<= 50)
 * Useful for tests that need a small dataset
 */
export async function navigateToSmallFolder(page: Page): Promise<void> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	// Wait for folders to load
	await page.waitForSelector('.folder-card', { timeout: 10000 });

	// Try to find root folders with few photos (from seed command):
	// - "Work Projects" (5 photos)
	// - "Family Memories" (5 photos)
	// - "Empty Folder" (0 photos)
	const smallFolders = ['Work Projects', 'Family Memories', 'Empty Folder'];

	for (const folderName of smallFolders) {
		const folder = page.locator('.folder-card', { hasText: folderName });
		const exists = await folder.count();

		if (exists > 0) {
			await folder.click();
			await page.waitForLoadState('networkidle');
			return;
		}
	}

	// Fallback: use first folder if none of the named folders exist
	const firstFolder = page.locator('.folder-card').first();
	await firstFolder.click();
	await page.waitForLoadState('networkidle');
}
