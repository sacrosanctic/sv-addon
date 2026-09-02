import { defineConfig } from 'tsdown'

export default defineConfig({
	dts: true,
	entry: {
		index: 'src/index.ts',
		build: 'src/build.ts',
		'sync-template': 'src/scripts/sync-template.ts',
	},
	exports: {
		devExports: true,
		exclude: ['sync-template'],
		bin: { 'sv-addon-sync-template': './src/scripts/sync-template.ts' },
	},
	format: 'esm',
})
