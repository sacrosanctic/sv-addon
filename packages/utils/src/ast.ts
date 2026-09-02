import { js } from '@sveltejs/sv-utils'

import type {
	BlockStatement,
	ExportNamedDeclaration,
	Expression,
	Pattern,
	Property,
	ReturnStatement,
	SpreadElement,
} from 'estree'

const createReturnStatement = (argument: Expression | SpreadElement) => {
	return {
		argument,
		type: 'ReturnStatement',
	} as ReturnStatement
}

/**
 * Extract function params from an ExportNamedDeclaration,
 * regardless of whether the export wraps a direct function declaration
 * or a variable declaration holding a function/arrow expression.
 */
export const getFunctionParams = (node: ExportNamedDeclaration): Pattern[] | undefined => {
	const decl = node.declaration
	if (!decl) return

	if (decl.type === 'FunctionDeclaration') {
		return decl.params
	}

	if (decl.type === 'VariableDeclaration') {
		const init = decl.declarations[0]?.init
		if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
			return init.params
		}
	}

	return
}

/**
 * This assumes an object return, which is going to be true most of the time...
 */
export const upsertReturn = (
	node: ReturnStatement | undefined,
	item: Property | SpreadElement,
	fallback: BlockStatement,
) => {
	if (node) {
		if (node.argument?.type === 'ObjectExpression') {
			node.argument.properties.unshift(item)
		} else {
			const merged = js.object.create({})
			merged.properties.push(item)
			if (node.argument) {
				merged.properties.push(js.common.createSpread(node.argument))
			}
			node.argument = merged
		}
	} else {
		const object = js.object.create({})
		object.properties.push(item)
		fallback.body.push(createReturnStatement(object))
	}
}
