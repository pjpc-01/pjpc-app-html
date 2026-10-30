
import { suToken } from './_auth.mjs'
const PB='http://127.0.0.1:8090'
const su=await suToken(); const H={Authorization:su}
const J=async u=>{const r=await fetch(u,{headers:H});const t=await r.text();try{return JSON.parse(t)}catch{return {}}}
const all=async n=>{let out=[],p=1;while(true){const d=await J(`${PB}/api/collections/${n}/records?perPage=500&page=${p}`);out=out.concat(d.items||[]);if(p>=(d.totalPages||1))break;p++}return out}

const students=await all('students')
const byId=new Map(students.map(s=>[s.id,s]))
console.log('学生总数:', students.length)
console.log('  没填年级:', students.filter(s=>!s.grade||!String(s.grade).trim()).length)
console.log('  学号空/00:', students.filter(s=>!s.student_id||s.student_id==='00').length)
console.log('  center 空:', students.filter(s=>!s.center).length)
const dupCount=(()=>{const m={};students.forEach(s=>{const k=(s.name||'')+'|'+(s.grade||'');m[k]=(m[k]||0)+1});return Object.values(m).filter(v=>v>1).length})()
console.log('  重名+年级重复:', dupCount)

// codex 关联
const codex=await all('codex_students')
const missing=codex.filter(c=>!byId.has(c.student_id))
console.log('\ncodex 学生:', codex.length, '| student_id 找不到对应学生:', missing.length)
missing.slice(0,5).forEach(c=>console.log('   缺:', c.name, c.student_id))

// users 账号一致性
const users=await all('users')
const teachers=await all('teachers')
const tIds=new Set(teachers.map(t=>t.id))
console.log('\nusers:', users.length, '| role=teacher 但 teacher_id 空或无效:', users.filter(u=>u.role==='teacher'&&(!u.teacher_id||!tIds.has(u.teacher_id))).length)
const uTids=new Set(users.map(u=>u.teacher_id).filter(Boolean))
console.log('  老师档案没有账号:', teachers.filter(t=>!uTids.has(t.id)&&t.status!=='inactive').length)

// 关键集合孤儿检查
for (const [col, field] of [['grades','studentId'],['monthly_test_scores','studentId'],['exam_targets','student_id'],['teacher_teaching_reports','teacher_id'],['invoices','studentId']]) {
  const rows=await all(col)
  const orphan=rows.filter(r=>r[field]&&!byId.has(r[field])&&!tIds.has(r[field]))
  console.log(`  ${col}: ${rows.length} 条，孤儿 ${orphan.length}`)
}
