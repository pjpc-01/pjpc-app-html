#!/usr/bin/env node
/**
 * 把 md 转成可打印 A4 PDF（marked + Playwright Chromium）。
 *
 * 用法：
 *   node scripts/md-to-pdf.mjs <输入.md> <输出.pdf> [--title "标题"] [--accent "#c2410c"] [--preview 预览.png]
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { pathToFileURL } from 'url'
import { marked } from 'marked'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const src = args[0]
const out = args[1]
if (!src || !out) {
  console.error('用法: node scripts/md-to-pdf.mjs <in.md> <out.pdf> [--title ..] [--accent ..] [--preview ..]')
  process.exit(1)
}
const opt = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`)
  return i > -1 && args[i + 1] ? args[i + 1] : fallback
}

const title = opt('title', resolve(src).split('/').pop().replace(/\.md$/, ''))
const accent = opt('accent', '#c2410c')
const preview = opt('preview', '')
const margin = opt('margin', '15') + 'mm'

const css = `
@page { size: A4; margin: 16mm 15mm 15mm 15mm; }
* { box-sizing: border-box; }
body { font-family: "WenQuanYi Zen Hei", "Noto Sans CJK SC", system-ui, sans-serif;
  font-size: 10.5pt; line-height: 1.75; color: #1c1c22; margin: 0; }
h1 { font-size: 21pt; line-height: 1.3; margin: 0 0 4mm; padding-bottom: 3mm;
  border-bottom: 2.6pt solid ${accent}; }
h2 { font-size: 13pt; margin: 7mm 0 2.5mm; padding-left: 3mm;
  border-left: 3.2pt solid ${accent}; page-break-after: avoid; }
h3 { font-size: 11pt; margin: 5mm 0 1.5mm; color: #33333c; page-break-after: avoid; }
p { margin: 0 0 2.2mm; }
em { font-style: normal; color: #6b6b74; }
hr { border: 0; border-top: .6pt solid #dcdce2; margin: 5mm 0; }
ul, ol { margin: 0 0 2.5mm; padding-left: 6mm; }
li { margin-bottom: 1.2mm; }
blockquote { margin: 4mm 0; padding: 3mm 4mm; background: #f6f6f8;
  border-left: 2.6pt solid #b9b9c2; color: #3a3a44; font-size: 9.8pt; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 4mm; font-size: 9.6pt; }
th, td { border: .6pt solid #d8d8de; padding: 1.8mm 2.4mm; text-align: left; vertical-align: top; }
th { background: #f3f3f6; font-weight: 700; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 9pt; background: #f2f2f5; padding: 0 1mm; }
a { color: #1c1c22; text-decoration: none; }
`

const md = readFileSync(resolve(src), 'utf8')
const isHtml = /\.html?$/i.test(src)
const body = isHtml ? md : marked.parse(md, { breaks: false, gfm: true })
const html = isHtml
  ? md
  : `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">
<title>${title}</title><style>${css}</style></head><body>${body}</body></html>`

const htmlPath = resolve(out).replace(/\.pdf$/, '.html')
writeFileSync(htmlPath, html)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 })
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
await page.pdf({ path: resolve(out), format: 'A4', printBackground: true,
  margin: { top: margin, bottom: margin, left: margin, right: margin } })
if (preview) await page.screenshot({ path: resolve(preview), fullPage: false })
await browser.close()

const kb = (readFileSync(resolve(out)).length / 1024).toFixed(0)
console.log(`PDF: ${resolve(out)} (${kb} KB)`)
