/** @type {import("prettier").Config} */
const config = {
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
	plugins: ['prettier-plugin-svelte'],
	printWidth: 100,
	semi: false,
	singleQuote: true,
	trailingComma: 'all',
	useTabs: true,
}

export default config
