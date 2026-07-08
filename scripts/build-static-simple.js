/**
 * Static export build for GitHub Pages.
 * 
 * Strategy:
 * 1. Move app/api/ out of app tree (skip API routes)
 * 2. Patch app/layout.tsx to remove force-dynamic (incompatible with static export)
 * 3. Build with output:export
 * 4. Restore everything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_SRC = path.join(ROOT, 'app', 'api');
const API_TMP = '/tmp/pjpc-api-build';
const LAYOUT_PATH = path.join(ROOT, 'app', 'layout.tsx');
const OUT_DIR = path.join(ROOT, 'out');

console.log('🔨 Static export for GitHub Pages...\n');

// Step 0: ensure clean start
if (!fs.existsSync(API_SRC)) {
  console.log('⚠️  app/api/ missing, restoring from git...');
  execSync('git checkout -- app/api/', { cwd: ROOT, stdio: 'pipe' });
}
// Nuke stale api.bak and caches
['app/api.bak', '.next', 'out'].forEach(d => {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true }); }
});
if (fs.existsSync(API_TMP)) fs.rmSync(API_TMP, { recursive: true });

// Step 1: Hide API routes
console.log('📦 Hiding app/api/...');
fs.renameSync(API_SRC, API_TMP);

// Step 2: Patch layout.tsx — remove force-dynamic
let layoutBackup = '';
if (fs.existsSync(LAYOUT_PATH)) {
  layoutBackup = fs.readFileSync(LAYOUT_PATH, 'utf8');
  const patched = layoutBackup.replace(
    /export const dynamic = ['"]force-dynamic['"];?\s*/g,
    '// [static-build] force-dynamic removed for static export\n'
  );
  if (patched !== layoutBackup) {
    fs.writeFileSync(LAYOUT_PATH, patched);
    console.log('📝 Patched layout.tsx (removed force-dynamic)');
  }
}

try {
  // Step 3: Build
  console.log('🏗️  Running next build...\n');
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: ROOT,
    timeout: 300_000,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      STATIC_EXPORT: 'true',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });

  // Step 4: Report
  if (fs.existsSync(OUT_DIR)) {
    const size = getDirSize(OUT_DIR);
    console.log(`\n✅ Done → /out (${formatSize(size)})`);
    const files = listFiles(OUT_DIR).sort((a, b) => b.size - a.size).slice(0, 8);
    console.log('📊 Top files:');
    files.forEach(f => console.log(`   ${formatSize(f.size).padEnd(8)} ${f.path}`));
  }
} catch (err) {
  console.error('\n❌', err.message?.slice(0, 300));
  process.exit(1);
} finally {
  // Step 5: Restore
  if (fs.existsSync(API_TMP)) {
    fs.renameSync(API_TMP, API_SRC);
    console.log('📦 Restored app/api/');
  }
  if (layoutBackup) {
    fs.writeFileSync(LAYOUT_PATH, layoutBackup);
    console.log('📝 Restored layout.tsx');
  }
}

function getDirSize(dir) {
  let s = 0;
  try { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    s += e.isDirectory() ? getDirSize(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size;
  } } catch {}
  return s;
}
function listFiles(dir, base = '') {
  const r = [];
  try { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) r.push(...listFiles(path.join(dir, e.name), p));
    else r.push({ path: p, size: fs.statSync(path.join(dir, e.name)).size });
  } } catch {}
  return r;
}
function formatSize(b) {
  if (b >= 1e6) return `${(b/1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b/1e3).toFixed(0)} KB`;
  return `${b} B`;
}
