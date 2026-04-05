#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skills_root="$repo_root/skills/public"
readme="$repo_root/README.md"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

check_frontmatter() {
  local skill_file="$1"
  local frontmatter

  [[ -f "$skill_file" ]] || fail "Missing skill file: $skill_file"
  [[ "$(head -n 1 "$skill_file")" == "---" ]] || fail "Skill missing opening frontmatter marker: $skill_file"

  frontmatter="$(awk '
    NR == 1 && $0 == "---" { in_block = 1; next }
    in_block && $0 == "---" { exit }
    in_block { print }
  ' "$skill_file")"

  [[ -n "$frontmatter" ]] || fail "Skill has empty frontmatter: $skill_file"
  grep -Eq '^name:[[:space:]]*.+$' <<<"$frontmatter" || fail "Skill missing name in frontmatter: $skill_file"
  grep -Eq '^description:[[:space:]]*.+$' <<<"$frontmatter" || fail "Skill missing description in frontmatter: $skill_file"
}

check_local_links_in_file() {
  local source_file="$1"
  local source_dir
  local raw_link
  local target

  source_dir="$(cd "$(dirname "$source_file")" && pwd)"

  while IFS= read -r raw_link; do
    target="${raw_link%%#*}"

    [[ -z "$target" ]] && continue
    [[ "$target" =~ ^https?:// ]] && continue
    [[ "$target" =~ ^mailto: ]] && continue
    [[ "$target" =~ ^plugin:// ]] && continue
    [[ "$target" =~ ^app:// ]] && continue

    if [[ ! -e "$source_dir/$target" ]]; then
      fail "Broken local link in $source_file: $raw_link"
    fi
  done < <(
    grep -oE '\[[^]]+\]\([^)]+\)' "$source_file" | sed -E 's/.*\(([^)]+)\)/\1/'
  )
}

extract_readme_skill_index() {
  awk '
    /<!-- SKILL_INDEX_START -->/ { in_block = 1; next }
    /<!-- SKILL_INDEX_END -->/ { in_block = 0 }
    in_block && $0 ~ /- \[`[^`]+`\]\([^)]+\)/ {
      line = $0
      sub(/.*\[`/, "", line)
      sub(/`\].*/, "", line)
      print line
    }
  ' "$readme" | sort
}

collect_skill_dirs() {
  find "$skills_root" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/SKILL.md' ';' -print | xargs -n1 basename | sort
}

main() {
  local skill_dir
  local skill_file
  local actual_skills
  local readme_skills
  local markdown_file

  [[ -f "$readme" ]] || fail "Missing README.md"
  [[ -d "$skills_root" ]] || fail "Missing skills/public directory"

  while IFS= read -r skill_dir; do
    [[ -n "$skill_dir" ]] || continue
    skill_file="$skills_root/$skill_dir/SKILL.md"
    check_frontmatter "$skill_file"
  done < <(collect_skill_dirs)

  while IFS= read -r markdown_file; do
    check_local_links_in_file "$markdown_file"
  done < <(
    find "$repo_root" \
      \( -path "$repo_root/.git" -o -path "$repo_root/.worktrees" -o -path "$repo_root/worktrees" \) -prune -o \
      -type f \( -name '*.md' -o -name 'SKILL.md' \) -print
  )

  actual_skills="$(collect_skill_dirs)"
  readme_skills="$(extract_readme_skill_index)"

  [[ -n "$readme_skills" ]] || fail "README skill index is empty or missing markers"

  if [[ "$actual_skills" != "$readme_skills" ]]; then
    echo "Expected skill index:" >&2
    echo "$actual_skills" >&2
    echo "README skill index:" >&2
    echo "$readme_skills" >&2
    fail "README skill index does not match skills/public catalog"
  fi

  echo "Skill catalog validation passed."
}

main "$@"
