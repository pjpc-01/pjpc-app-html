#!/usr/bin/env node
// 临时测量：把 HTML 渲成 A4 宽，输出内容高度（mm）+ 截图
import { chromium } from 'playwright'
import { pathToFileURL } from 'url'

const src = process.argv[2]
const shot = process.argv[3] || ''
const browser = await chromium.launch()
const w = Number(process.env.W || 726)
const page = await browser.newPage({ viewport: { width: w, height: 1123 }, deviceScaleFactor: 2 })
await page.goto(pathToFileURL(src).href, { waitUntil: 'load' })
await page.waitForTimeout(300)
const m = await page.evaluate(() => {
  const px2mm = px => +(px / 96 * 25.4).toFixed(1)
  const body = document.body
  return {
    bodyHeight: px2mm(body.scrollHeight),
    blocks: [...body.children].map(el => ({
      tag: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
      h: px2mm(el.getBoundingClientRect().height),
    })),
  }
})
console.log('宽度(px):', w, '≈', (w/96*25.4).toFixed(0)+'mm | 内容总高(mm):', m.bodyHeight)
console.table(m.blocks)
if (shot) await page.screenshot({ path: shot })
await browser.close()
