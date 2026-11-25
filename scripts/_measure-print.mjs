#!/usr/bin/env node
// 打印模式下测量：模拟 print media，输出内容高度与最后一屏分页位置
import { chromium } from 'playwright'
import { pathToFileURL } from 'url'

const src = process.argv[2]
const contentWidthPx = Number(process.env.W || 726)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: contentWidthPx, height: 1050 } })
await page.goto(pathToFileURL(src).href, { waitUntil: 'load' })
await page.emulateMedia({ media: 'print' })
await page.waitForTimeout(300)
const m = await page.evaluate(() => {
  const px2mm = px => +(px / 96 * 25.4).toFixed(1)
  const kids = [...document.body.children].map(el => {
    const r = el.getBoundingClientRect()
    return { tag: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), top: px2mm(r.top), h: px2mm(r.height) }
  })
  return { total: px2mm(document.body.scrollHeight), kids }
})
console.log('print 模式内容总高(mm):', m.total)
console.table(m.kids)
await browser.close()
