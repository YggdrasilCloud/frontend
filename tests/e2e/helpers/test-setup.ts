import { type Page } from '@playwright/test';

/**
 * Test setup helpers that use seeded test data
 * The CI environment already seeds data via the backend seed command
 */

/**
 * Navigate to a folder with photos (uses seeded data)
 * Returns folder ID from URL
 */
export async function navigateToFolderWithPhotos(page: Page): Promise<string | null> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	// Wait for folders to load
	try {
		await page.waitForSelector('.folder-card', { timeout: 10000 });
	} catch {
		return null;
	}

	// Try to find a folder with photos (seeded folders have photos)
	const folderCards = page.locator('.folder-card');
	const count = await folderCards.count();

	for (let i = 0; i < count; i++) {
		const folder = folderCards.nth(i);
		await folder.click();
		await page.waitForLoadState('networkidle');

		// Wait for photo cards
		try {
			await page.waitForSelector('.photo-card', { timeout: 5000 });
			// Extract folder ID from URL
			const url = page.url();
			const match = url.match(/\/photos\/([a-f0-9-]+)/i);
			if (match) {
				return match[1];
			}
		} catch {
			// No photos, try next folder
			await page.goto('/photos');
			await page.waitForLoadState('networkidle');
			await page.waitForSelector('.folder-card', { timeout: 5000 });
		}
	}

	return null;
}

/**
 * Navigate to the Infinite Scroll Test folder (60 photos)
 * This folder is created by the backend seed command
 */
export async function navigateToInfiniteScrollFolder(page: Page): Promise<string | null> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	try {
		await page.waitForSelector('.folder-card', { timeout: 10000 });
	} catch {
		return null;
	}

	// Find the "Infinite Scroll Test" folder
	const scrollTestFolder = page.locator('.folder-card', {
		hasText: 'Infinite Scroll Test'
	});

	const exists = await scrollTestFolder.count();
	if (exists === 0) {
		return null;
	}

	await scrollTestFolder.click();
	await page.waitForLoadState('networkidle');

	// Extract folder ID from URL
	const url = page.url();
	const match = url.match(/\/photos\/([a-f0-9-]+)/i);
	return match ? match[1] : null;
}

/**
 * Navigate to a folder with nested hierarchy (Deep Hierarchy Test)
 * Returns the deepest folder ID
 */
export async function navigateToDeepHierarchy(page: Page): Promise<string[] | null> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	try {
		await page.waitForSelector('.folder-card', { timeout: 10000 });
	} catch {
		return null;
	}

	// Find the "Deep Hierarchy Test" folder or any folder with nested structure
	const deepFolder = page.locator('.folder-card', {
		hasText: 'Deep Hierarchy Test'
	});

	const exists = await deepFolder.count();
	if (exists === 0) {
		// Try "Vacation Photos 2024" which also has nested folders
		const vacationFolder = page.locator('.folder-card', {
			hasText: 'Vacation Photos'
		});
		if ((await vacationFolder.count()) === 0) {
			return null;
		}
		await vacationFolder.click();
	} else {
		await deepFolder.click();
	}

	await page.waitForLoadState('networkidle');

	const folderIds: string[] = [];

	// Get first folder ID
	const url1 = page.url();
	const match1 = url1.match(/\/photos\/([a-f0-9-]+)/i);
	if (match1) {
		folderIds.push(match1[1]);
	}

	// Navigate deeper
	try {
		await page.waitForSelector('.folder-card', { timeout: 5000 });
		await page.locator('.folder-card').first().click();
		await page.waitForLoadState('networkidle');

		const url2 = page.url();
		const match2 = url2.match(/\/photos\/([a-f0-9-]+)/i);
		if (match2) {
			folderIds.push(match2[1]);
		}

		// Try one more level
		try {
			await page.waitForSelector('.folder-card', { timeout: 3000 });
			await page.locator('.folder-card').first().click();
			await page.waitForLoadState('networkidle');

			const url3 = page.url();
			const match3 = url3.match(/\/photos\/([a-f0-9-]+)/i);
			if (match3) {
				folderIds.push(match3[1]);
			}
		} catch {
			// No deeper level
		}
	} catch {
		// No nested folders
	}

	return folderIds.length > 0 ? folderIds : null;
}

