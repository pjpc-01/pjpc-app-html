import { suToken, SITE } from './_auth.mjs'
const PB = 'http://127.0.0.1:8090'
const su = await suToken()
const H = { 'Content-Type': 'application/json', Authorization: su }

const mk = await fetch(PB + '/api/collections/users/records', {
  method: 'POST', headers: H,
  body: JSON.stringify({ email: 'zz_probe@pjpc.local', username: 'zz_probe', password: 'Test123456', passwordConfirm: 'Test123456', name: 'zz_probe', role: 'teacher' }),
})
const u = await mk.json()
const lg = await (await fetch(PB + '/api/collections/users/auth-with-password', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: 'zz_probe', password: 'Test123456' }),
})).json()
const AH = { Authorization: 'Bearer ' + lg.token }

const self = await fetch(SITE + '/api/pocketbase-proxy/api/collections/users/records/' + u.id, { headers: AH })
console.log('读自己 →', self.status, (await self.text()).slice(0, 80))

const others = (await (await fetch(PB + '/api/collections/users/records?perPage=5&filter=' + encodeURIComponent('role="admin"'), { headers: { Authorization: su } })).json()).items || []
const one = others.find(x => x.id !== u.id)
const other = await fetch(SITE + '/api/pocketbase-proxy/api/collections/users/records/' + one.id, { headers: AH })
console.log('读别人 →', other.status)

const list = await fetch(SITE + '/api/pocketbase-proxy/api/collections/users/records?perPage=5', { headers: AH })
console.log('列 users →', list.status)

await fetch(PB + '/api/collections/users/records/' + u.id, { method: 'DELETE', headers: { Authorization: su } })
console.log('临时账号已删')
