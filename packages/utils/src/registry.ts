import createClient from 'openapi-fetch'

import type { paths } from '../node_modules/.cache/sv-addon/npm-registry-openapi.d.ts'

const registry = createClient<paths>({ baseUrl: 'https://registry.npmjs.org' })

/**
 * Resolves the latest published version of `pkg` via the npm registry search
 * API as a caret range, falling back to the `latest` dist-tag when the
 * registry is unreachable or returns no exact match.
 */
export const latestRange = async (pkg: string): Promise<string> => {
	try {
		const search = await registry.GET('/-/v1/search', {
			params: { query: { text: pkg, size: 10 } },
		})
		if (search.error || !search.data) throw new Error(`registry search failed for ${pkg}`)

		const found = search.data.objects?.find((entry) => entry.package?.name === pkg)!
		const version = found?.package?.version
		return version ? `^${version}` : 'latest'
	} catch (e) {
		console.error(e)
		return 'latest'
	}
}
