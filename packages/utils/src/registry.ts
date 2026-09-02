import { Ok, tryAsync } from 'wellcrafted/result'

/**
 * @returns the latest `^<semver>` or `latest`
 */
export const latestRange = async (pkg: string): Promise<string> => {
	const { data: semver } = await tryAsync({
		try: async () => {
			const response = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
			if (!response.ok) throw new Error(`registry lookup failed for ${pkg}`)
			const { version } = (await response.json()) as { version?: string }
			return version
		},
		catch: (cause) => {
			console.error(cause)
			return Ok(undefined)
		},
	})
	return semver ? `^${semver}` : 'latest'
}
