/// <reference path="../pb_data/types.d.ts" />
/**
 * 学生保存时自动回填 centerId —— 别再靠前端手动选。
 *
 * 背景：students 表有两个分行字段，center 存代码（"PU1" / "BATU14"），
 * centerId 存关联 id（centers.id）。前端经常只写 center 不写 centerId，
 * 于是分行报表、贡献榜按 centerId 过滤时就把这个学生漏掉
 * （2026-10 修过一次，11 月 Wong Zi Hong 又空了）。
 *
 * 规则：
 *   - 只在 centerId 为空时补，已有值不动（不覆盖人工指定）
 *   - 按 center 代码去 centers 表找 code，找不到就不动，不猜
 */

function code9(v) {
  return String(v || '').replace(/"/g, '').trim().toUpperCase()
}

function backfill(rec) {
  if (!rec) return
  if (rec.getString('centerId')) return
  const code = code9(rec.getString('center'))
  if (!code) return

  const list = $app.findRecordsByFilter('centers', 'code = "' + code + '"', '', 1, 0)
  if (!list || list.length === 0) return

  rec.set('centerId', list[0].id)
  console.log('[center-sync] 学生 ' + rec.getString('name') + ' centerId 回填 ' + code)
}

onRecordBeforeCreateRequest((e) => {
  try { backfill(e.record) } catch (err) { console.log('[center-sync] ' + err) }
  e.next()
}, 'students')

onRecordBeforeUpdateRequest((e) => {
  try { backfill(e.record) } catch (err) { console.log('[center-sync] ' + err) }
  e.next()
}, 'students')
