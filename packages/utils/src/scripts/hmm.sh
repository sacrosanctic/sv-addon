#!/usr/bin/env bash
tmp=$(mktemp -d /tmp/opencode/editable-diff-XXXX)
proj="$tmp/project"

pnx sv@next create "$proj" --types ts --template minimal --no-add-ons --install pnpm
git -C "$proj" init -q && git -C "$proj" add -A && git -C "$proj" commit -qm init
pnx degit "michael/editable#stable" "$proj"
git -C "$proj" add -A && git -C "$proj" diff --cached --stat
git -C "$proj" diff --cached
echo "kept: $proj"
