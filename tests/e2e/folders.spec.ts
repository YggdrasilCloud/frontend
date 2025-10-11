import { test, expect } from '@playwright/test';

test.describe('Folders Management', () => {
	test('should display the photo manager homepage', async ({ page }) => {
		await page.goto('/photos');

		// Check that the main heading is present
		await expect(page.locator('h1')).toContainText('Photo Manager');

		// Check for the "New Folder" button
		await expect(page.getByRole('button', { name: /new folder/i })).toBeVisible();
	});

	test('should display welcome message or folders grid', async ({ page }) => {
		await page.goto('/photos');

		// Wait for API response and loading to finish
		await page.waitForLoadState('networkidle');
		await page
			.waitForSelector('text=/loading/i', { state: 'hidden', timeout: 10000 })
			.catch(() => {});

		// Check for welcome message or folders list
		const welcomeHeading = page.locator('h2', { hasText: /welcome/i });
		const createButton = page.locator('button', { hasText: /create.*first folder/i });
		const foldersGrid = page.locator('.folders-grid, .folder-card');

		// Either we see the welcome message or a folders grid
		const hasWelcome = await welcomeHeading.isVisible().catch(() => false);
		const hasCreateButton = await createButton.isVisible().catch(() => false);
		const hasFolders = await foldersGrid.isVisible().catch(() => false);

		// At least one should be visible
		expect(hasWelcome || hasCreateButton || hasFolders).toBe(true);
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

		// Wait for potential API call
		await page.waitForTimeout(2000);

		// Verify prompt was shown
		expect(promptShown).toBe(true);
	});

	test('should handle folder creation with invalid names', async ({ page }) => {
		let dialogShown = false;
		let validationAlertShown = false;

		// Listen for prompt dialog
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				dialogShown = true;
				// Submit invalid name with forbidden character
				await dialog.accept('Invalid/Name');
			} else if (dialog.type() === 'alert') {
				// Should show validation error
				validationAlertShown = true;
				expect(dialog.message()).toContain('character');
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

		// Give time for validation
		await page.waitForTimeout(1000);

		// Expect both dialogs to have been shown
		expect(dialogShown).toBe(true);
		expect(validationAlertShown).toBe(true);
	});
});
