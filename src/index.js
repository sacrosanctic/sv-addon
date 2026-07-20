import { defineAddon, defineAddonOptions } from 'sv';
import { transforms } from './sv-utils.js';

const options = defineAddonOptions()
	.add('title', {
		question: 'What is the default site title?',
		type: 'string',
		default: 'My Site'
	})
	.add('description', {
		question: 'What is the default site description?',
		type: 'string',
		default: ''
	})
	.build();

export default defineAddon({
	id: '@sacrosanctic/svelte-meta-tags',
	options,

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit');
	},

	run: ({ sv, options, directory, language }) => {
		sv.devDependency('svelte-meta-tags', '^5.0.0');

		sv.file(
			`${directory.lib}/components/Metatags.svelte`,
			transforms.text(() => {
				return `<script>
	import { page } from '$app/state';
	import { MetaTags } from 'svelte-meta-tags';
</script>

<MetaTags {...(page.data.baseMetaTags ?? {}), ...(page.data.pageMetaTags ?? {})} />
`;
			})
		);

		const appDtsPath = language === 'ts' ? `${directory.src}/app.d.ts` : `${directory.src}/app.ts`;
		sv.file(
			appDtsPath,
			transforms.text(() => {
				if (language === 'ts') {
					return `// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MetaTagsProps } from 'svelte-meta-tags';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			baseMetaTags?: MetaTagsProps;
			pageMetaTags?: MetaTagsProps;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
`;
				}
				return `// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// @ts-check

/** @type {import('svelte-meta-tags').MetaTagsProps} */

/**
 * @typedef {Object} App.PageData
 * @property {import('svelte-meta-tags').MetaTagsProps} [baseMetaTags]
 * @property {import('svelte-meta-tags').MetaTagsProps} [pageMetaTags]
 */
`;
			})
		);

		const title = options.title || 'My Site';
		const description = options.description || '';

		sv.file(
			`${directory.kitRoutes}/+layout.ts`,
			transforms.text(() => {
				if (language === 'ts') {
					return `import type { LayoutLoad } from './$types';
import { defineBaseMetaTags } from 'svelte-meta-tags';

export const load: LayoutLoad = ({ url }) => {
	return defineBaseMetaTags({
		title: '${title}',
		description: '${description}',
		openGraph: {
			type: 'website',
			url: new URL(url.pathname, url.origin).href,
			title: '${title}',
			description: '${description}',
			siteName: '${title}'
		},
		twitter: {
			cardType: 'summary',
			title: '${title}',
			description: '${description}'
		}
	});
};
`;
				}
				return `import { defineBaseMetaTags } from 'svelte-meta-tags';

/** @type {import('./$types').LayoutLoad} */
export const load = ({ url }) => {
	return defineBaseMetaTags({
		title: '${title}',
		description: '${description}',
		openGraph: {
			type: 'website',
			url: new URL(url.pathname, url.origin).href,
			title: '${title}',
			description: '${description}',
			siteName: '${title}'
		},
		twitter: {
			cardType: 'summary',
			title: '${title}',
			description: '${description}'
		}
	});
};
`;
			})
		);

		sv.file(
			`${directory.kitRoutes}/+layout.svelte`,
			transforms.text(({ content }) => {
				const importLine = `\timport Metatags from '$lib/components/Metatags.svelte';\n`;
				const componentLine = '\n\t<Metatags />\n';

				if (content) {
					if (content.includes('Metatags')) return false;

					const scriptClose = content.indexOf('</script>');
					if (scriptClose !== -1) {
						const before = content.slice(0, scriptClose);
						const after = content.slice(scriptClose);
						return before + importLine + after + componentLine;
					}

					return importLine + content + componentLine;
				}

				return `<script>
${importLine}</script>

${componentLine}`;
			})
		);
	}
});
