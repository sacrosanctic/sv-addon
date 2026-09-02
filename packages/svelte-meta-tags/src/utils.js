import { js } from './sv-utils.js'

/** @param {import('estree').Expression | import('estree').SpreadElement} argument */
export function createReturnStatement(argument) {
	return /** @type {import('estree').ReturnStatement} */ ({
		argument,
		type: 'ReturnStatement',
	})
}

/**
 * Extract function params from an ExportNamedDeclaration,
 * regardless of whether the export wraps a direct function declaration
 * or a variable declaration holding a function/arrow expression.
 *
 * @param {import('estree').ExportNamedDeclaration} node
 * @returns {import('estree').Pattern[] | undefined}
 */
export function getFunctionParams(node) {
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
 * @param {import('estree').ReturnStatement | undefined} node
 * @param {import('estree').Expression | import('estree').SpreadElement} item
 * @param {import('estree').BlockStatement} fallback
 */
export function upsertReturn(node, item, fallback) {
	if (node) {
		if (node.argument?.type === 'ObjectExpression') {
			node.argument.properties.unshift(/** @type {any} */ (item))
		} else {
			const merged = js.object.create({})
			merged.properties.push(/** @type {any} */ (item))
			if (node.argument) {
				merged.properties.push(js.common.createSpread(node.argument))
			}
			node.argument = merged
		}
	} else {
		const object = js.object.create({})
		object.properties.push(/** @type {any} */ (item))
		fallback.body.push(createReturnStatement(object))
	}
}
