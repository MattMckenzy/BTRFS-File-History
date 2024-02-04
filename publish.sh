#!/bin/bash
CURRENT_VERS=$(cat package.json | jq '.version' -r)
echo "The Current version is $CURRENT_VERS, enter new version."
read -p "Version: " -i $CURRENT_VERS -e CHOSEN_VERS
CHOSEN_VERS=${CHOSEN_VERS:-$CURRENT_VERS}
echo "Will publish as version: $CHOSEN_VERS"
jaq -i '.version="'$CHOSEN_VERS'"' package.json

echo "Please enter a changelog and commit message. An empty message will only change version number and not add a changelog entry."
read -p "Message: " MESSAGE

if [[ -z "$MESSAGE" ]]; then
   echo "Empty message, will update in place."
   sed -i 's|## '$CURRENT_VERS'|## '$CHOSEN_VERS'|' CHANGELOG.md
   sed -i 's|### '$CURRENT_VERS'|### '$CHOSEN_VERS'|' README.md
   COMMIT_MESSAGE="Bumped to version ${CHOSEN_VERS}"
else
   echo "Message, will add changelog entry."
   set -o noglob
   set +o histexpand
   sed -i ''$(grep -Fn '## '$CURRENT_VERS'' CHANGELOG.md | cut -d ":" -f 1)'i## '$CHOSEN_VERS'\n\n- '"$MESSAGE"'\n' CHANGELOG.md
   sed -i ''$(grep -Fn '### '$CURRENT_VERS'' README.md | cut -d ":" -f 1)'i### '$CHOSEN_VERS'\n\n- '"$MESSAGE"'\n' README.md
   set +o noglob
   set -o histexpand
   COMMIT_MESSAGE="$MESSAGE; bumped to version ${CHOSEN_VERS}"
fi

mkdir -p packages
vsce package --out packages/

git add .
git commit -m "$COMMIT_MESSAGE"
git push
git tag v$CHOSEN_VERS HEAD
git push --tags

set -o noglob
set +o histexpand
gh release create -t "Release v$CHOSEN_VERS" -n "$MESSAGE" v$CHOSEN_VERS ./packages/btrfs-file-history-$CHOSEN_VERS.vsix
set +o noglob
set -o histexpand

vsce publish
npx ovsx publish ./packages/btrfs-file-history-$CHOSEN_VERS.vsix -p $(cat ~/.tokens/ovsx)