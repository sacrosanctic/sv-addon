import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

import addon from '../src/index.js'
import { setupTest } from './setup/suite.js'

const langs = ['en', 'fr', 'hu', 'en']

// set to true to enable browser testing
const browser = false

const { test, prepareServer, testCases } = setupTest(
	{ addon },
	{
		kinds: [
			{
				type: 'default',
				options: {
					[addon.id]: { demo: true, languageTags: langs.join(','), reactive: false },
				},
			},
			{
				type: 'reactive',
				options: {
					[addon.id]: { demo: true, languageTags: langs.join(','), reactive: true },
				},
			},
		],
		filter: (addonTestCase) => addonTestCase.variant.includes('kit'),
		browser,
	},
)

test.concurrent.for(testCases)(
	'@sv-addon/paraglide $kind.type $variant',
	async (testCase, { page, ...ctx }) => {
		const cwd = ctx.cwd(testCase)

		if (browser) {
			const { close } = await prepareServer({ cwd, page })
			// kill server process when we're done
			ctx.onTestFinished(async () => await close())
		} else {
			// the paraglide vite plugin generates the messages at build time,
			// replicate what `prepareServer` does without the browser
			execSync('pnpm build', { cwd, stdio: 'pipe' })
		}

		for (const lang of langs) {
			const filePath = path.resolve(cwd, `src/lib/paraglide/messages/${lang}.js`)
			const fileContent = fs.readFileSync(filePath, 'utf8')
			expect(fileContent).toContain(`hello_world`)
		}

		const settingsPath = path.resolve(cwd, 'project.inlang/settings.json')
		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
		expect(settings.locales).toEqual(['en', 'fr', 'hu'])

		const declarationsPath = path.resolve(cwd, 'src/lib/paraglide/messages/_index.d.ts')
		const declarations = fs.readFileSync(declarationsPath, 'utf8')
		expect(declarations).toContain('hello_world')

		// reactive language switching
		const reactive = testCase.kind.type === 'reactive'
		const language = testCase.variant.split('-').at(-1) as 'ts' | 'js'
		const localeClassPath = path.resolve(cwd, `src/lib/paraglide.svelte.${language}`)
		expect(fs.existsSync(localeClassPath)).toBe(reactive)
		if (reactive) {
			const localeClass = fs.readFileSync(localeClassPath, 'utf8')
			expect(localeClass).toContain('class Locale')
			expect(localeClass).toContain('$state')
			expect(localeClass).toContain('$lib/paraglide/runtime')

			const hooksClient = fs.readFileSync(path.resolve(cwd, `src/hooks.client.${language}`), 'utf8')
			expect(hooksClient).toContain('new Locale()')

			const viteConfigPath = ['ts', 'js']
				.map((ext) => path.resolve(cwd, `vite.config.${ext}`))
				.find((p) => fs.existsSync(p))
			expect(fs.readFileSync(viteConfigPath!, 'utf8')).toContain("strategy: ['url']")

			const demoPage = fs.readFileSync(
				path.resolve(cwd, 'src/routes/demo/paraglide/+page.svelte'),
				'utf8',
			)
			expect(demoPage).toContain('{#each locales as locale (locale)}')
		}
	},
)
