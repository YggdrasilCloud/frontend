import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration
 * Tests run against all major browsers (Chromium, Firefox, WebKit)
 */
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { outputFolder: 'reports/playwright' }], ['list']],
	globalSetup: './tests/global-setup.ts',
	use: {
		// Use frontend service name when running in Docker, localhost otherwise
		baseURL: process.env.DOCKER_ENV ? 'http://frontend:5173' : 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		/* Test against mobile viewports. */
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'npm run dev',
		url: process.env.DOCKER_ENV ? 'http://frontend:5173' : 'http://localhost:5173',
		reuseExistingServer: true, // Always reuse since dev server runs in Docker
		timeout: 120000
	}
});
