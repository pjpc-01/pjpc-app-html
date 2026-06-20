#!/bin/bash
# Setup script for new machine clone
# Run after: git clone && cd project && npm install
set -e

echo "🔧 Setting up PJPC ERP..."

# 1. Create pre-commit hook symlink
echo "📎 Installing git pre-commit hook..."
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 3. Check PB binary
if [ ! -f "./pocketbase" ]; then
  echo "⚠️  PocketBase binary not found!"
  echo "   Download from: https://pocketbase.io/docs/"
  echo "   Place ./pocketbase in project root"
  echo ""
  echo "   Quick download:"
  echo "   wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip"
  echo "   unzip -o pocketbase_linux_amd64.zip && rm pocketbase_linux_amd64.zip"
  echo "   chmod +x pocketbase"
fi

# 4. Done
echo ""
echo "✅  Setup complete!"
echo ""
echo "   First time? You need the PB data file too:"
echo "   - Option A: Copy pb_data/ from old computer"
echo "   - Option B: Import pb-schema.json via PB Admin UI"
echo "     (start PB: npm run pb:start -> http://127.0.0.1:8090/_/ -> Settings -> Import collections)"
echo ""
echo "   Commands:"
echo "   npm run pb:start     # Start PocketBase"
echo "   npm run dev          # Start Next.js dev server"
echo "   npm run export-pb-schema  # Manually export PB schema to JSON"
