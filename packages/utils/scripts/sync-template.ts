#!/usr/bin/env node

// Syncs src/template/upstream from the source repo defined in src/template/source.json.
// Run from the addon package directory (see the `sync-template` script in its package.json).
// source.json holds the sync config (repo, dir, exclude, moves, replaces); this script
// rewrites it after each run with an updated `lastSync` receipt, preserving config keys.
// If source.json is missing, a placeholder skeleton is created and the run aborts;
// a skeleton (unfilled repo) also aborts.
// Usage: pnpm sync-template [--ref <branch|tag|sha>]

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import degit from 'degit'
import * as v from 'valibot'

import { TEMPLATE_SOURCE, templatePaths } from '../src/template.ts'
import { emitJsonSchema, SourceSchema } from '../src/source-schema.ts'

const paths = templatePaths(path.resolve('src', TEMPLATE_SOURCE))

const PLACEHOLDER_REPO = 'TODO/owner-repo'

const SOURCE_SKELETON = {
	$schema: '../../../../node_modules/.cache/sv-addon/source.schema.json',
	repo: PLACEHOLDER_REPO,
	dir: 'template',
	defaultRef: 'main',
	exclude: [],
}

const loadConfig = (): SourceSchema => {
	if (!fs.existsSync(paths.source)) {
		fs.mkdirSync(path.dirname(paths.source), { recursive: true })
		fs.writeFileSync(paths.source, JSON.stringify(SOURCE_SKELETON, null, '\t') + '\n')
		console.warn(
			`⚠ created ${path.relative(process.cwd(), paths.source)} — fill in repo/dir/defaultRef and re-run`,
		)
		process.exit(1)
	}

	const config = v.parse(SourceSchema, JSON.parse(fs.readFileSync(paths.source, 'utf-8')))
	if (config.repo === PLACEHOLDER_REPO) {
		console.warn(
			`⚠ ${path.relative(process.cwd(), paths.source)} repo is a placeholder — aborting sync`,
		)
		process.exit(1)
	}
	return config
}

const config = loadConfig()

const collectFiles = (dir: string) => {
	const files: { source: string; target: string }[] = []
	for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
		if (!entry.isFile()) continue
		const source = path.relative(dir, path.join(entry.parentPath, entry.name)).replace(/\\/g, '/')
		files.push({ source, target: config.moves[source] ?? source })
	}
	return files
}

const main = async (): Promise<void> => {
	emitJsonSchema()

	const flagIndex = process.argv.indexOf('--ref')
	const ref = flagIndex === -1 ? config.defaultRef : process.argv[flagIndex + 1]
	if (!ref) throw new Error('--ref requires a value (branch, tag, or sha)')

	const warnings: string[] = []
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-addon-sync-'))
	// degit resolves the ref itself; FOUND_MATCH/USING_CACHE info events report the commit hash
	let commit = ''
	let results: { target: string; contents: string }[]
	try {
		const emitter = degit(undefined, { verbose: true })
		// degit reports the resolved commit hash in these events: by name in FOUND_MATCH/
		// USING_CACHE, and as the cache filename `${hash}.tar.gz` in DOWNLOADING/EXTRACTING
		// (sha-prefix refs resolve silently, so the name events alone don't cover them)
		emitter.on('info', (info) => {
			if (
				info.code !== 'FOUND_MATCH' &&
				info.code !== 'USING_CACHE' &&
				info.code !== 'DOWNLOADING' &&
				info.code !== 'EXTRACTING'
			)
				return
			commit ||= /\b[0-9a-f]{40}\b/.exec(info.message)?.[0] ?? ''
		})
		emitter.on('warn', (info) => {
			// exclude entries are remove-if-present, so absent ones are not worth warning about;
			// search_replace events carry no code, so missing replace targets still surface
			if (info.code === 'FILE_DOES_NOT_EXIST' || info.code === 'NO_FILES_MATCHED') return
			warnings.push(`degit: ${info.message}`)
		})

		// `replacement` only accept env vars
		config.replaces.forEach((rule, index) => {
			process.env[`SV_ADDON_SYNC_REPLACEMENT_${index}`] = rule.replacement
		})
		await emitter.doActions(
			[
				{ action: 'clone', src: `${config.repo}/${config.dir}#${ref}` },
				{ action: 'remove', files: config.exclude, allowGlobs: true },
				...config.replaces.map((rule, index) => ({
					...rule,
					action: 'search_replace' as const,
					replacement: `SV_ADDON_SYNC_REPLACEMENT_${index}`,
				})),
			],
			tmp,
		)
		if (!commit) throw new Error(`degit did not report a commit hash for ${ref}`)

		for (const rule of config.replaces) {
			for (const file of Array.isArray(rule.files) ? rule.files : [rule.files]) {
				const target = path.join(tmp, file)
				if (!fs.existsSync(target)) continue
				if (!fs.readFileSync(target, 'utf-8').includes(rule.replacement)) {
					warnings.push(`replace pattern not found in ${file} — check upstream changes`)
				}
			}
		}

		results = collectFiles(tmp).map(({ source, target }) => ({
			target,
			contents: fs.readFileSync(path.join(tmp, source), 'utf-8'),
		}))
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true })
	}

	const managed = new Set(results.map((file) => file.target))
	let written = 0
	let unchanged = 0

	for (const { target, contents } of results) {
		const dest = path.join(paths.upstream, target)
		if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf-8') === contents) {
			unchanged++
			continue
		}
		fs.mkdirSync(path.dirname(dest), { recursive: true })
		fs.writeFileSync(dest, contents)
		written++
	}

	let deleted = 0
	for (const file of config.lastSync?.files ?? []) {
		if (managed.has(file)) continue
		const dest = path.join(paths.upstream, file)
		if (!fs.existsSync(dest)) continue
		fs.rmSync(dest)
		deleted++
	}

	const local = fs
		.readdirSync(paths.upstream, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map(({ parentPath, name }) => path.relative(paths.upstream, path.join(parentPath, name)))
	for (const file of local) {
		if (managed.has(file)) continue
		warnings.push(
			`not from upstream: ${path.relative(process.cwd(), path.join(paths.upstream, file))} (left untouched)`,
		)
	}

	fs.writeFileSync(
		paths.source,
		JSON.stringify(
			{
				...config,
				lastSync: {
					ref,
					commit,
					syncedAt: new Date().toISOString(),
					files: [...managed].sort(),
				},
			},
			null,
			'\t',
		) + '\n',
	)

	for (const warning of warnings) console.warn(`⚠ ${warning}`)
	console.log(
		`synced ${config.repo}@${commit.slice(0, 7)}: ${written} written, ${unchanged} unchanged, ${deleted} deleted`,
	)
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error))
	process.exit(1)
})
