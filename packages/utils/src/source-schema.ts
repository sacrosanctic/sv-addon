import fs from 'node:fs'
import path from 'node:path'

import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'

export const SourceSchema = v.looseObject({
	$schema: v.optional(v.string()),
	repo: v.pipe(v.string(), v.nonEmpty()),
	dir: v.pipe(v.string(), v.nonEmpty()),
	defaultRef: v.pipe(v.string(), v.nonEmpty()),
	exclude: v.array(v.string()),
	moves: v.optional(v.record(v.string(), v.string()), {}),
	replaces: v.optional(
		v.array(
			v.object({
				files: v.union([v.string(), v.array(v.string())]),
				pattern: v.string(),
				replacement: v.string(),
			}),
		),
		[],
	),
	lastSync: v.optional(
		v.object({
			ref: v.string(),
			commit: v.pipe(v.string(), v.regex(/^[0-9a-f]{40}$/)),
			// valibot's isoDateTime actions reject the millis+Z format of Date.toISOString()
			syncedAt: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)),
			files: v.array(v.string()),
		}),
	),
})

export type SourceSchema = v.InferOutput<typeof SourceSchema>

const SCHEMA_FILE = path.resolve(
	import.meta.dirname,
	'../../../node_modules/.cache/sv-addon/source.schema.json',
)

export const emitJsonSchema = (): void => {
	fs.mkdirSync(path.dirname(SCHEMA_FILE), { recursive: true })
	fs.writeFileSync(SCHEMA_FILE, JSON.stringify(toJsonSchema(SourceSchema), null, '\t') + '\n')
}
