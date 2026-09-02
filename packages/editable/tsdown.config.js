import path from 'node:path'

import { TEMPLATE_SOURCE, templatePaths } from '@sv-addon/utils'
import { generateTemplate } from '@sv-addon/utils/build'
import { defineConfig } from 'tsdown'

const paths = templatePaths(path.join('src', TEMPLATE_SOURCE))

export default defineConfig({
	copy: [{ from: paths.generated, to: 'dist/template' }],
	entry: ['src/index.js', 'src/sv-utils.js'],
	format: 'esm',
	hooks: {
		async 'build:before'() {
			generateTemplate(path.resolve(paths.upstream), path.resolve(paths.generated))
		},
	},
})
