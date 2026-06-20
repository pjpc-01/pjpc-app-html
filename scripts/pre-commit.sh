#!/bin/bash
# Pre-commit hook template — copies to .git/hooks/ by setup-new-machine.sh
echo "🔍 Pre-commit: exporting PB schema..."
cd "$(git rev-parse --show-toplevel)" || exit 1
python3 scripts/export-pb-schema.py 2>/dev/null || true
git add pb-schema.json 2>/dev/null || true
