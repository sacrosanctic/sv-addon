import fs from 'node:fs'
import path from 'node:path'

import addon from '../src/index.js'
import { setupTest } from './setup/suite.js'

import { expect } from 'vitest'

// set to true to enable browser testing
const browser = false

const { test, prepareServer, testCases } = setupTest(
	{ addon },
	{
		kinds: [{ type: 'default', options: { [addon.id]: {} } }],
		filter: (testCase) => testCase.variant.includes('kit'),
		browser,
	},
)

test.concurrent.for(testCases)(
	'@sv-addon/animotion $kind.type $variant',
	async (testCase, { page, ...ctx }) => {
		const cwd = ctx.cwd(testCase)

		// Verify the intro scene was scaffolded from the template
		const scenePath = path.resolve(cwd, 'src/scenes/01-intro.svelte')
		const sceneContent = fs.readFileSync(scenePath, 'utf8')
		expect(sceneContent).toContain('createScene')

		// Verify the layout route was scaffolded
		const layoutPath = path.resolve(cwd, 'src/routes/+layout.svelte')
		expect(fs.existsSync(layoutPath)).toBe(true)

		// Verify the placeholder root page was removed so `[[scene]]` serves `/`
		expect(fs.existsSync(path.resolve(cwd, 'src/routes/+page.svelte'))).toBe(false)
		expect(fs.existsSync(path.resolve(cwd, 'src/routes/[[scene]]/+page.svelte'))).toBe(true)

		// Verify dependencies and the node engine were added
		const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'))
		expect(pkg.dependencies['@animotion/core']).toBe('next')
		expect(pkg.devDependencies['@fontsource-variable/jetbrains-mono']).toBeDefined()
		expect(pkg.engines.node).toBe('>=23.6.0')

		// For browser testing
		if (browser) {
			const { close } = await prepareServer({ cwd, page })
			// kill server process when we're done
			ctx.onTestFinished(async () => await close())

			// expectations
			const bodyText = await page.locator('body').textContent()
			expect(bodyText).toContain('Animotion')
		}
	},
)
