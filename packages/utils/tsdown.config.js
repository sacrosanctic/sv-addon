import { defineConfig } from 'tsdown'

export default defineConfig({
	dts: true,
	entry: {
		index: 'src/index.ts',
		build: 'src/build.ts',
	},
	exports: {
		devExports: true,
	},
	format: 'esm',
})
