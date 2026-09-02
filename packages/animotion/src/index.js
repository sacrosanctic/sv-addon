import fs from 'node:fs'
import path from 'node:path'

import { pnpm, transforms } from './sv-utils.js'

import { getType, TEMPLATE_SOURCE, templatePaths, writeTemplate } from '@sv-addon/utils'
import { defineAddon, defineAddonOptions } from 'sv'

const options = defineAddonOptions().build()

export default defineAddon({
	id: '@sv-addon/animotion',
	options,

	run: ({ cwd, file, packageManager, sv }) => {
		sv.dependency('@animotion/core', 'next')
		sv.devDependency('@fontsource-variable/jetbrains-mono', '^5.3.0')
		sv.devDependency('@fontsource/atkinson-hyperlegible', '^5.3.0')
		if (packageManager === 'pnpm') {
			sv.file(file.findUp('pnpm-workspace.yaml'), pnpm.allowBuilds(cwd, 'ffmpeg-static'))
		}

		const type = getType(file.typeConfig)
		const { generated } = templatePaths(path.join(import.meta.dirname, TEMPLATE_SOURCE))
		writeTemplate(type, generated, sv.file)

		// the upstream template has no root `+page.svelte`: the optional `[[scene]]`
		// param serves `/`. Remove the scaffolded placeholder so it doesn't shadow the deck.
		// a bandait until i can think of a better solution
		fs.rmSync(path.join(cwd, 'src/routes/+page.svelte'), { force: true })

		sv.file('AGENTS.md', (content) => {
			if (!content) return false

			content += `
## Description

Animotion is a Svelte 5 engine for building animated presentations. A presentation is an ordered sequence of scenes. Each scene is a Svelte component driving its own animation via \`createScene\` (value tweens, FLIP layout changes, morphing code, per-frame ticks).

## Rules

- **Library imports**: Scenes import from \`@animotion/core\`. \`#lib/*\` is only for the project's own config.
- **Animations**: Do not use built-in Svelte transitions or CSS keyframes for animations. Scenes must be renderable as video through the Animotion API.`

			return content
		})

		sv.file(
			file.package,
			transforms.json(({ data }) => {
				data.engines ??= {}
				data.engines.node = '>=23.6.0'
			}),
		)
	},

	setup: ({ dependsOn, isKit, runsAfter, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit')

		dependsOn('tailwindcss')
		dependsOn('experimental')

		runsAfter('aiTools')
	},
})
