import { suToken, SITE } from './_auth.mjs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }
const startedAt = new Date().toISOString().replace('T', ' ')
const out = []
const ok = (n, pass, extra='') => { out.push(pass); console.log(`${pass?'PASS':'FAIL'}  ${n}${extra?'  →  '+extra:''}`) }

// 先清掉上次跑挂掉留下的测试流水 —— 否则会污染真实流水（2026-10-27 清出 20 条 ZZ 测试流水）
for (const col of ['contribution_point_logs', 'notifications']) {
  const q = encodeURIComponent(col === 'notifications' ? 'title~"ZZ" || actor~"ZZ" || body~"ZZ"' : 'student_name~"ZZ" || note~"ZZ"')
  const d = await (await fetch(`${PB}/api/collections/${col}/records?perPage=200&filter=${q}`, { headers: H })).json()
  for (const r of d.items || []) await fetch(`${PB}/api/collections/${col}/records/${r.id}`, { method: 'DELETE', headers: H })
  if ((d.items || []).length) console.log(`清掉上次残留的测试流水 ${d.items.length} 条`)
}

// 临时学生
const s = await (await fetch(PB+'/api/collections/students/records',{method:'POST',headers:H,body:JSON.stringify({name:'ZZ 贡献v2',student_id:'ZZ V2',grade:'Form 1',center:'PU1',status:'active',points:500,points_enabled:true})})).json()
const u = await (await fetch(PB+'/api/collections/users/records',{method:'POST',headers:H,body:JSON.stringify({username:'zzv2',email:'zzv2@student.pjpc.local',password:'pjpcZZV2',passwordConfirm:'pjpcZZV2',name:'ZZ 贡献v2',role:'student',student_id:s.id,center:'PU1'})})).json()
const lg = await (await fetch(PB+'/api/collections/users/auth-with-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:'zzv2',password:'pjpcZZV2'})})).json()
const SH = { 'Content-Type':'application/json', Authorization:'Bearer '+lg.token }
const adm = await (await fetch(PB+'/api/collections/users/auth-with-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:'admin@pjpc.com',password:'1234567890'})})).json()
const AH = { 'Content-Type':'application/json', Authorization:'Bearer '+adm.token }
const get = async (p,h=AH) => { const r = await fetch(SITE+p,{headers:h}); return { status:r.status, body: await r.json().catch(()=>({})) } }
const send = async (p,m,b,h=AH) => { const r = await fetch(SITE+p,{method:m,headers:h,body:b?JSON.stringify(b):undefined}); return { status:r.status, body: await r.json().catch(()=>({})) } }

try {
  // 1) 改比率 0.5
  const setRate = await send('/api/contribution/admin','PATCH',{points_rate:0.5,note:'测试半倍'},AH)
  ok('管理员改比率 0.5', setRate.status===200 && Number(setRate.body.rate)===0.5, JSON.stringify(setRate.body))
  const stuSetRate = await send('/api/contribution/admin','PATCH',{points_rate:2},SH)
  ok('学生改比率 = 403', stuSetRate.status===403, `实际 ${stuSetRate.status}`)

  // 2) 投 100 → 先锁住（物品没完成不发贡献积分）
  const item = await (await fetch(PB+'/api/collections/contribution_items/records',{method:'POST',headers:H,body:JSON.stringify({name:'ZZ v2 物品',target_points:9999,current_points:0,center:'PU1',status:'active'})})).json()
  const don = await send('/api/contribution/donate','POST',{itemId:item.id,points:100},SH)
  ok('投 100 → 锁住 50（还没发）', don.status===200 && don.body.earned_pending===50 && don.body.released_now===false, JSON.stringify({pending:don.body.earned_pending, released:don.body.released_now}))
  const sumLock = await get('/api/contribution/summary',SH)
  ok('锁定期间贡献积分还是 0', (sumLock.body.balance?.balance||0)===0, `bal=${sumLock.body.balance?.balance}`)
  ok('锁定期间学生总积分 500→400', (sumLock.body.balance?.points_now||0)===400, `points=${sumLock.body.balance?.points_now}`)

  // 2b) 下架 → 全数退回
  const close = await send(`/api/contribution/item?type=upgrade&id=${item.id}`,'PATCH',{action:'close'},AH)
  const sumRefund = await get('/api/contribution/summary',SH)
  ok('下架后积分退回 400→500', (sumRefund.body.balance?.points_now||0)===500, `points=${sumRefund.body.balance?.points_now}`)
  ok('下架不产生贡献积分', (sumRefund.body.balance?.balance||0)===0, `bal=${sumRefund.body.balance?.balance}`)
  ok('下架结果有记录', close.status===200 && Number(close.body.refunded?.refunded||0)===100, JSON.stringify(close.body.refunded||{}))
  await fetch(PB+'/api/collections/contribution_items/records/'+item.id,{method:'DELETE',headers:H}).catch(()=>{})

  // 2c) 物品筹够 → 那一刻才发贡献积分
  const item2 = await (await fetch(PB+'/api/collections/contribution_items/records',{method:'POST',headers:H,body:JSON.stringify({name:'ZZ v2 达标物品',target_points:100,current_points:0,center:'PU1',status:'active'})})).json()
  const don2 = await send('/api/contribution/donate','POST',{itemId:item2.id,points:100},SH)
  ok('筹够 → 当场发放 50 贡献积分', don2.status===200 && don2.body.released_now===true && Number(don2.body.released?.granted||0)===50, JSON.stringify({released:don2.body.released_now, granted:don2.body.released?.granted}))
  const sumAfter = await get('/api/contribution/summary',SH)
  ok('发放后余额 50', (sumAfter.body.balance?.balance||0)===50, `bal=${sumAfter.body.balance?.balance}`)
  const item2After = await (await fetch(PB+'/api/collections/contribution_items/records/'+item2.id,{headers:H})).json()
  ok('物品状态 achieved', item2After.status==='achieved', item2After.status)

  // 3) 手动 +30
  const adj = await send('/api/contribution/admin','POST',{studentId:s.id,amount:30,note:'搬桌椅奖励'},AH)
  ok('手动加 30 → 余额 80', adj.status===200 && adj.body.balance===80, JSON.stringify(adj.body))
  const stuAdj = await send('/api/contribution/admin','POST',{studentId:s.id,amount:999,note:'学生自己加'},SH)
  ok('学生自己改 = 403', stuAdj.status===403, `实际 ${stuAdj.status}`)

  // 4) 学生看得到比率/余额/明细
  const sum = await get('/api/contribution/summary',SH)
  ok('学生总览：比率0.5 余额80 明细2条', sum.body.rate===0.5 && sum.body.balance.balance===80 && (sum.body.my_point_logs||[]).length===2,
     `rate=${sum.body.rate} bal=${sum.body.balance?.balance} logs=${(sum.body.my_point_logs||[]).length}`)
  const logsAll = await get('/api/contribution/admin?view=logs&limit=50',AH)
  ok('管理员看全站流水', logsAll.status===200 && (logsAll.body.logs||[]).length>=2, `${(logsAll.body.logs||[]).length} 条`)

  // 5) 学生提议：中心升级物品 + 照片
  const fd = new FormData()
  fd.append('type','upgrade'); fd.append('name','ZZ 提议电子琴'); fd.append('description','想练琴，中心有一台大家都能用')
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64')
  fd.append('image', new Blob([png],{type:'image/png'}), 'p.png')
  const prop = await fetch(SITE+'/api/contribution/item-requests',{method:'POST',headers:{Authorization:'Bearer '+lg.token},body:fd})
  ok('学生提议（带照片）', prop.status===200, `实际 ${prop.status}`)
  const mine = await get('/api/contribution/item-requests',SH)
  ok('学生看到自己的提议', (mine.body.requests||[]).length===1 && !!mine.body.requests[0].image_url, `${(mine.body.requests||[]).length} 条`)

  // 6) 管理员通过 → 自动建物品
  const rid = mine.body.requests[0].id
  const approve = await send('/api/contribution/item-requests','PATCH',{id:rid,status:'approved',target_points:1500},AH)
  ok('通过提议并建物品', approve.status===200 && !!approve.body.created_id, JSON.stringify(approve.body))
  const newItem = await (await fetch(PB+'/api/collections/contribution_items/records/'+approve.body.created_id,{headers:{Authorization:su}})).json()
  ok('新物品字段正确', newItem.name==='ZZ 提议电子琴' && Number(newItem.target_points)===1500 && newItem.status==='active', `${newItem.name}/${newItem.target_points}`)

  // 7) 私人物品提议 → 通过 → 兑换 → 批准扣分 → 拒绝退回
  const fd2 = new FormData(); fd2.append('type','reward'); fd2.append('name','ZZ 提议耳机'); fd2.append('description','想要耳机听英文')
  await fetch(SITE+'/api/contribution/item-requests',{method:'POST',headers:{Authorization:'Bearer '+lg.token},body:fd2})
  const mine2 = await get('/api/contribution/item-requests',SH)
  const rid2 = (mine2.body.requests||[]).find(x=>x.type==='reward').id
  const appr2 = await send('/api/contribution/item-requests','PATCH',{id:rid2,status:'approved',cost_points:50,stock:3},AH)
  const newReward = await (await fetch(PB+'/api/collections/reward_items/records/'+appr2.body.created_id,{headers:{Authorization:su}})).json()
  ok('私人物品通过：50 分 3 件', Number(newReward.cost_points)===50 && Number(newReward.stock)===3, `${newReward.cost_points}/${newReward.stock}`)

  const red = await send('/api/contribution/redeem','POST',{itemId:newReward.id},SH)
  ok('兑换申请（余额80够50）', red.status===200, JSON.stringify(red.body.balance||{}))
  const sm2 = await get('/api/contribution/summary',AH)
  const pend = (sm2.body.pending_redemptions||[]).find(x=>x.student===s.id)
  const apprRed = await send('/api/contribution/requests','PATCH',{id:pend.id,status:'approved'},AH)
  const stuAfter = await (await fetch(PB+'/api/collections/students/records/'+s.id,{headers:{Authorization:su}})).json()
  ok('批准兑换 → 扣到 30', apprRed.status===200 && Number(stuAfter.contribution_points)===30, `余额 ${stuAfter.contribution_points}`)
  await send('/api/contribution/requests','PATCH',{id:pend.id,status:'rejected'},AH)
  const stuRefund = await (await fetch(PB+'/api/collections/students/records/'+s.id,{headers:{Authorization:su}})).json()
  ok('改成拒绝 → 退回 80', Number(stuRefund.contribution_points)===80, `余额 ${stuRefund.contribution_points}`)

  // 8) 手动授予成就
  const award = await send('/api/achievements/award','POST',{studentId:s.id,code:'attendance_30',note:'全勤表现好'},AH)
  ok('管理员授予成就', award.status===200, JSON.stringify(award.body))
  const ach = await get('/api/achievements',SH)
  const gotCodes = (ach.body.achievements||[]).filter(a=>a.earned).map(a=>a.code)
  ok('学生端显示已解锁', gotCodes.includes('attendance_30'), gotCodes.join(','))
  const setT = await send('/api/achievements','PATCH',{code:'attendance_30'},SH)
  ok('用授予的成就设称号', setT.status===200 && setT.body.title==='全勤之星', JSON.stringify(setT.body))
  const dup = await send('/api/achievements/award','POST',{studentId:s.id,code:'attendance_30'},AH)
  ok('重复授予被挡', dup.status===400, `实际 ${dup.status}`)
  const aw = await get('/api/achievements/award?studentId='+s.id,AH)
  await send('/api/achievements/award?id='+aw.body.awards[0].id,'DELETE',null,AH)
  const ach2 = await get('/api/achievements',SH)
  ok('撤销后不再解锁', (ach2.body.achievements||[]).filter(a=>a.earned).map(a=>a.code).includes('attendance_30')===false)
} finally {
  // 清理
  const cleanup = async (col, filter) => {
    const d = await (await fetch(PB+`/api/collections/${col}/records?perPage=200&filter=${encodeURIComponent(filter)}`,{headers:{Authorization:su}})).json()
    for (const x of d.items||[]) await fetch(PB+`/api/collections/${col}/records/`+x.id,{method:'DELETE',headers:{Authorization:su}})
  }
  await cleanup('contribution_point_logs', `student="${s.id}"`)
  await cleanup('notifications', `created >= "${startedAt}"`)
  await cleanup('contribution_logs', `student="${s.id}"`)
  await cleanup('reward_redemptions', `student="${s.id}"`)
  await cleanup('point_logs', `student="${s.id}"`)
  await cleanup('item_requests', `student="${s.id}"`)
  await cleanup('student_achievements', `student="${s.id}"`)
  await cleanup('contribution_items', 'name~"ZZ "')
  await cleanup('reward_items', 'name~"ZZ "')
  await fetch(PB+'/api/collections/users/records/'+u.id,{method:'DELETE',headers:{Authorization:su}})
  await fetch(PB+'/api/collections/students/records/'+s.id,{method:'DELETE',headers:{Authorization:su}})
  // 比率还原
  const cfg = await (await fetch(PB+'/api/collections/contribution_settings/records?perPage=5',{headers:{Authorization:su}})).json()
  for (const c of cfg.items||[]) await fetch(PB+'/api/collections/contribution_settings/records/'+c.id,{method:'PATCH',headers:H,body:JSON.stringify({points_rate:1,note:'默认 1：1'})})
  console.log('已清理（比率还原 1）')
}
const fail = out.filter(x=>!x).length
console.log(`\n合计 ${out.length} | 失败 ${fail}`)
