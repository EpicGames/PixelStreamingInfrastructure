#!/usr/bin/env bash
# Remove changeset files from master.
#
# Changesets are authored on master, but master never runs `changeset version`
# (only the UE* release branches do). The introducing PR's commit -- which
# contains the changeset -- is permanent in master's history, and the backport
# action (sorenlouv/backport-github-action) cherry-picks THAT commit onto each
# release branch, where the changeset is consumed. So master's working-tree
# copy is functionless the moment the PR merges and can be deleted; release
# branches still receive it via cherry-pick from history, regardless of
# master's current tree -- even for backports labelled days later.
#
# This deliberately does NOT inspect release-branch state: downstream delivery
# does not depend on the file's presence on master, so there is nothing to wait
# for. The introducing PR must of course CONTAIN the changeset (that is what
# lands it in history); this cleanup is always a separate follow-up and must
# never carry an auto-backport label.
#
# Environment:
#   PRUNE_BODY_PATH   If set, a markdown PR body is written here.
#   GITHUB_OUTPUT     If set, "removed_count=N" is appended (GitHub Actions).
#
# Assumes: run from the repo root on a checkout of master.
set -euo pipefail

body_path="${PRUNE_BODY_PATH:-}"
if [[ -n "$body_path" ]]; then
    {
        echo "Automated cleanup. master never consumes changesets; release branches receive them via cherry-pick of the introducing commit, so these working-tree copies are redundant and safe to remove."
        echo
        echo "## Removed changesets"
    } > "$body_path"
fi

removed=0
shopt -s nullglob
for f in .changeset/*.md; do
    base="$(basename "$f")"
    [[ "$base" == "README.md" ]] && continue
    echo "  remove  $base"
    git rm -q "$f"
    [[ -n "$body_path" ]] && echo "- \`$base\`" >> "$body_path"
    removed=$(( removed + 1 ))
done

echo "Removed ${removed} changeset(s)."
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "removed_count=${removed}" >> "$GITHUB_OUTPUT"
fi
