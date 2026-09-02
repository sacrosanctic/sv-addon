// Build-time only: sucrase here must never be reachable from the runtime entry,
// as addon bundles are the final artifact (sv loads them directly, no tree-shaking pass).
import fs from 'node:fs'
import path from 'node:path'

import { transform } from 'sucrase'

import type { TemplateFile, Type } from './template.ts'

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
	error instanceof Error && 'code' in error

const stripTypescript = (content: string): string => {
	let { code } = transform(content, {
		transforms: ['typescript'],
		disableESTransforms: true,
	})

	code = code.replace(/^\s*[a-z]+;$/gm, '')
	code = code.replace(/import (.+?) from ['"](.+?)\.ts['"]/g, 'import $1 from "$2.js"')

	return code
}

const stripJsdoc = (content: string): string => {
	return content
		.replace(/ \/\*\*\*\//g, '')
		.replace(
			/\/\*\*([\s\S]+?)(@[\s\S]+?)?\*\/([\s\n]+)/g,
			(match, description: string, _tags: string, whitespace: string) => {
				if (/^\s+(\*\s*)?$/.test(description)) {
					return ''
				}
				return `/**${description.replace(/\* $/, '')}*/${whitespace}`
			},
		)
}

const stripSvelteTypescript = (contents: string): string => {
	return contents.replace(
		/<script([^>]+)>([\s\S]+?)<\/script>/g,
		(_match, attrs: string, typescript: string) => {
			const imports: string[] = []
			const importPattern = /import (.+?) from/g
			let importMatch: RegExpExecArray | null
			while ((importMatch = importPattern.exec(typescript))) {
				const wordPattern = /[a-z_$][a-z0-9_$]*/gi
				let wordMatch: RegExpExecArray | null
				while ((wordMatch = wordPattern.exec(importMatch[1]))) {
					imports.push(wordMatch[0])
				}
			}

			const suffix = `\n${imports.join(',')}`
			const transformed = transform(typescript + suffix, {
				transforms: ['typescript'],
				disableESTransforms: true,
			}).code.slice(0, -suffix.length)

			const stripped = transformed.trim().replace(/^(.)/gm, '\t$1')

			return `<script${attrs.replace(' lang="ts"', '')}>\n${stripped}\n</script>`
		},
	)
}

export const generateTemplate = (templateDir: string, outputDir: string): void => {
	try {
		fs.mkdirSync(outputDir, { recursive: true })
	} catch (error) {
		if (!isNodeError(error) || error.code !== 'EEXIST') throw error
	}

	const types: Record<Type, TemplateFile[]> = {
		typescript: [],
		checkjs: [],
		none: [],
	}

	for (const entry of fs.readdirSync(templateDir, { recursive: true, withFileTypes: true })) {
		if (!entry.isFile() || entry.name === '.gitkeep') continue

		const fullPath = path.join(entry.parentPath, entry.name)
		const name = path.relative(templateDir, fullPath).replace(/\\/g, '/')
		const contents = fs.readFileSync(fullPath, 'utf-8')

		if (name.endsWith('.d.ts')) {
			if (name.endsWith('app.d.ts')) {
				types.checkjs.push({ name, contents })
			}
			types.typescript.push({ name, contents })
			continue
		}

		if (name.endsWith('.ts')) {
			const js = stripTypescript(contents)
			const jsName = name.replace(/\.ts$/, '.js')

			types.typescript.push({ name, contents: stripJsdoc(contents) })
			types.checkjs.push({ name: jsName, contents: js })
			types.none.push({ name: jsName, contents: stripJsdoc(js) })
			continue
		}

		if (name.endsWith('.svelte')) {
			const jsContents = stripSvelteTypescript(contents)

			types.typescript.push({ name, contents: stripJsdoc(contents) })
			types.checkjs.push({ name, contents: jsContents })
			types.none.push({ name, contents: stripJsdoc(jsContents) })
			continue
		}

		types.typescript.push({ name, contents })
		types.checkjs.push({ name, contents })
		types.none.push({ name, contents })
	}

	for (const [language, files] of Object.entries(types) as [Type, TemplateFile[]][]) {
		fs.writeFileSync(path.join(outputDir, `${language}.json`), JSON.stringify(files, null, '\t'))
	}
}
