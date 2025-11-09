import { execSync } from 'node:child_process';

/**
 * Global setup for Playwright E2E tests
 * Seeds the backend database with test data before running tests
 */
async function globalSetup() {
	console.log('🌱 Seeding test data...');

	try {
		// Run the seed command on the backend
		// Use default APP_ENV (dev) so data is seeded to the same database
		// that the backend serves during E2E tests
		// Use --no-interaction to skip confirmation prompt
		execSync(
			'cd ../core && docker compose exec -T app bin/console app:seed:test --no-interaction',
			{
				stdio: 'inherit',
				timeout: 60000
			}
		);

		console.log('✅ Test data seeded successfully');
	} catch (error) {
		console.error('❌ Failed to seed test data:', error);
		throw error;
	}
}

export default globalSetup;
