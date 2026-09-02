This repo is a collection of [community add-ons](https://svelte.dev/docs/cli/community) for Svelte. They can be found on [npmx](https://npmx.dev/search?q=keyword:sv-add).

# Why this repo exists

The official Svelte CLI ships official add-ons but is strict about what qualifies — it [recommends](https://github.com/sveltejs/cli#contributing) that most add-ons be community ones.

That leaves add-on maintenance to the associated library maintainers, who often lack the bandwidth, prior knowledge of the add-on API, or know-how around AST usage. This repo attempts fills that gap.

# Best practices

Design for these permutations for best coverage:

- kit vs non-kit
- ts vs jsdocs vs js

Design for every `sv add` scenario:

- fresh project (conflict with base)
- existing project (conflict with other libs)
- rerun of the add-on (conflict with self)
- older version of the add-on (migration)

Keep short source code inline, long ones in separate files.
If there are no conflicts, use `template-sync` for bulk syncing.

## Resolving conflicts

### Overwrite

Replace whatever was there before. Good for files unlikely to have a naming collision, or components too complex to safely transform. Best to let the user manually resolve the git conflict.

### Upsert

Integrate with existing values instead of replacing them. Requires the use of AST.

# Development

https://svelte.dev/playground has an AST browser.

Test locally:

```sh
pnx sv add file:~/<path-to-repo>/packages/{name}
```
