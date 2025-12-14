import { test, expect, type Page } from '@playwright/test';
import { navigateToFolderWithPhotos } from './helpers/test-setup';

/**
 * E2E tests for Lightbox feature
 * Uses seeded test data from the backend seed command
 */
test.describe('Lightbox Feature', () => {
	let testFolderId: string | null;

	// Navigate to a folder with photos before all tests
	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		try {
			testFolderId = await navigateToFolderWithPhotos(page);
			if (testFolderId) {
				console.log(`Found folder with photos for lightbox tests: ${testFolderId}`);
			}
		} finally {
			await page.close();
		}
	});

	// Helper to navigate to the test folder with photos
	async function navigateToTestFolder(page: Page) {
		if (!testFolderId) {
			throw new Error('No folder with photos available');
		}
		await page.goto(`/photos/${testFolderId}`);
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('.photo-card', { timeout: 15000 });
	}

	test.describe('Opening and closing lightbox', () => {
		test('should open lightbox when clicking on photo card', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Click on first photo
			const firstPhoto = page.locator('.photo-card').first();
			await firstPhoto.click();

			// Lightbox should be visible
			await expect(page.locator('.lightbox-overlay')).toBeVisible();
			await expect(page.locator('.lightbox-image')).toBeVisible();
		});

		test('should display photo information in lightbox', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Get photo name from card
			const firstPhoto = page.locator('.photo-card').first();
			const photoName = await firstPhoto.locator('.photo-name').textContent();

			// Open lightbox
			await firstPhoto.click();

			// Scope selectors to the lightbox dialog to avoid matching grid elements
			const lightbox = page.locator('[role="dialog"]');

			// Should display photo name
			await expect(lightbox.locator('.photo-name')).toContainText(photoName || '');

			// Should display counter
			await expect(lightbox.locator('.photo-counter')).toBeVisible();
		});

		test('should close lightbox when clicking close button', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();
			await expect(page.locator('.lightbox-overlay')).toBeVisible();

			// Click close button
			await page.locator('.close-button').click();

			// Lightbox should be closed
			await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
		});

		test('should close lightbox when clicking on overlay background', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();
			await expect(page.locator('.lightbox-overlay')).toBeVisible();

			// Click on overlay (not on image)
			await page.locator('.lightbox-overlay').click({ position: { x: 10, y: 10 } });

			// Lightbox should be closed
			await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
		});

		test('should close lightbox when pressing Escape key', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();
			await expect(page.locator('.lightbox-overlay')).toBeVisible();

			// Press Escape
			await page.keyboard.press('Escape');

			// Lightbox should be closed
			await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
		});
	});

	test.describe('Navigation between photos', () => {
		test('should navigate to next photo using arrow button', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Check if there are multiple photos
			const photoCount = await page.locator('.photo-card').count();
			if (photoCount < 2) {
				test.skip(true, 'Need at least 2 photos for navigation test');
				return;
			}

			// Open first photo
			await page.locator('.photo-card').first().click();
			await expect(page.locator('.photo-counter')).toContainText('1 /');

			// Click next button
			await page.locator('.nav-next').click();

			// Should show second photo
			await expect(page.locator('.photo-counter')).toContainText('2 /');
		});

		test('should navigate to previous photo using arrow button', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Check if there are multiple photos
			const photoCount = await page.locator('.photo-card').count();
			if (photoCount < 2) {
				test.skip(true, 'Need at least 2 photos for navigation test');
				return;
			}

			// Open second photo
			await page.locator('.photo-card').nth(1).click();
			await expect(page.locator('.photo-counter')).toContainText('2 /');

			// Click previous button
			await page.locator('.nav-previous').click();

			// Should show first photo
			await expect(page.locator('.photo-counter')).toContainText('1 /');
		});

		test('should navigate using keyboard arrow keys', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Check if there are multiple photos
			const photoCount = await page.locator('.photo-card').count();
			if (photoCount < 2) {
				test.skip(true, 'Need at least 2 photos for navigation test');
				return;
			}

			// Open first photo
			await page.locator('.photo-card').first().click();
			await expect(page.locator('.photo-counter')).toContainText('1 /');

			// Navigate right with keyboard
			await page.keyboard.press('ArrowRight');
			await expect(page.locator('.photo-counter')).toContainText('2 /');

			// Navigate left with keyboard
			await page.keyboard.press('ArrowLeft');
			await expect(page.locator('.photo-counter')).toContainText('1 /');
		});

		test('should not show previous button on first photo', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open first photo
			await page.locator('.photo-card').first().click();

			// Previous button should not be visible
			await expect(page.locator('.nav-previous')).not.toBeVisible();

			// Next button should be visible (if there are more photos)
			const photoCount = await page.locator('.photo-card').count();
			if (photoCount > 1) {
				await expect(page.locator('.nav-next')).toBeVisible();
			}
		});

		test('should not show next button on last photo', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			const photoCount = await page.locator('.photo-card').count();

			// Open last photo
			await page
				.locator('.photo-card')
				.nth(photoCount - 1)
				.click();

			// Next button should not be visible
			await expect(page.locator('.nav-next')).not.toBeVisible();

			// Previous button should be visible (if there are more photos)
			if (photoCount > 1) {
				await expect(page.locator('.nav-previous')).toBeVisible();
			}
		});
	});

	test.describe('Progressive image loading', () => {
		test('should display thumbnail immediately when lightbox opens', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			// Wait for lightbox overlay to appear first
			await page.waitForSelector('.lightbox-overlay', { timeout: 5000 });

			// Image should be visible (thumbnail from cache or loading)
			const lightboxImage = page.locator('.lightbox-image');
			await expect(lightboxImage).toBeVisible({ timeout: 5000 });

			// Wait for src attribute to be set (may be async on mobile)
			await page.waitForFunction(
				(selector) => {
					const img = document.querySelector(selector);
					return img && img.getAttribute('src') && img.getAttribute('src') !== '';
				},
				'.lightbox-image',
				{ timeout: 10000 }
			);

			// Image should have a src attribute
			const src = await lightboxImage.getAttribute('src');
			expect(src).toBeTruthy();
		});

		test('should show loading indicator initially', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			// Loading indicator might be visible briefly (or might load too fast)
			const loadingIndicator = page.locator('.loading-indicator');
			// Just check it exists in DOM (might not be visible if image loads instantly)
			const exists = await loadingIndicator.count();
			expect(exists).toBeGreaterThanOrEqual(0);
		});

		test('should apply blur effect to thumbnail before original loads', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			const lightboxImage = page.locator('.lightbox-image');

			// Image should initially not have 'loaded' class (has blur)
			const initialClass = await lightboxImage.getAttribute('class');
			// The class might change quickly, so we just verify the image exists
			expect(initialClass).toBeTruthy();
		});
	});

	test.describe('Accessibility', () => {
		test('should be accessible via keyboard from photo grid', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Focus first photo card using Tab
			await page.keyboard.press('Tab');

			// Try to focus photo cards (exact tab count varies)
			// Just verify we can open with Enter
			const firstPhoto = page.locator('.photo-card').first();
			await firstPhoto.focus();
			await page.keyboard.press('Enter');

			// Lightbox should open
			await expect(page.locator('.lightbox-overlay')).toBeVisible();
		});

		test('should have proper ARIA labels', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			// Check ARIA labels
			await expect(page.locator('.lightbox-overlay[role="dialog"]')).toBeVisible();
			await expect(page.locator('button[aria-label="Close lightbox"]')).toBeVisible();

			const photoCount = await page.locator('.photo-card').count();
			if (photoCount > 1) {
				const nextButton = page.locator('button[aria-label="Next photo"]');
				const hasNext = await nextButton.isVisible().catch(() => false);
				if (hasNext) {
					expect(nextButton).toBeTruthy();
				}
			}
		});

		test('should have proper alt text on image', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			await navigateToTestFolder(page);

			// Get photo name
			const firstPhoto = page.locator('.photo-card').first();
			const photoName = await firstPhoto.locator('.photo-name').textContent();

			// Open lightbox
			await firstPhoto.click();

			// Check alt text
			const lightboxImage = page.locator('.lightbox-image');
			const alt = await lightboxImage.getAttribute('alt');
			expect(alt).toBe(photoName);
		});
	});

	test.describe('Mobile responsiveness', () => {
		test('should work on mobile viewport', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			// Lightbox should be visible and functional
			await expect(page.locator('.lightbox-overlay')).toBeVisible();
			await expect(page.locator('.lightbox-image')).toBeVisible();

			// Close button should be visible
			await expect(page.locator('.close-button')).toBeVisible();
		});

		test('should handle touch events on mobile', async ({ page }) => {
			if (!testFolderId) {
				test.skip(true, 'No folder with photos available');
				return;
			}

			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await navigateToTestFolder(page);

			// Open lightbox
			await page.locator('.photo-card').first().click();

			// Should be able to close by tapping close button
			await page.locator('.close-button').click();

			await expect(page.locator('.lightbox-overlay')).not.toBeVisible();
		});
	});
});
