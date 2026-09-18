#!/usr/bin/env python3
"""Export PocketBase collection schemas to JSON file.

Runs on git pre-commit automatically via .git/hooks/pre-commit

认证方式（按顺序尝试，均不硬编码任何密码）：
  1. 环境变量 PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD（若有设置）
  2. 零密码代登录：/api/collections/users/impersonate/{id}
     （与 app/api/finance/reconciliation 等路由使用同一机制）

⚠️ 不要在此文件里写死管理员账号或密码。
⚠️ PocketBase 0.23+ 已移除 /api/admins/auth-with-password，
   超级用户登录改走 /api/collections/_superusers/auth-with-password。
"""
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse

PB_URL = os.environ.get("PB_URL", "http://127.0.0.1:8090")
# 代登录必须走带权限的入口：
#   直连 8090 匿名查不到 users（列表规则限制），所以优先用 Next.js 的代理入口
PB_PROXY_URL = os.environ.get("PB_PROXY_URL", "http://127.0.0.1:3001/api/pocketbase-proxy")
OUTPUT = os.environ.get("PB_SCHEMA_OUTPUT", "pb-schema.json")
IMPERSONATE_EMAIL = os.environ.get("PB_IMPERSONATE_EMAIL", "admin@pjpc.com")
TIMEOUT = 8


def _post(url, payload=None, token=None):
    """POST 请求。payload=None 时也发 POST（代登录就是无 body 的 POST）。"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload is not None else b""
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())


def _get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())


def get_token():
    # 1) 环境变量凭据（直连 PB）
    email = os.environ.get("PB_ADMIN_EMAIL")
    password = os.environ.get("PB_ADMIN_PASSWORD")
    if email and password:
        for path in ("/api/collections/_superusers/auth-with-password",
                     "/api/collections/users/auth-with-password"):
            try:
                res = _post(f"{PB_URL}{path}", {"identity": email, "password": password})
                if res.get("token"):
                    return res["token"]
            except Exception:
                continue

    # 2) 零密码代登录 —— 走 Next.js 代理入口（直连 8090 匿名拿不到 users）
    for base in (PB_PROXY_URL, PB_URL):
        try:
            flt = urllib.parse.quote(f'email="{IMPERSONATE_EMAIL}"')
            users = _get(f"{base}/api/collections/users/records?perPage=1&filter={flt}")
            items = users.get("items") or []
            if items:
                res = _post(f"{base}/api/collections/users/impersonate/{items[0]['id']}")
                if res.get("token"):
                    return res["token"]
        except Exception:
            continue

    return None


def main():
    print("📦 Exporting PocketBase schema...")

    # PB 是否在跑
    try:
        _get(f"{PB_URL}/api/health")
    except Exception:
        print("⚠️  PB not running — skipping schema export")
        return 0

    # 优先走 Next.js 代理（自带管理员权限，无需凭据、无需 token）
    data = None
    for base in (PB_PROXY_URL, PB_URL):
        try:
            data = _get(f"{base}/api/collections?perPage=200")
            if data.get("items"):
                break
        except Exception:
            continue

    if not data or not data.get("items"):
        # 代理不可用 → 退回带 token 的直连
        token = get_token()
        if token:
            try:
                data = _get(f"{PB_URL}/api/collections?perPage=200", token=token)
            except Exception:
                data = None

    if not data or not data.get("items"):
        print("⚠️  Failed to fetch schema — skipping schema export")
        return 0

    # 只保留可提交的摘要（数组字段顺序稳定，便于 diff）
    out = {
        "collections": [
            {
                "name": c.get("name"),
                "type": c.get("type"),
                "fields": [
                    {"name": f.get("name"), "type": f.get("type"), "required": f.get("required", False)}
                    for f in c.get("fields", [])
                ],
            }
            for c in data.get("items", [])
        ]
    }

    with open(OUTPUT, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"✅ Exported {len(out['collections'])} collections → {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
