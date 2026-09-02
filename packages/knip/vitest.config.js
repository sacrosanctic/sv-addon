import { defineConfig } from 'vitest/config'

const ONE_MINUTE = 1000 * 60

export default defineConfig({
	test: {
		exclude: ['tests/setup/*'],
		expect: {
			requireAssertions: true,
		},
		globalSetup: ['tests/setup/global.js'],
		hookTimeout: ONE_MINUTE * 3,
		include: ['tests/**/*.test.{js,ts}'],
		testTimeout: ONE_MINUTE * 3,
	},
})
