import path from 'node:path'

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import json from 'eslint-plugin-jsonc'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import globals from 'globals'
const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	prettier,
	json.configs['recommended-with-jsonc'],
	json.configs['recommended-with-json'],
	json.configs['recommended-with-json5'],
	json.configs['prettier'],

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	{
		rules: {
			'jsonc/sort-keys': ['error', { order: { natural: true }, pathPattern: '.*' }],
		},
	},

	// custom ordering for package.json
	{
		files: ['**/package.json'],
		rules: {
			'jsonc/sort-keys': [
				'error',
				{
					order: [
						'name',
						'version',
						'type',
						'private',
						'scripts',
						'engines',
						'packageManager',
						'exports',
						'files',
						'sideEffects',
						'dependencies',
						'devDependencies',
						'peerDependencies',
						'optionalDependencies',
						'bundledDependencies',
						'author',
						'contributors',
						'license',
						'repository',
						'bugs',
						'homepage',
						'keywords',
						{ order: { natural: true } },
					],
					pathPattern: '.*',
				},
			],
		},
	},

	// custom ordering for tsconfig
	{
		files: ['**/tsconfig.json'],
		rules: {
			'jsonc/sort-keys': [
				'error',
				{
					order: ['extends', { order: { natural: true } }],
					pathPattern: '^$',
				},
			],
		},
	},

	// exception for tsconfig.json
	{
		files: ['**/tsconfig.json'],
		rules: {
			'jsonc/no-comments': 'off',
		},
	},

	{
		extends: [perfectionist.configs['recommended-natural']],
		ignores: ['src/routes/test/**', 'src/content/**'],
		rules: {
			'perfectionist/sort-imports': [
				'error',
				{
					customGroups: [
						{
							elementNamePattern: ['^svelte$', '^sveltejs/.+', '^\\$app.+'],
							groupName: 'svelte',
						},
					],
					groups: [
						['type-import', 'type-internal', 'type-parent', 'type-sibling', 'type-index'],
						'value-builtin',
						'svelte',
						'value-internal',
						['value-parent', 'value-sibling', 'value-index'],
						'value-external',
						'ts-equals-import',
						'unknown',
					],
					internalPattern: ['^\\$lib/.+', '^@repo/.+'],
				},
			],
			'perfectionist/sort-object-types': [
				'error',
				{
					customGroups: [
						{ elementNamePattern: '^id$', groupName: 'id' },
						{ elementNamePattern: '^name$', groupName: 'name' },
					],
					groups: ['id', 'name'],
				},
			],
			'perfectionist/sort-objects': [
				'error',
				{
					customGroups: [
						{ elementNamePattern: '^id$', groupName: 'id' },
						{ elementNamePattern: '^name$', groupName: 'name' },
					],
					groups: ['id', 'name'],
				},
			],
		},
	},
)
