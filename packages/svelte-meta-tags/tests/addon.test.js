import fs from 'node:fs'
import path from 'node:path'

import addon from '../src/index.js'
import { setupTest } from './setup/suite.js'

import { expect } from 'vitest'

// set to true to enable browser testing
const browser = false

const { test, testCases } = setupTest(
	{ addon },
	{
		browser,
		filter: (testCase) => testCase.variant.includes('kit'),
		kinds: [
			{
				options: { '@sv-addon/svelte-meta-tags': '' },
				type: 'default',
			},
		],
	},
)

test.concurrent.for(testCases)(
	'@sv-addon/svelte-meta-tags $kind.type $variant',
	async (testCase, ctx) => {
		const cwd = ctx.cwd(testCase)

		// Verify Metatags.svelte component
		const metatagsPath = path.resolve(cwd, 'src/routes/Metatags.svelte')
		const metatagsContent = fs.readFileSync(metatagsPath, 'utf8')
		expect(metatagsContent).toContain("from 'svelte-meta-tags'")
		expect(metatagsContent).toContain('<MetaTags')

		// Verify app.d.ts types
		const appTypesPath = path.resolve(cwd, 'src/app.d.ts')
		const appTypesContent = fs.readFileSync(appTypesPath, 'utf8')
		expect(appTypesContent).toContain('MetaTagsProps')
		expect(appTypesContent).toContain('baseMetaTags')
		expect(appTypesContent).toContain('pageMetaTags')

		// Verify +layout.ts has defineBaseMetaTags
		const layoutTsPath = path.resolve(cwd, 'src/routes/+layout.ts')
		const layoutTsContent = fs.readFileSync(layoutTsPath, 'utf8')
		expect(layoutTsContent).toContain('defineBaseMetaTags')

		// Verify +page.ts has definePageMetaTags
		const pageTsPath = path.resolve(cwd, 'src/routes/+page.ts')
		const pageTsContent = fs.readFileSync(pageTsPath, 'utf8')
		expect(pageTsContent).toContain('definePageMetaTags')

		// Verify +layout.svelte imports Metatags (relative path)
		const layoutSveltePath = path.resolve(cwd, 'src/routes/+layout.svelte')
		const layoutSvelteContent = fs.readFileSync(layoutSveltePath, 'utf8')
		expect(layoutSvelteContent).toContain("from './Metatags.svelte'")

		// if (browser) {
		// 	const { close } = await prepareServer({ cwd, page })
		// 	ctx.onTestFinished(async () => await close())
		// }
	},
)
