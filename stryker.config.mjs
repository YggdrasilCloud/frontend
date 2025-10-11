/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
	packageManager: 'npm',
	testRunner: 'vitest',
	vitest: {
		configFile: 'vitest.config.ts'
	},
	mutate: [
		'src/lib/domain/**/*.ts',
		'!src/lib/domain/**/*.test.ts',
		'!src/lib/domain/**/*.spec.ts'
	],
	coverageAnalysis: 'perTest',
	reporters: ['html', 'clear-text', 'progress', 'dashboard'],
	htmlReporter: {
		fileName: 'reports/mutation/mutation-report.html'
	},
	thresholds: {
		high: 80,
		low: 60,
		break: 50
	},
	timeoutMS: 60000,
	maxConcurrentTestRunners: 4
};

export default config;
