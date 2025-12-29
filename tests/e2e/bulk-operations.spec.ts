import { test, expect } from '@playwright/test';
import { navigateToFolderWithPhotos } from './helpers/test-setup';

// Helper to detect mobile viewport - hover, Ctrl/Shift+Click, and drag & drop don't work on touch devices
const isMobile = (testInfo: { project: { name: string } }) =>
	testInfo.project.name.includes('Mobile');

test.describe('Bulk Operations', () => {
	test.describe('Photo Selection', () => {
		test.beforeEach(async ({ page }) => {
			await navigateToFolderWithPhotos(page);
			// Wait for photos to load
			await page.waitForSelector('.photo-card', { timeout: 10000 }).catch(() => {});
		});

		test('should show checkbox on hover', async ({ page }, testInfo) => {
			// Hover doesn't work on touch devices
			test.skip(isMobile(testInfo), 'Hover is not supported on mobile');

			const photoCard = page.locator('.photo-card').first();
			const checkboxOverlay = photoCard.locator('.checkbox-overlay');

			// Checkbox should be hidden initially
			await expect(checkboxOverlay).toHaveCSS('opacity', '0');

			// Hover over the photo card
			await photoCard.hover();

			// Checkbox should be visible on hover
			await expect(checkboxOverlay).toHaveCSS('opacity', '1');
		});

		test('should toggle selection on checkbox click', async ({ page }, testInfo) => {
			// Requires hover to reveal checkbox
			test.skip(isMobile(testInfo), 'Hover is not supported on mobile');

			const photoCard = page.locator('.photo-card').first();
			const checkbox = photoCard.locator('input[type="checkbox"]');

			// Initially not selected
			await expect(photoCard).not.toHaveClass(/selected/);

			// Hover to show checkbox, then click it
			await photoCard.hover();
			await checkbox.click();

			// Should be selected
			await expect(photoCard).toHaveClass(/selected/);

			// Click again to deselect
			await checkbox.click();
			await expect(photoCard).not.toHaveClass(/selected/);
		});

		test('should toggle selection on Ctrl+Click', async ({ page }, testInfo) => {
			// Ctrl+Click doesn't work on touch devices
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			const photoCard = page.locator('.photo-card').first();

			// Initially not selected
			await expect(photoCard).not.toHaveClass(/selected/);

			// Ctrl+Click to select
			await photoCard.click({ modifiers: ['Control'] });
			await expect(photoCard).toHaveClass(/selected/);

			// Ctrl+Click again to deselect
			await photoCard.click({ modifiers: ['Control'] });
			await expect(photoCard).not.toHaveClass(/selected/);
		});

		test('should select range on Shift+Click', async ({ page }, testInfo) => {
			// Shift+Click doesn't work on touch devices
			test.skip(isMobile(testInfo), 'Shift+Click is not supported on mobile');

			const photos = page.locator('.photo-card');
			const count = await photos.count();

			if (count < 3) {
				test.skip();
				return;
			}

			// Select first photo with Ctrl+Click
			await photos.first().click({ modifiers: ['Control'] });
			await expect(photos.first()).toHaveClass(/selected/);

			// Shift+Click on third photo to select range
			await photos.nth(2).click({ modifiers: ['Shift'] });

			// All three photos should be selected
			await expect(photos.nth(0)).toHaveClass(/selected/);
			await expect(photos.nth(1)).toHaveClass(/selected/);
			await expect(photos.nth(2)).toHaveClass(/selected/);
		});

		test('should show bulk actions bar when photos are selected', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			const bulkActionsBar = page.locator('.bulk-actions-bar');

			// Initially hidden
			await expect(bulkActionsBar).not.toBeVisible();

			// Select a photo
			const photoCard = page.locator('.photo-card').first();
			await photoCard.click({ modifiers: ['Control'] });

			// Bulk actions bar should appear
			await expect(bulkActionsBar).toBeVisible();
			await expect(bulkActionsBar).toContainText('1 selected');
		});

		test('should update selection count in bulk actions bar', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			const photos = page.locator('.photo-card');
			const bulkActionsBar = page.locator('.bulk-actions-bar');
			const count = await photos.count();

			if (count < 2) {
				test.skip();
				return;
			}

			// Select first photo
			await photos.first().click({ modifiers: ['Control'] });
			await expect(bulkActionsBar).toContainText('1 selected');

			// Select second photo
			await photos.nth(1).click({ modifiers: ['Control'] });
			await expect(bulkActionsBar).toContainText('2 selected');
		});

		test('should clear selection via clear button', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			const photoCard = page.locator('.photo-card').first();
			const bulkActionsBar = page.locator('.bulk-actions-bar');
			const clearButton = page.locator('.btn-clear');

			// Select a photo
			await photoCard.click({ modifiers: ['Control'] });
			await expect(bulkActionsBar).toBeVisible();

			// Click clear button
			await clearButton.click();

			// Selection should be cleared
			await expect(bulkActionsBar).not.toBeVisible();
			await expect(photoCard).not.toHaveClass(/selected/);
		});

		test('should clear selection when navigating to another folder', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			const photoCard = page.locator('.photo-card').first();
			const bulkActionsBar = page.locator('.bulk-actions-bar');

			// Select a photo
			await photoCard.click({ modifiers: ['Control'] });
			await expect(bulkActionsBar).toBeVisible();

			// Navigate back to /photos (root)
			await page.goto('/photos');
			await page.waitForLoadState('networkidle');

			// Click on another folder if available
			const folders = page.locator('.folder-card');
			const count = await folders.count();
			if (count > 0) {
				await folders.first().click();
				await page.waitForLoadState('networkidle');
			}

			// Bulk actions bar should be hidden (selection cleared)
			await expect(bulkActionsBar).not.toBeVisible();
		});
	});

	test.describe('Bulk Delete', () => {
		test('should show delete button in bulk actions bar', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			await navigateToFolderWithPhotos(page);
			await page.waitForSelector('.photo-card', { timeout: 10000 }).catch(() => {});

			const photoCard = page.locator('.photo-card').first();
			await photoCard.click({ modifiers: ['Control'] });

			const deleteButton = page.locator('.btn-delete');
			await expect(deleteButton).toBeVisible();
			await expect(deleteButton).toContainText('Delete Selected');
		});

		test('should show confirmation dialog before deleting', async ({ page }, testInfo) => {
			// Uses Ctrl+Click for selection
			test.skip(isMobile(testInfo), 'Ctrl+Click is not supported on mobile');

			await navigateToFolderWithPhotos(page);
			await page.waitForSelector('.photo-card', { timeout: 10000 }).catch(() => {});

			const photoCard = page.locator('.photo-card').first();
			await photoCard.click({ modifiers: ['Control'] });

			let confirmShown = false;
			page.on('dialog', async (dialog) => {
				if (dialog.type() === 'confirm') {
					confirmShown = true;
					expect(dialog.message()).toContain('1 photo');
					await dialog.dismiss(); // Cancel the delete
				} else {
					await dialog.accept();
				}
			});

			const deleteButton = page.locator('.btn-delete');
			await deleteButton.click();

			// Wait a bit for dialog to be handled
			await page.waitForTimeout(500);
			expect(confirmShown).toBe(true);
		});
	});

	test.describe('Drag and Drop', () => {
		test('should make selected photos draggable', async ({ page }, testInfo) => {
			// HTML5 Drag and Drop doesn't work on touch devices
			test.skip(isMobile(testInfo), 'Drag and drop is not supported on mobile');

			await navigateToFolderWithPhotos(page);
			await page.waitForSelector('.photo-card', { timeout: 10000 }).catch(() => {});

			const photoCard = page.locator('.photo-card').first();

			// Photo cards should be draggable
			await expect(photoCard).toHaveAttribute('draggable', 'true');
		});

		test('should highlight folder on drag over', async ({ page }, testInfo) => {
			// HTML5 Drag and Drop + Ctrl+Click don't work on touch devices
			test.skip(isMobile(testInfo), 'Drag and drop is not supported on mobile');

			await navigateToFolderWithPhotos(page);
			await page.waitForSelector('.photo-card', { timeout: 10000 }).catch(() => {});

			// Select a photo
			const photoCard = page.locator('.photo-card').first();
			await photoCard.click({ modifiers: ['Control'] });

			// Find a folder in the sidebar (not the current one)
			const sidebarFolders = page.locator('.folder-tree .folder-item');
			const folderCount = await sidebarFolders.count();

			if (folderCount < 2) {
				test.skip();
				return;
			}

			// Find a folder that's not active (not the current folder)
			let targetFolder = null;
			for (let i = 0; i < folderCount; i++) {
				const folder = sidebarFolders.nth(i);
				const isActive = await folder.evaluate((el) => el.classList.contains('active'));
				if (!isActive) {
					targetFolder = folder;
					break;
				}
			}

			if (!targetFolder) {
				test.skip();
				return;
			}

			// Start drag from photo
			await photoCard.hover();
			await page.mouse.down();

			// Move to the target folder
			const box = await targetFolder.boundingBox();
			if (box) {
				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

				// Folder should have drag-over class (visual feedback)
				await expect(targetFolder).toHaveClass(/drag-over/);
			}

			// Cancel drag
			await page.mouse.up();
		});
	});
});