/**
 * Navigate to a small folder (< 50 photos)
 */
export async function navigateToSmallFolder(page: Page): Promise<string | null> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	try {
		await page.waitForSelector('.folder-card', { timeout: 10000 });
	} catch {
		return null;
	}

	// Try known small folders first
	const smallFolders = ['Work Projects', 'Family Memories', 'Vacation Photos'];

	for (const folderName of smallFolders) {
		const folder = page.locator('.folder-card', { hasText: folderName });
		const exists = await folder.count();

		if (exists > 0) {
			await folder.click();
			await page.waitForLoadState('networkidle');

			const url = page.url();
			const match = url.match(/\/photos\/([a-f0-9-]+)/i);
			if (match) {
				return match[1];
			}
		}
	}

	// Fallback: first folder that's not Infinite Scroll Test
	const folders = page.locator('.folder-card');
	const count = await folders.count();

	for (let i = 0; i < count; i++) {
		const folder = folders.nth(i);
		const text = await folder.textContent();
		if (!text?.includes('Infinite Scroll')) {
			await folder.click();
			await page.waitForLoadState('networkidle');

			const url = page.url();
			const match = url.match(/\/photos\/([a-f0-9-]+)/i);
			if (match) {
				return match[1];
			}
		}
	}

	return null;
}

/**
 * Navigate to any folder (first available)
 */
export async function navigateToAnyFolder(page: Page): Promise<string | null> {
	await page.goto('/photos');
	await page.waitForLoadState('networkidle');

	try {
		await page.waitForSelector('.folder-card', { timeout: 10000 });
	} catch {
		return null;
	}

	await page.locator('.folder-card').first().click();
	await page.waitForLoadState('networkidle');

	const url = page.url();
	const match = url.match(/\/photos\/([a-f0-9-]+)/i);
	return match ? match[1] : null;
}

/**
 * Create a new folder (for tests that need to test folder creation)
 */
export async function createFolder(page: Page, folderName: string): Promise<string | null> {
	// Set up dialog handler
	page.once('dialog', async (dialog) => {
		if (dialog.type() === 'prompt') {
			await dialog.accept(folderName);
		} else {
			await dialog.accept();
		}
	});

	// Click "New Folder" button
	const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
	await newFolderButton.click();

	// Wait for the folder to appear
	await page.waitForTimeout(2000);

	// Find and click the new folder
	const newFolder = page.locator('.folder-card', { hasText: folderName });
	try {
		await newFolder.waitFor({ state: 'visible', timeout: 10000 });
		await newFolder.click();
		await page.waitForLoadState('networkidle');

		const url = page.url();
		const match = url.match(/\/photos\/([a-f0-9-]+)/i);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

/**
 * Upload a test photo to the current folder
 */
export async function uploadTestPhoto(page: Page, fileName: string): Promise<void> {
	const uploadButton = page.locator('.btn-upload');
	await uploadButton.click();

	await page.waitForSelector('.uppy-Dashboard', { timeout: 5000 });

	const buffer = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
		'base64'
	);

	await page.locator('.uppy-Dashboard-input').first().setInputFiles({
		name: fileName,
		mimeType: 'image/png',
		buffer
	});

	await page.waitForSelector('.uppy-Dashboard-Item', { timeout: 3000 });
	await page.locator('.uppy-StatusBar-actionBtn--upload').click();

	await page.waitForFunction(
		() => {
			const dashboard = document.querySelector('.uppy-Dashboard');
			return !dashboard || getComputedStyle(dashboard).display === 'none';
		},
		{ timeout: 30000 }
	);

	await page.waitForTimeout(1000);
}
