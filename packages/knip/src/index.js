import { transforms } from './sv-utils.js'

import { defineAddon, defineAddonOptions } from 'sv'

const options = defineAddonOptions()
	.add('who', {
		default: '',
		question: 'To whom should the addon say hello?',
		type: 'string',
	})
	.build()

export default defineAddon({
	id: '@sacrosanctic/addon/knip',
	options,

	run: ({ directory, language, options, sv }) => {
		sv.file(
			`${directory.lib}/@sacrosanctic/knip/content.txt`,
			transforms.text(() => {
				return `This is a text file made by the Community Addon Template demo for the add-on: '@sacrosanctic/knip'!`
			}),
		)

		sv.file(
			`${directory.lib}/@sacrosanctic/knip/HelloComponent.svelte`,
			transforms.svelteScript({ language }, ({ ast, js, svelte }) => {
				js.imports.addDefault(ast.instance.content, {
					as: 'content',
					from: './content.txt?raw',
				})

				svelte.addFragment(ast, '<p>{content}</p>')
				svelte.addFragment(ast, `<h2>Hello ${options.who}!</h2>`)
			}),
		)

		sv.file(
			directory.kitRoutes + '/+page.svelte',
			transforms.svelteScript({ language }, ({ ast, js, svelte }) => {
				js.imports.addDefault(ast.instance.content, {
					as: 'HelloComponent',
					from: `$lib/@sacrosanctic/knip/HelloComponent.svelte`,
				})

				svelte.addFragment(ast, '<HelloComponent />')
			}),
		)
	},

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit')
	},
})
