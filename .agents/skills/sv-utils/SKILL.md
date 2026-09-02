---
name: sv-utils
description: Reference for @sveltejs/sv-utils js utilities — AST manipulation helpers for imports, variables, exports, functions, objects, arrays, SvelteKit helpers, and Vite config helpers. Use when writing or editing transforms that operate on ESTree AST nodes via the `js` object.
---

# js Utilities from @sveltejs/sv-utils

All methods operate on [ESTree](https://github.com/estree/estree) AST nodes.
Accessed via the `js` object provided by `transforms.script()` or `transforms.svelteScript()` callbacks.

```js
import { transforms } from '@sveltejs/sv-utils'

transforms.script(({ ast, js, comments }) => {
	// use js.* here
})
```

---

## `js.imports` — Import declarations

### `addDefault(ast, { from, as })`

Adds `import <as> from '<from>'`.

```js
js.imports.addDefault(ast, { from: './utils', as: 'utils' })
// → import utils from './utils'
```

### `addNamed(ast, { imports, from, isType? })`

Adds named imports. `imports` can be an array or a map.

```js
// Array form
js.imports.addNamed(ast, { imports: ['foo', 'bar'], from: './lib' })
// → import { foo, bar } from './lib'

// Map form (key = import name, value = alias)
js.imports.addNamed(ast, { imports: { foo: 'myFoo' }, from: './lib' })
// → import { foo as myFoo } from './lib'

// Type import
js.imports.addNamed(ast, { imports: ['Props'], from: './types', isType: true })
// → import type { Props } from './types'
```

### `addNamespace(ast, { from, as })`

Adds `import * as <as> from '<from>'`.

```js
js.imports.addNamespace(ast, { from: './all', as: 'all' })
// → import * as all from './all'
```

### `addEmpty(ast, { from })`

Adds `import '<from>'` (side-effect import).

```js
js.imports.addEmpty(ast, { from: './polyfill' })
// → import './polyfill'
```

### `find(ast, { name, from })`

Finds an existing import, returns `{ statement, alias }` or `{ statement: undefined, alias: undefined }`.

```js
const result = js.imports.find(ast, { name: 'foo', from: './lib' })
if (result.statement) {
	console.log('already imported as', result.alias)
}
```

### `remove(ast, { name, from, statement? })`

Removes an import declaration.

```js
js.imports.remove(ast, { name: 'foo', from: './lib' })
```

---

## `js.common` — General AST helpers

### `parseFromString(code)`

Parses a code string into an AST node. Use this to inject arbitrary code.

```js
const node = js.common.parseFromString('const x = 1')
// returns an estree Node (typically a VariableDeclaration)
```

### `appendFromString(node, { code, comments? })`

Appends parsed code into a `Program` or `BlockStatement` body.

```js
js.common.appendFromString(ast, { code: 'console.log("hello")' })
```

### `parseExpression(code)`

Parses a string into an `estree.Expression`.

```js
const expr = js.common.parseExpression('new URL(pathname, origin)')
```

### `parseStatement(code)`

Parses a string into an `estree.Statement`.

```js
const stmt = js.common.parseStatement('if (x) { return y }')
```

### `appendStatement(node, { statement })`

Appends a statement to a `Program` or `BlockStatement`, but only if it doesn't already exist (dedup).

```js
const stmt = js.common.parseStatement('const x = 1')
js.common.appendStatement(ast, { statement: stmt })
```

### `contains(node, targetNode)`

Returns `true` if `targetNode` exists in the AST under `node`.

```js
if (js.common.contains(ast, someNode)) {
	// already present
}
```

### `createLiteral(value)`

Creates a literal node (`string | number | boolean | null`).

```js
const lit = js.common.createLiteral('hello')
```

### `createBlockStatement()`

Creates an empty block statement `{ }`.

```js
const block = js.common.createBlockStatement()
```

### `createExpressionStatement({ expression })`

Wraps an expression in an expression statement.

```js
const exprStmt = js.common.createExpressionStatement({
	expression: js.common.parseExpression('console.log("hi")'),
})
```

### `createSpread(argument)`

Creates a spread element `...argument`.

```js
const spread = js.common.createSpread(js.common.parseExpression('arr'))
```

### `createSatisfies(node, { type })`

Creates a `satisfies` expression: `expression satisfies Type`.

```js
const satisfies = js.common.createSatisfies(someExpr, { type: 'Config' })
```

### `typeAnnotate(node, { type })`

Creates a `as` expression: `expression as Type`.

```js
const typed = js.common.typeAnnotate(someExpr, { type: 'MetaTagsProps' })
```

### `addJsDocComment(node, comments, { params })`

Adds JSDoc `@param` comments to a node.

```js
js.common.addJsDocComment(funcNode, comments, {
	params: { url: 'The current URL' },
})
```

### `addJsDocTypeComment(node, comments, { type })`

Adds a `@type` JSDoc comment to a node.

```js
js.common.addJsDocTypeComment(decl, comments, {
	type: "import('./$types').LayoutLoad",
})
```

### `areNodesEqual(nodeA, nodeB)`

Deep comparison of two AST nodes.

```js
if (js.common.areNodesEqual(nodeA, nodeB)) {
	/* same structure */
}
```

### `hasTypeProperty(node, { name })`

Checks if a `TSInterfaceDeclaration` body contains a property with the given name.

```js
const has = js.common.hasTypeProperty(interfaceBody.body[0], { name: 'baseMetaTags' })
```

### `createTypeProperty(name, value, optional?)`

Creates a `TSPropertySignature` for use inside a `TSInterfaceBody`.

```js
const prop = js.common.createTypeProperty('baseMetaTags', 'MetaTagsProps', true)
// → baseMetaTags?: MetaTagsProps
```

---

## `js.variables` — Variable declarations

### `declaration(node, { kind, name, value })`

Creates a `VariableDeclaration` (`const`/`let`/`var`).

```js
const decl = js.variables.declaration(ast, {
	kind: 'const',
	name: 'config',
	value: js.common.parseExpression('{ foo: "bar" }'),
})
```

### `createIdentifier(name)`

Creates an `Identifier` node.

```js
const id = js.variables.createIdentifier('myVar')
```

### `typeAnnotateDeclarator(node, { typeName })`

Adds a type annotation to a `VariableDeclarator`.

```js
const typed = js.variables.typeAnnotateDeclarator(declarator, { typeName: 'Config' })
```

---

## `js.exports` — Export declarations

### `createNamed(ast, { name, fallback })`

Creates `export const <name> = ...`. The function is **idempotent**: it first checks if an export with that name already exists — matching `export const`, `export function`, `export class`, or any other named export form. If found, the existing export is returned and the `fallback` is ignored. The `fallback` (a `VariableDeclaration`) is only used when no existing export is found.

```js
const decl = js.variables.declaration(ast, { kind: 'const', name: 'load', value: fnExpr })
js.exports.createNamed(ast, { name: 'load', fallback: decl })
// → export const load = ...
```

### `createDefault(ast, { fallback })`

Creates `export default <fallback>`. Also **idempotent** — if a default export already exists, it's returned with `isFallback: false`. Returns `{ astNode, value, isFallback }`.

```js
const result = js.exports.createDefault(ast, { fallback: someExpr })
// result.isFallback === true  → your value was used
// result.isFallback === false → an existing default export was kept
```

### `addNamespace(ast, { from, as? })`

Creates `export * from '<from>'` or `export * as <as> from '<from>'`.

```js
js.exports.addNamespace(ast, { from: './lib' })
// → export * from './lib'
```

---

## `js.functions` — Function helpers

### `createCall({ name, args, useIdentifiers? })`

Creates a call expression.

```js
const call = js.functions.createCall({ name: 'defineConfig', args: ['"svelte"'] })
// → defineConfig("svelte")

// With identifiers (args are treated as variable names, not strings)
const call2 = js.functions.createCall({
	name: 'require',
	args: ['module'],
	useIdentifiers: true,
})
// → require(module)
```

### `createArrow({ body, async })`

Creates an arrow function `() => body` or `async () => body`.

```js
const arrow = js.functions.createArrow({
	body: js.common.parseExpression('1 + 2'),
	async: false,
})
// → () => 1 + 2

const asyncArrow = js.functions.createArrow({
	body: js.common.createBlockStatement(),
	async: true,
})
// → async () => { }
```

### `getArgument(node, { index, fallback })`

Gets the argument at `index` from a `CallExpression`, returning `fallback` if the argument doesn't exist. Here `fallback` is simply a default value (not the idempotent pattern used in exports).

```js
const firstArg = js.functions.getArgument(callExpr, {
	index: 0,
	fallback: js.common.createLiteral('default'),
})
```

---

## `js.object` — Object expressions

### `create(properties)`

Creates an `ObjectExpression` from a plain map.

```js
const obj = js.object.create({ name: '"hello"', count: '42' })
// → { name: "hello", count: 42 }
```

### `property(node, { name, fallback })`

Gets a property value from an `ObjectExpression`, returning `fallback` if missing. Here `fallback` is simply a default value.

```js
const val = js.object.property(objExpr, {
	name: 'plugins',
	fallback: js.common.parseExpression('[]'),
})
```

### `propertyNode(node, { name, fallback })`

Same as `property` but returns the full `Property` AST node. `fallback` is a default value.

```js
const propNode = js.object.propertyNode(objExpr, {
	name: 'plugins',
	fallback: js.common.parseExpression('[]'),
})
```

### `overrideProperties(objectExpression, properties)`

Sets/overrides properties on an existing `ObjectExpression`.

```js
js.object.overrideProperties(configObj, {
	plugins: '[]',
	server: '{ port: 3000 }',
})
```

---

## `js.array` — Array expressions

### `create()`

Creates an empty `ArrayExpression`.

```js
const arr = js.array.create()
```

### `append(node, element)`

Appends an element to an `ArrayExpression`.

```js
js.array.append(arr, 'pluginA()') // string or expression
js.array.append(arr, js.common.parseExpression('pluginB()'))
```

### `prepend(node, element)`

Prepends an element to an `ArrayExpression`.

```js
js.array.prepend(arr, 'firstPlugin()')
```

---

## `js.kit` — SvelteKit-specific

### `addGlobalAppInterface(ast, { name })`

Finds or creates a global app interface (`PageData`, `Locals`, `Error`, `PageState`, `Platform`) in `app.d.ts`.

```js
const iface = js.kit.addGlobalAppInterface(ast, { name: 'PageData' })
// Returns the TSInterfaceDeclaration node, or null if detection failed
```

### `addHooksHandle(ast, { language, newHandleName, handleContent, comments })`

Adds a handle function to `hooks.server.ts` (or `.js`).

```js
js.kit.addHooksHandle(ast, {
	language: 'ts',
	newHandleName: 'myHandle',
	handleContent: 'event.platform = { ... }',
	comments,
})
```

---

## `js.vite` — Vite config helpers

### `addPlugin(ast, { code, mode? })`

Adds a plugin call to the Vite config's `plugins` array.

```js
js.vite.addPlugin(ast, { code: 'kitRoutes()' })
js.vite.addPlugin(ast, { code: 'tailwindcss()', mode: 'prepend' })
```

### `getConfig(ast)`

Gets the root config object expression from a `vite.config.*` or `svelte.config.*`.

```js
const config = js.vite.getConfig(ast)
```

### `configProperty(ast, config, { name, fallback })`

Gets a property from the config, resolving shorthand references. `fallback` is a default value if the property doesn't exist.

```js
const val = js.vite.configProperty(ast, config, {
	name: 'plugins',
	fallback: js.common.parseExpression('[]'),
})
```
