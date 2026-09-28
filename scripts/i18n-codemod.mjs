#!/usr/bin/env node
/**
 * i18n codemod —— 把界面里的中文包进 t("...")，规则固定、可复跑、可检查。
 *
 *   node scripts/i18n-codemod.mjs                  # dry-run：只统计，不写文件
 *   node scripts/i18n-codemod.mjs --write          # 真正写文件
 *   node scripts/i18n-codemod.mjs --keys keys.json # 导出新增的中文键
 *   node scripts/i18n-codemod.mjs --check          # CI 用：还有裸中文就 exit 1
 *
 * 规则（全部用 TypeScript AST 判定，不做正则猜测）：
 *   ✅ 包：JSX 文本节点里的中文；白名单属性(placeholder/title/aria-label/alt/label)的字符串值
 *   ❌ 不碰：value/id/key/name/type/role/htmlFor/href/src/className/style/defaultValue/data-*
 *   ❌ 不碰：非字面量的表达式、没有 "use client" 的文件、模块作用域的 JSX、含换行的文本节点
 *   ✅ t 必须在**词法作用域**内拿到（逐层函数作用域检查直接声明的 { t } = useLanguage()），
 *      拿不到就说明该组件没接 i18n → 自动补 import + 在组件首行插 hook；不是客户端文件则跳过并上报。
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');
const KEYS_OUT = (() => { const i = process.argv.indexOf('--keys'); return i > -1 ? process.argv[i + 1] : null; })();
const REPO = (() => { const i = process.argv.indexOf('--json'); return i > -1 ? process.argv[i + 1] : null; })();

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3000-\u303f\uff01-\uff5e]/;
// 豁免名单：已知不能自动包的文件（服务端组件 / 类组件 —— 用不了 hook，需另行重构）
const ALLOW = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'scripts/i18n-allowlist.json'), 'utf8'));
    return Array.isArray(j.paths) ? j.paths : [];
  } catch { return []; }
})();
const SAFE_ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt', 'label',
  'description', 'subtitle', 'emptyText', 'tooltip', 'helpText', 'confirmText', 'cancelText', 'header']);
// 枚举类字段：这些字段的「值」在显示层走 t()（中文模式原样返回中文，英文模式查直译表）
// 只在 JSX 子节点位置、且是**纯属性访问**时才包 —— value=/key=/比较/模板串一律不匹配
const ENUM_FIELDS = new Set(['subject', 'grade']);
const BLOCK_ATTRS = new Set(['value', 'id', 'key', 'name', 'type', 'role', 'htmlFor', 'href', 'src',
  'defaultValue', 'className', 'style', 'accept', 'target', 'rel', 'method', 'action', 'data-testid', 'data-state']);

function collect(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name) && !p.includes(`${path.sep}app${path.sep}api${path.sep}`)) out.push(p);
  }
  return out;
}
const files = ['app', 'components'].flatMap(d => (fs.existsSync(path.resolve(ROOT, d)) ? collect(path.resolve(ROOT, d)) : [])).sort();

const isFn = n => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) ||
  ts.isMethodDeclaration(n) || ts.isFunctionLike?.(n);

const res = { filesScanned: 0, filesTouched: 0, edits: 0, keys: new Set(), hooks: 0, imports: 0,
  skipped: { moduleScope: [], newline: [], nonClient: new Set(), noComponent: [] }, touched: [] };

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  res.filesScanned++;
  if (!CJK.test(src)) continue;
  const rel = path.relative(ROOT, file);
  if (ALLOW.some(p => rel.startsWith(p))) continue;   // 豁免名单直接跳过
  const line = pos => src.slice(0, pos).split('\n').length;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);

  let isClient = false;
  const first = sf.statements[0];
  if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) &&
      first.expression.text === 'use client') isClient = true;

  // 该节点词法作用域内能否拿到 t？(逐层函数作用域，只认**直接**声明)
  const tInScope = node => {
    for (let n = node.parent; n; n = n.parent) {
      if (!isFn(n) || !n.body || !ts.isBlock(n.body)) continue;
      for (const st of n.body.statements) {
        if (!ts.isVariableStatement(st)) continue;
        for (const d of st.declarationList.declarations) {
          if (ts.isObjectBindingPattern(d.name) && d.initializer && ts.isCallExpression(d.initializer) &&
              d.initializer.expression.getText(sf) === 'useLanguage' &&
              d.name.elements.some(el => el.name.getText(sf) === 't')) return true;
        }
      }
    }
    return false;
  };
  // 最近的组件（首字母大写的函数/箭头函数）—— 用它来插 hook
  const nearestComponent = node => {
    for (let n = node.parent; n; n = n.parent) {
      if (ts.isFunctionDeclaration(n) && n.name && /^[A-Z]/.test(n.name.text) && n.body) return n;
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && /^[A-Z]/.test(n.name.text) &&
          n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)) &&
          n.initializer.body) return n.initializer;
    }
    return null;
  };

  const edits = [];
  const needHook = new Set();

  const handle = (node, key, editStart, editEnd, replacement) => {
    if (!isClient) { res.skipped.nonClient.add(rel); return; }
    if (tInScope(node)) { res.keys.add(key); edits.push({ start: editStart, end: editEnd, text: replacement }); return; }
    const comp = nearestComponent(node);
    if (!comp || !comp.body || !ts.isBlock(comp.body)) { res.skipped.noComponent.push(`${rel}:${line(editStart)}`); return; }
    res.keys.add(key);
    needHook.add(comp);
    edits.push({ start: editStart, end: editEnd, text: replacement });
  };

  (function visit(node) {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sf);
      const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
      const mid = raw.slice(lead.length, raw.length - trail.length);
      if (CJK.test(mid)) {
        if (mid.includes('\n')) res.skipped.newline.push(`${rel}:${line(node.getStart(sf))}`);
        else handle(node, mid, node.getStart(sf), node.getEnd(), `${lead}{t(${JSON.stringify(mid)})}${trail}`);
      }
    } else if (ts.isJsxAttribute(node)) {
      const an = node.name.getText(sf);
      if (SAFE_ATTRS.has(an) && !BLOCK_ATTRS.has(an) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const raw = node.initializer.getText(sf);              // 连引号一起取，保留 &apos; 原样
        const inner = raw.slice(1, -1);
        if (CJK.test(inner)) handle(node, inner, node.initializer.getStart(sf), node.initializer.getEnd(), `{t(${JSON.stringify(inner)})}`);
      }
    } else if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      // 枚举类字段的「显示层映射」：{course.subject} / {student.grade} → {t(course.subject)}
      // 只在 JSX 子节点位置；必须是纯属性访问 a.b（不含 ?. / 调用 / 比较 / 模板串）
      const e = node.expression;
      if (ts.isPropertyAccessExpression(e) && ENUM_FIELDS.has(e.name.text)) {
        if (!isClient) { res.skipped.nonClient.add(rel); }
        else if (tInScope(node)) {
          edits.push({ start: e.getStart(sf), end: e.getEnd(), text: `t(${e.getText(sf)})` });
        } else {
          const comp = nearestComponent(node);
          if (comp && comp.body && ts.isBlock(comp.body)) {
            needHook.add(comp);
            edits.push({ start: e.getStart(sf), end: e.getEnd(), text: `t(${e.getText(sf)})` });
          } else res.skipped.noComponent.push(`${rel}:${line(e.getStart(sf))}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  })(sf);

  if (!edits.length) continue;
  res.filesTouched++; res.edits += edits.length; res.touched.push(rel);
  if (!WRITE) continue;   // ⚠️ check 模式只统计，绝不写文件

  const hasImport = src.includes('useLanguage');
  if (!hasImport) {
    const imports = sf.statements.filter(ts.isImportDeclaration);
    const pos = imports.length ? imports[imports.length - 1].getEnd()
      : (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) ? first.getEnd() : 0);
    edits.push({ start: pos, end: pos, text: `\nimport { useLanguage } from "@/contexts/language-context";` });
    res.imports++;
  }
  for (const c of needHook) {
    edits.push({ start: c.body.getStart(sf) + 1, end: c.body.getStart(sf) + 1, text: `\n  const { t } = useLanguage();` });
    res.hooks++;
  }
  const out = edits.slice().sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce((s, e) => s.slice(0, e.start) + e.text + s.slice(e.end), src);
  fs.writeFileSync(file, out, 'utf8');
}

const summary = {
  filesScanned: res.filesScanned, filesTouched: res.filesTouched, edits: res.edits,
  uniqueKeys: res.keys.size, hooksInserted: res.hooks, importsInserted: res.imports,
  skipped: { newline: res.skipped.newline.length, nonClientFiles: res.skipped.nonClient.size, noComponent: res.skipped.noComponent.length },
  nonClientFiles: [...res.skipped.nonClient].sort(),
  noComponent: res.skipped.noComponent.slice(0, 20),
  touchedFiles: res.touched.sort(),
};
if (REPO) fs.writeFileSync(REPO, JSON.stringify(summary, null, 1), 'utf8');
if (KEYS_OUT) fs.writeFileSync(KEYS_OUT, JSON.stringify([...res.keys].sort(), null, 1), 'utf8');
console.log(JSON.stringify({ ...summary, touchedFiles: `(${summary.touchedFiles.length} 个，见 --json)` }, null, 1));
if (CHECK && (res.edits > 0 || res.skipped.noComponent.length)) {
  console.error(`\n❌ i18n check 失败：还有 ${res.edits} 处裸中文未包 t()`);
  console.error(`   涉及文件（前 20）：`);
  for (const f of res.touched.slice(0, 20)) console.error(`     ${f}`);
  if (res.skipped.noComponent.length) {
    console.error(`   另有 ${res.skipped.noComponent.length} 处找不到所属组件：`);
    for (const s of res.skipped.noComponent.slice(0, 10)) console.error(`     ${s}`);
  }
  console.error(`\n   修法：node scripts/i18n-codemod.mjs --write   （已知不能改的写进 scripts/i18n-allowlist.json）`);
  process.exit(1);
}
if (CHECK && res.skipped.newline.length) {
  console.error(`⚠️  警告（不拦）：${res.skipped.newline.length} 处含换行的文本节点未包（会改变渲染空白，需人工）`);
}
