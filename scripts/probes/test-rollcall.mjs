// 一键点名写入链路验证：用临时学生打一次，验完把痕迹清掉
import { suToken, adminAuth, SITE } from './_auth.mjs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const a = await adminAuth()
const AH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }

// 1) 临时学生
const mk = await fetch(PB + '/api/collections/students/records', {
  method: 'POST', headers: H,
  body: JSON.stringify({ name: 'ZZ 点名测试', student_id: 'ZZ T99', grade: 'Form 1', center: 'PU1', status: 'active' }),
})
const stu = await mk.json()
console.log('临时学生:', mk.status, stu.id)

// 2) 打一次点名（就是一键点名调用同一个接口）
const ci = await fetch(SITE + '/api/attendance/checkin', {
  method: 'POST', headers: AH,
  body: JSON.stringify({ person_id: stu.id, person_type: 'student', person_name: stu.name, center: 'PU1', method: 'manual', notes: '点名 Form 1 测试' }),
})
const ciBody = await ci.json().catch(() => ({}))
console.log('点名写入:', ci.status, JSON.stringify(ciBody).slice(0, 140))

// 3) 查今天这条
const today = new Date().toISOString().slice(0, 10)
const chk = await (await fetch(PB + `/api/collections/student_attendance/records?filter=${encodeURIComponent(`student_id="${stu.id}"`)}`, { headers: { Authorization: su } })).json()
console.log('考勤记录条数:', chk.totalItems, (chk.items || [])[0]?.status || '')

// 4) 清理：考勤 + 积分流水 + 学生
for (const r of chk.items || []) {
  await fetch(PB + '/api/collections/student_attendance/records/' + r.id, { method: 'DELETE', headers: { Authorization: su } })
}
const pl = await (await fetch(PB + `/api/collections/point_logs/records?filter=${encodeURIComponent(`student="${stu.id}"`)}`, { headers: { Authorization: su } })).json()
for (const r of pl.items || []) {
  await fetch(PB + '/api/collections/point_logs/records/' + r.id, { method: 'DELETE', headers: { Authorization: su } })
}
await fetch(PB + '/api/collections/students/records/' + stu.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('已清理: 考勤', (chk.items || []).length, '条 / 积分', (pl.items || []).length, '条 / 学生 1 个')
