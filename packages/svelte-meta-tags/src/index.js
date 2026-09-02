import { createPrinter, dedent, transforms, Walker } from './sv-utils.js'
import { getFunctionParams, upsertReturn } from './utils.js'

import { defineAddon, defineAddonOptions } from 'sv'

export default defineAddon({
	id: '@sv-addon/addon/svelte-meta-tags',
	options: defineAddonOptions().build(),

	run: ({ directory, file, language, sv }) => {
		sv.devDependency('svelte-meta-tags', '^5.0.0')

		const componentName = 'Metatags.svelte'
		const componentPath = `${directory.kitRoutes}/${componentName}`

		const [ts] = createPrinter(language === 'ts')

		// ##################################
		// create the component
		// ##################################
		sv.file(
			componentPath,
			transforms.text(
				() => dedent`
							<script${ts(' lang="ts"')}>
								import { page } from '$app/state';
								import { MetaTags, deepMerge } from 'svelte-meta-tags';
							</script>

							<MetaTags {...deepMerge(page.data.baseMetaTags, page.data.pageMetaTags)} />
							`,
			),
		)

		// ##################################
		// import the component in root
		// ##################################
		sv.file(
			`${directory.kitRoutes}/+layout.svelte`,
			transforms.svelteScript({ language }, ({ ast, js, svelte }) => {
				const relativeComponentPath = file.getRelative({
					from: `${directory.kitRoutes}/+layout.svelte`,
					to: componentPath,
				})
				const existingImport = js.imports.find(ast.instance.content, {
					name: 'Metatags',
					from: relativeComponentPath,
				})

				if (existingImport.statement) return
				js.imports.addDefault(ast.instance.content, {
					as: 'Metatags',
					from: relativeComponentPath,
				})
				svelte.addFragment(ast, '<Metatags />')
			}),
		)

		// ##################################
		// add types to `PageData`
		// ##################################
		sv.file(
			`${directory.src}/app.d.ts`,
			transforms.script(({ ast, comments, js }) => {
				js.imports.addNamed(ast, {
					from: 'svelte-meta-tags',
					imports: ['MetaTagsProps'],
					isType: true,
				})

				const pageData = js.kit.addGlobalAppInterface(ast, { name: 'PageData' })
				comments.remove((c) => c.type === 'Line' && c.value.trim() === 'interface PageData {}')

				void ['baseMetaTags', 'pageMetaTags'].forEach((name) => {
					const hasTypeSignature = pageData.body.body.find((prop) =>
						js.common.hasTypeProperty(prop, { name }),
					)
					if (hasTypeSignature) return
					pageData.body.body.push(js.common.createTypeProperty(name, 'MetaTagsProps', true))
				})
			}),
		)

		// ##################################
		// example on routes/+layout.ts
		// ##################################
		sv.file(
			`${directory.kitRoutes}/+layout.ts`,
			transforms.script(({ ast, js }) => {
				const metatags = {
					description: '...',
					openGraph: {
						description: '...',
						siteName: '...',
						title: '...',
						type: 'website',
						url: js.common.parseExpression('new URL(url.pathname, url.origin).href'),
					},
					title: '...',
					twitter: {
						cardType: 'summary',
						description: '...',
						title: '...',
					},
				}

				if (language === 'ts') {
					js.imports.addNamed(ast, { from: './$types', imports: ['LayoutLoad'], isType: true })
				}
				js.imports.addNamed(ast, { from: 'svelte-meta-tags', imports: ['defineBaseMetaTags'] })

				const defineMetatagsFnCall = /** @type {import('estree').CallExpression} */ ({
					arguments: [js.object.create(metatags)],
					callee: js.variables.createIdentifier('defineBaseMetaTags'),
					optional: false,
					type: 'CallExpression',
				})

				const loadBlock = js.common.createBlockStatement()

				const fallback = js.variables.declaration(ast, {
					name: 'load',
					kind: 'const',
					value: js.functions.createArrow({
						async: false,
						body: loadBlock,
					}),
				})

				if (language === 'ts') {
					js.variables.typeAnnotateDeclarator(fallback.declarations[0], { typeName: 'LayoutLoad' })
				}

				const loadFn = js.exports.createNamed(ast, { name: 'load', fallback })

				const params = getFunctionParams(loadFn)
				if (!params) {
					// just for type checking, should always exist
				} else {
					const property = /** @type {import('estree').AssignmentProperty} */ ({
						computed: false,
						key: js.variables.createIdentifier('url'),
						kind: 'init',
						method: false,
						shorthand: true,
						type: 'Property',
						value: js.variables.createIdentifier('url'),
					})

					if (params[0]?.type === 'ObjectPattern') {
						params[0].properties.push(property)
					} else {
						params[0] = { properties: [property], type: 'ObjectPattern' }
					}
				}

				/** @type {import('estree').ReturnStatement | undefined} */
				let returnStmt

				Walker.walk(loadFn, null, {
					/**
					 * @param {import('estree').ReturnStatement} node
					 * @param {import('zimmerframe').Context<import('estree').ReturnStatement, null>} ctx
					 */
					ReturnStatement(node, ctx) {
						returnStmt = node
						ctx.stop()
					},
				})

				const spread = js.common.createSpread(defineMetatagsFnCall)
				upsertReturn(returnStmt, spread, loadBlock)
			}),
		)

		// ##################################
		// example on routes/+page.ts
		// ##################################
		sv.file(
			`${directory.kitRoutes}/+page.ts`,
			transforms.script(({ ast, js }) => {
				const pageMetatags = {
					description: 'Page description',
					title: 'Page title',
				}

				js.imports.addNamed(ast, { from: 'svelte-meta-tags', imports: ['definePageMetaTags'] })

				const definePageMetaTagsFnCall = /** @type {import('estree').CallExpression} */ ({
					arguments: [js.object.create(pageMetatags)],
					callee: js.variables.createIdentifier('definePageMetaTags'),
					optional: false,
					type: 'CallExpression',
				})

				const loadBlock = js.common.createBlockStatement()

				const fallback = js.variables.declaration(ast, {
					name: 'load',
					kind: 'const',
					value: js.functions.createArrow({
						async: false,
						body: loadBlock,
					}),
				})

				const loadFn = js.exports.createNamed(ast, { name: 'load', fallback })

				const params = getFunctionParams(loadFn)
				if (params?.[0]?.type === 'ObjectPattern') {
					const property = /** @type {import('estree').AssignmentProperty} */ ({
						computed: false,
						key: js.variables.createIdentifier('url'),
						kind: 'init',
						method: false,
						shorthand: true,
						type: 'Property',
						value: js.variables.createIdentifier('url'),
					})
					params[0].properties.push(property)
				}

				/** @type {import('estree').ReturnStatement | undefined} */
				let returnStmt

				Walker.walk(loadFn, null, {
					/**
					 * @param {import('estree').ReturnStatement} node
					 * @param {import('zimmerframe').Context<import('estree').ReturnStatement, null>} ctx
					 */
					ReturnStatement(node, ctx) {
						returnStmt = node
						ctx.stop()
					},
				})

				const spread = js.common.createSpread(definePageMetaTagsFnCall)
				upsertReturn(returnStmt, spread, loadBlock)
			}),
		)
	},
})
