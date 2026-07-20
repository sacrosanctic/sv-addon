import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import addon from '../src/index.js';
import { setupTest } from './setup/suite.js';

// set to true to enable browser testing
const browser = false;

const { test, prepareServer, testCases } = setupTest(
	{ addon },
	{
		kinds: [
			{
				type: 'default',
				options: { [addon.id]: { title: 'Test Site', description: 'A test site' } }
			}
		],
		filter: (testCase) => testCase.variant.includes('kit'),
		browser
	}
);

test.concurrent.for(testCases)(
	'@sacrosanctic/svelte-meta-tags $kind.type $variant',
	async (testCase, { page, ...ctx }) => {
		const cwd = ctx.cwd(testCase);

		// Verify Metatags.svelte component
		const metatagsPath = path.resolve(cwd, 'src/lib/components/Metatags.svelte');
		const metatagsContent = fs.readFileSync(metatagsPath, 'utf8');
		expect(metatagsContent).toContain("import { MetaTags } from 'svelte-meta-tags'");
		expect(metatagsContent).toContain('<MetaTags');

		// Verify app.d.ts / app.ts types
		const hasTs = testCase.variant.includes('ts');
		const appTypesPath = path.resolve(
			cwd,
			hasTs ? 'src/app.d.ts' : 'src/app.ts'
		);
		const appTypesContent = fs.readFileSync(appTypesPath, 'utf8');
		expect(appTypesContent).toContain('MetaTagsProps');
		expect(appTypesContent).toContain('baseMetaTags');
		expect(appTypesContent).toContain('pageMetaTags');

		// Verify +layout.ts has defineBaseMetaTags
		const layoutTsPath = path.resolve(cwd, 'src/routes/+layout.ts');
		const layoutTsContent = fs.readFileSync(layoutTsPath, 'utf8');
		expect(layoutTsContent).toContain('defineBaseMetaTags');
		expect(layoutTsContent).toContain('Test Site');

		// Verify +layout.svelte imports Metatags
		const layoutSveltePath = path.resolve(cwd, 'src/routes/+layout.svelte');
		const layoutSvelteContent = fs.readFileSync(layoutSveltePath, 'utf8');
		expect(layoutSvelteContent).toContain('Metatags');

		if (browser) {
			const { close } = await prepareServer({ cwd, page });
			ctx.onTestFinished(async () => await close());
		}
	}
);
