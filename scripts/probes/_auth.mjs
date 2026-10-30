// 探针共用登录态。
// 代理加了守门后，不能再匿名查 users / impersonate，所以这里直接对 PB(8090)
// 用 superuser 取 impersonate token，再把 token 塞进 localStorage 当登录态。
// 只在本机跑，供探针使用；不参与应用运行。
import fs from 'node:fs';

export const PB = 'http://127.0.0.1:8090';
export const SITE = 'http://127.0.0.1:3001';
export const PROXY = SITE + '/api/pocketbase-proxy/api';

function readEnv() {
  const out = {};
  const txt = fs.readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

// 探针用的管理员账号口令：从 .env.local 读，禁止硬编码
const ENV = readEnv();
export const ADMIN_EMAIL = ENV.ADMIN_EMAIL || ENV.POCKETBASE_ADMIN_EMAIL || 'admin@pjpc.com';
/** 应用后台登录口令（users 集合的 admin 账号，不是 PB superuser） */
export const ADMIN_LOGIN_PASS = ENV.PJPC_ADMIN_LOGIN_PASS || '';

export async function suToken() {
  const env = readEnv();
  const r = await fetch(PB + '/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: env.POCKETBASE_ADMIN_EMAIL, password: env.POCKETBASE_ADMIN_PASSWORD }),
  });
  if (!r.ok) throw new Error('superuser auth failed: ' + r.status);
  return (await r.json()).token;
}

/** 取某个用户（按 email）的登录态：{ token, model } */
export async function authAs(email) {
  const su = await suToken();
  const d = await (await fetch(`${PB}/api/collections/users/records?perPage=1&filter=${encodeURIComponent(`email="${email}"`)}`, {
    headers: { Authorization: su },
  })).json();
  const uid = d?.items?.[0]?.id;
  if (!uid) throw new Error('user not found: ' + email);
  const imp = await (await fetch(`${PB}/api/collections/users/impersonate/${uid}`, {
    method: 'POST', headers: { Authorization: su },
  })).json();
  return { token: imp.token, model: imp.record };
}

/** 管理员（admin@pjpc.com）登录态 —— 大多数探针用它 */
export async function adminAuth() {
  return authAs('admin@pjpc.com');
}

/** 用 superuser token 直接读 PB（探针核对数据用，绕过代理） */
export async function pbGet(path) {
  const su = await suToken();
  const r = await fetch(PB + (path.startsWith('/') ? path : '/' + path), { headers: { Authorization: su } });
  if (!r.ok) throw new Error(`PB ${r.status}: ${(await r.text()).slice(0, 150)}`);
  return r.json();
}
