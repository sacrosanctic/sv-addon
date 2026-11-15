import path from 'node:path'

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import globals from 'globals'
const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		// vendored upstream template copies are byte-faithful to their source
		// repo (see .prettierignore) and are not this repo's code to lint
		ignores: ['packages/*/src/template/upstream/'],
	},
	js.configs.recommended,
	prettier,

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
)
