import fs from 'node:fs'
import path from 'node:path'

export type Type = 'typescript' | 'checkjs' | 'none'
export type TemplateFile = { name: string; contents: string }

export const TEMPLATE_SOURCE = 'template/source.json'

export const templatePaths = (sourceFile: string) => {
	const root = path.dirname(sourceFile)
	return {
		source: sourceFile,
		upstream: path.join(root, 'upstream'),
		generated: path.join(root, 'generated'),
	}
}

export const writeTemplate = (
	language: Type,
	outDir: string,
	write: (path: string, contents: () => string) => void,
): void => {
	const json = path.join(outDir, `${language}.json`)
	const files = JSON.parse(fs.readFileSync(json, 'utf-8')) as TemplateFile[]

	for (const file of files) write(file.name, () => file.contents)
}

export const getType = (typeConfig: string | undefined): Type => {
	if (!typeConfig) return 'none'
	if (typeConfig.endsWith('tsconfig.json')) return 'typescript'
	return 'checkjs'
}
