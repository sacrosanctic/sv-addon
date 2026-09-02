# todo

create an addon for .editorconfig
create a monorepo
figure out how to publish

## problem with the ast

lacking an upsert function

# patterns

## common happy path to account for

kit vs non kit
js/jsdocs/ts

## insert patterns

overwrite, just ignore what was there before, aka forced insert
upsert, intergrate existing values

## ???

transforms.text
// todo: document pattern: overwrite ignore previous file, good for files thats unlikely to have a naming collision, or when the component is too complex to transform via a codemod(term?) and best to let the user manually resolve the git conflict/diff

transform.script
transform.sveltescript
transform.svelte
for modifying existing files, especially reserved files like +layout.svelte ...

## always use dedent

# search

https://npmx.dev/search?q=keyword:sv-add

# reference projects

https://github.com/flo-bit/svelte-atproto-sv
https://github.com/mswjs/sveltekit

# starter template/boilerplate/scaffolding

https://github.com/lelabdev/svelteforge#readme

# bug

it just dawned on me to run that script again and i can reproduce it
--template addon always creates a js project, but
--types ts produces a tsconfig.json

# test

```sh
rm ../asdf -rf
pn build
pnx sv@0.16.3 create --template demo --types ts --add prettier eslint paraglide="languageTags:en, es+demo:yes" --install pnpm ../asdf --no-dir-check --no-install
cd ../asdf
git add .
pnx sv@0.16.3 add file:../svelte-meta-tags --no-git-check --no-download-check --install pnpm
pn prepare
cd ../svelte-meta-tags
```

# ast

https://svelte.dev/playground/hello-world?version=5.56.7#H4sIAAAAAAAAA42TwW7bMAyGX4XQxQngpdiORlOgQ4v1sA3DlqGHugfFomNhMiVIVJ0g87sPiu3EHTpgJ0I_f4mfSOkoSLYoCvGAxljorDcKFqg0o1qKXNTaYBDF01HwwSVfEkQ-7bp1bhVe0HDStjLgW3pliZE4iEJch8prxzcllYx7Zz1DHalibQmMlerDYgnHlCz5fQp9SaOtshT45IE1LI4QvYF-CeubwT-kWbNBWEP2o7LM8BjhNzziFu7wBY116LOLV-HAkkqvh5LZxksKtfUtHGz0oBXKAJrYwhZlZF1Hk0Ojd807hz75JFUISu80SwO4d-g1UoUBOs3NIDB0uAU1ELRIPGP4hYfOehVgDU8jwkSe5aMw4z_tnvSHhPFthpGMt84ZXcl0qXB23o189xe-IfdcUgoeOXoChbUm_CgDfkGWG7kLi3EUp7aOp83aNirTJcaldUifvHRNMU2y5PR2Csg63AbNOIGVHL0pgLCDn98_L6I3Kye5SU8oT_NdWa93mparxmN93jOHeQun5FTjq2xTxb-72Y-RO82MfoZYSa82A2aIbSv9IfvvksOp_bKk_tRRur46v3ORC8Y9i4J9xD7_xz-SQdUrDq8_0UWc_aDX5z3ngqU2nSYlilqagP0fbTWwGtIDAAA

## best practice

think in `sv add` mindset
