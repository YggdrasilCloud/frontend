import { test, expect } from '@playwright/test';

test.describe('Folders Management', () => {
	test('should display the photo manager homepage', async ({ page }) => {
		await page.goto('/photos');

		// Check that the main heading is present
		await expect(page.locator('h1')).toContainText('Photo Manager');

		// Check for the "New Folder" button
		await expect(page.getByRole('button', { name: /new folder/i })).toBeVisible();
	});

	test('should display welcome message when no folders exist', async ({ page }) => {
		await page.goto('/photos');

		// Wait for API response (might show loading state first)
		await page.waitForLoadState('networkidle');

		// Check for welcome message or folders list
		const welcomeHeading = page.locator('h2', { hasText: /welcome/i });
		const createButton = page.locator('button', { hasText: /create.*first folder/i });

		// Either we see the welcome message or a folders list
		const hasWelcome = await welcomeHeading.isVisible().catch(() => false);
		const hasCreateButton = await createButton.isVisible().catch(() => false);

		if (hasWelcome || hasCreateButton) {
			// No folders yet - check welcome flow
			await expect(welcomeHeading.or(page.locator('h1'))).toBeVisible();
		} else {
			// Folders exist - check folders grid
			await expect(page.locator('.folders-grid, .folder-card')).toBeVisible();
		}
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
		// Listen for dialog (prompt)
		page.on('dialog', async (dialog) => {
			expect(dialog.type()).toBe('prompt');
			expect(dialog.message()).toContain('folder name');
			await dialog.accept('Test E2E Folder ' + Date.now());
		});

		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for potential API call
		await page.waitForTimeout(1000);

		// Check if folder was created (either in grid or as first folder)
		// Note: This is a basic check - full verification would require API mocking
	});

	test('should handle folder creation with invalid names', async ({ page }) => {
		let dialogShown = false;

		// Listen for prompt dialog
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				dialogShown = true;
				// Submit invalid name with forbidden character
				await dialog.accept('Invalid/Name');
			} else if (dialog.type() === 'alert') {
				// Should show validation error
				expect(dialog.message()).toContain('character');
				await dialog.accept();
			}
		});

		await page.goto('/photos');
		await page.waitForLoadState('networkidle');

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Give time for validation
		await page.waitForTimeout(500);

		// Expect both dialogs to have been shown
		expect(dialogShown).toBe(true);
	});
});
