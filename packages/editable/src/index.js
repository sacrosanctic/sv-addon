import path from 'node:path'

import { getType, TEMPLATE_SOURCE, templatePaths, writeTemplate } from '@sv-addon/utils'
import { defineAddon, defineAddonOptions } from 'sv'

const options = defineAddonOptions().build()

export default defineAddon({
	id: '@sv-addon/editable',
	options,

	run: ({ file, sv }) => {
		const type = getType(file.typeConfig)
		const { generated } = templatePaths(path.join(import.meta.dirname, TEMPLATE_SOURCE))
		writeTemplate(type, generated, sv.file)
	},

	setup: ({ isKit, unsupported }) => {
		if (!isKit) unsupported('Requires SvelteKit')
	},
})
