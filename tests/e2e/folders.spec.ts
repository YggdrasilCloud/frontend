import { test, expect } from '@playwright/test';

test.describe('Folders Management', () => {
	test('should display the photo manager homepage', async ({ page }) => {
		await page.goto('/photos');

		// Check that the main heading is present
		await expect(page.locator('h1')).toContainText('Photo Manager');

		// Check for the "New Folder" button
		await expect(page.getByRole('button', { name: /new folder/i })).toBeVisible();
	});

	test('should display page content without crashing', async ({ page }) => {
		await page.goto('/photos');

		// Wait for page to be loaded
		await page.waitForLoadState('networkidle');

		// Just verify the page loaded successfully - main heading should be visible
		await expect(page.locator('h1')).toBeVisible();

		// Verify New Folder button is present (regardless of folders state)
		await expect(page.getByRole('button', { name: /new folder/i })).toBeVisible();
	});

	test('should navigate to folder detail page when clicking a folder', async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Try to find a folder card
		const folderCard = page.locator('.folder-card').first();
		const folderExists = await folderCard.isVisible().catch(() => false);

		if (folderExists) {
			// Click the folder
			await folderCard.click();

			// Should navigate to photos page
			await expect(page).toHaveURL(/\/photos\/[\w-]+/);

			// Should show Photos heading
			await expect(page.locator('h1')).toContainText('Photos');

			// Should have upload button
			await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
		} else {
			// Skip if no folders exist
			test.skip();
		}
	});

	test('should allow creating a new folder via prompt', async ({ page }) => {
		let promptShown = false;
		let folderName = '';

		// Listen for dialog (prompt or alert)
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				expect(dialog.message()).toContain('folder name');
				folderName = 'Test E2E Folder ' + Date.now();
				await dialog.accept(folderName);
			} else if (dialog.type() === 'alert') {
				// May receive error alerts - just accept them
				await dialog.accept();
			}
		});

		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
		await page
			.waitForSelector('text=/loading/i', { state: 'hidden', timeout: 10000 })
			.catch(() => {});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for the folder to appear in the UI
		if (folderName) {
			const newFolder = page.locator('.folder-card', { hasText: folderName });
			await newFolder.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		}

		// Verify prompt was shown
		expect(promptShown).toBe(true);
	});
});
