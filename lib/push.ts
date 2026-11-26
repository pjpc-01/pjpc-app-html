/**
 * FCM 推送（Google 免费通道，HTTP v1 API）。
 *
 * 为什么要有：站内通知只有打开 App 才看得到；后台轮询最坏慢 15 分钟。
 * Firebase Cloud Messaging 是免费的，服务器一发，手机秒收 —— App 不需要在后台跑。
 *
 * 凭据：.env.local 里的 FCM_SERVICE_ACCOUNT_JSON（Firebase 服务账号 JSON 的整段内容）
 *      或 FCM_SERVICE_ACCOUNT_FILE（指向那个 json 的路径）。
 * 没有凭据时所有函数安静返回 —— 推送没配也不能把站内通知搞挂。
 */

import crypto from 'crypto'
import fs from 'fs'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

type ServiceAccount = { project_id: string; client_email: string; private_key: string }

let cachedAccount: ServiceAccount | null | undefined
let cachedToken: { value: string; exp: number } | null = null

function serviceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount
  try {
    const raw = process.env.FCM_SERVICE_ACCOUNT_JSON
    if (raw && raw.trim().startsWith('{')) {
      cachedAccount = JSON.parse(raw) as ServiceAccount
      return cachedAccount
    }
    const file = process.env.FCM_SERVICE_ACCOUNT_FILE
    if (file && fs.existsSync(file)) {
      cachedAccount = JSON.parse(fs.readFileSync(file, 'utf8')) as ServiceAccount
      return cachedAccount
    }
  } catch (e) {
    console.error('[PUSH] 服务账号读取失败:', e instanceof Error ? e.message : e)
  }
  cachedAccount = null
  return null
}

export function pushConfigured(): boolean {
  return !!serviceAccount()
}

async function accessToken(account: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claims = Buffer.from(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, exp: now + 3600, iat: now })
  ).toString('base64url')

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(account.private_key, 'base64url')
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!res.ok) {
    console.error('[PUSH] 取 access token 失败:', res.status, (await res.text()).slice(0, 200))
    return null
  }
  const data: any = await res.json()
  cachedToken = { value: data.access_token, exp: now + Number(data.expires_in || 3600) }
  return cachedToken.value
}

async function tokensOf(adminToken: string, userId: string): Promise<{ id: string; token: string }[]> {
  const q = encodeURIComponent(`user="${userId}"`)
  const r = await fetch(`${PB_URL}/api/collections/device_tokens/records?perPage=20&filter=${q}`, {
    headers: { Authorization: adminToken },
  }).catch(() => null)
  if (!r || !r.ok) return []
  const d: any = await r.json().catch(() => ({ items: [] }))
  return (d.items || []).map((x: any) => ({ id: x.id, token: x.token })).filter((x: any) => x.token)
}

async function dropToken(adminToken: string, rowId: string) {
  await fetch(`${PB_URL}/api/collections/device_tokens/records/${rowId}`, {
    method: 'DELETE',
    headers: { Authorization: adminToken },
  }).catch(() => {})
}

/**
 * 给某个账号推一条通知。失败只打日志，不抛。
 * 返回真正送达的设备数。
 */
export async function pushToUser(
  adminToken: string,
  userId: string,
  msg: { title: string; body?: string; link?: string; kind?: string }
): Promise<number> {
  const account = serviceAccount()
  if (!account || !userId) return 0

  const rows = await tokensOf(adminToken, userId)
  if (!rows.length) return 0

  const at = await accessToken(account)
  if (!at) return 0

  let sent = 0
  for (const row of rows) {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title: msg.title || 'PJPC', body: msg.body || '' },
            data: { link: msg.link || '/', kind: msg.kind || 'system' },
            android: {
              priority: 'HIGH',
              notification: { channel_id: 'pjpc_default', default_vibrate_timings: true },
            },
          },
        }),
      })
      if (res.ok) {
        sent++
        continue
      }
      const text = await res.text().catch(() => '')
      // token 失效（换机、重装、卸载）→ 从库里删掉，别一直白推
      if (res.status === 404 || text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
        await dropToken(adminToken, row.id)
      } else {
        console.error('[PUSH] 发送失败:', res.status, text.slice(0, 160))
      }
    } catch (e) {
      console.error('[PUSH] 发送异常:', e instanceof Error ? e.message : e)
    }
  }
  return sent
}
