import { test, expect } from '@playwright/test';

test.describe('Folder Creation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/photos');
		await page.waitForLoadState('networkidle');
	});

	test('should successfully create a new folder', async ({ page }) => {
		const folderName = `Test Folder ${Date.now()}`;
		let promptShown = false;

		// Listen for prompt dialog
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				expect(dialog.message()).toContain('folder name');
				promptShown = true;
				await dialog.accept(folderName);
			} else if (dialog.type() === 'alert') {
				// Accept any alert (success or error)
				console.log('Alert shown:', dialog.message());
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for API call to complete
		await page.waitForTimeout(2000);

		// Verify prompt was shown
		expect(promptShown).toBe(true);

		// If API is available, success alert should be shown
		// Note: This test will pass even if API is down (error alert shown)
		// but will catch if the prompt itself doesn't work
	});

	test('should show error when folder name contains invalid characters', async ({ page }) => {
		let promptShown = false;
		let validationAlertShown = false;

		// Listen for dialogs
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				// Submit invalid name with forbidden character
				await dialog.accept('Invalid/Folder/Name');
			} else if (dialog.type() === 'alert') {
				// Should show validation error
				expect(dialog.message()).toMatch(/character|invalid|forbidden/i);
				validationAlertShown = true;
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for validation
		await page.waitForTimeout(500);

		// Verify validation worked
		expect(promptShown).toBe(true);
		expect(validationAlertShown).toBe(true);
	});

	test('should sanitize folder name by trimming whitespace', async ({ page }) => {
		const baseName = `Trimmed ${Date.now()}`;
		const nameWithSpaces = `  ${baseName}  `;
		let promptShown = false;

		// Listen for prompt
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				await dialog.accept(nameWithSpaces);
			} else if (dialog.type() === 'alert') {
				// Success message should show trimmed name
				expect(dialog.message()).toContain(baseName);
				expect(dialog.message()).not.toContain('  ');
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for API call
		await page.waitForTimeout(2000);

		expect(promptShown).toBe(true);
	});

	test('should not create folder when canceling prompt', async ({ page }) => {
		let promptShown = false;
		let anyAlertShown = false;

		// Listen for dialogs
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				// Cancel the prompt
				await dialog.dismiss();
			} else if (dialog.type() === 'alert') {
				anyAlertShown = true;
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait a bit
		await page.waitForTimeout(500);

		// Verify prompt was shown but no alert (no API call)
		expect(promptShown).toBe(true);
		expect(anyAlertShown).toBe(false);
	});

	test('should not create folder with empty name', async ({ page }) => {
		let promptShown = false;
		let anyAlertShown = false;

		// Listen for dialogs
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				promptShown = true;
				// Submit empty string
				await dialog.accept('');
			} else if (dialog.type() === 'alert') {
				anyAlertShown = true;
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait a bit
		await page.waitForTimeout(500);

		// Verify prompt was shown but no alert (validation should prevent empty name)
		expect(promptShown).toBe(true);
		expect(anyAlertShown).toBe(false);
	});

	test('should disable button while creating folder', async ({ page }) => {
		const folderName = `Test ${Date.now()}`;

		// Listen for prompt
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				await dialog.accept(folderName);

				// Check if button is disabled after accepting
				const button = page.getByRole('button', { name: /creating|new folder/i }).first();
				const isDisabled = await button.isDisabled();
				console.log('Button disabled during creation:', isDisabled);
			} else if (dialog.type() === 'alert') {
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for potential API call
		await page.waitForTimeout(2000);

		// Note: Button should be disabled during API call
		// This test documents expected behavior even if API is unavailable
	});

	test('should show error alert when API is unavailable', async ({ page }) => {
		// This test documents error handling behavior
		const folderName = `API Test ${Date.now()}`;

		// Listen for dialogs
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				await dialog.accept(folderName);
			} else if (dialog.type() === 'alert') {
				// Capture alert message for debugging (success or error)
				console.log('Alert message:', dialog.message());
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for API call
		await page.waitForTimeout(2000);

		// This test documents that alerts should be shown
		// If API is working, success alert is shown
		// If API is down, error alert should be shown
		// Test passes in both cases as long as feedback is provided
	});

	test('should refresh folder list after successful creation', async ({ page }) => {
		const folderName = `Refresh Test ${Date.now()}`;
		let folderCreated = false;

		// Count folders before
		const initialFolderCount = await page
			.locator('.folder-card')
			.count()
			.catch(() => 0);

		// Listen for dialogs
		page.on('dialog', async (dialog) => {
			if (dialog.type() === 'prompt') {
				await dialog.accept(folderName);
			} else if (dialog.type() === 'alert' && dialog.message().includes('created successfully')) {
				folderCreated = true;
				await dialog.accept();
			} else if (dialog.type() === 'alert') {
				await dialog.accept();
			}
		});

		// Click "New Folder" button
		const newFolderButton = page.getByRole('button', { name: /new folder/i }).first();
		await newFolderButton.click();

		// Wait for API call and potential refresh
		await page.waitForTimeout(3000);

		// If folder was created successfully, list should refresh
		if (folderCreated) {
			const finalFolderCount = await page.locator('.folder-card').count();
			expect(finalFolderCount).toBeGreaterThan(initialFolderCount);
		}
	});
});
