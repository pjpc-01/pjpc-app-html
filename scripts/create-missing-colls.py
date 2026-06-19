#!/usr/bin/env python3
"""Create remaining missing PocketBase collections (fixed)"""
import urllib.request, urllib.error, json

PB_URL = "http://127.0.0.1:8090"

def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{PB_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read()) if e.code != 204 else {}
        print(f"  ⚠ {e.code}: {err.get('message','')[:100]}")
        return None

auth = api("POST", "/api/admins/auth-with-password",
           {"identity": "final_admin@test.com", "password": "final_pass"})
token = auth["token"]
print(f"✅ Authed")

# Get existing
existing = set()
cols = api("GET", "/api/collections", token)
if cols:
    for c in cols.get("items", []):
        existing.add(c["name"])

# All remaining collections (json fields replaced with editor)
collections = [
    ("schedule_logs", [
        {"name":"schedule_id","type":"text"},
        {"name":"action","type":"text"},
        {"name":"user_id","type":"text"},
        {"name":"user_name","type":"text"},
        {"name":"user_role","type":"text"},
        {"name":"details","type":"text"},
        {"name":"old_values","type":"editor"},
        {"name":"new_values","type":"editor"},
        {"name":"ip_address","type":"text"},
        {"name":"user_agent","type":"text"},
        {"name":"status","type":"text"},
        {"name":"error_message","type":"text"},
    ]),
    ("teacher_attendance", [
        {"name":"teacher_id","type":"text","required":True},
        {"name":"teacher_name","type":"text"},
        {"name":"date","type":"date","required":True},
        {"name":"check_in","type":"text"},
        {"name":"check_out","type":"text"},
        {"name":"status","type":"select","options":{"maxSelect":1,"values":["present","absent","late","half-day","leave"]}},
        {"name":"notes","type":"text"},
    ]),
    ("student_attendance", [
        {"name":"student_id","type":"text"},
        {"name":"student_name","type":"text"},
        {"name":"date","type":"date","required":True},
        {"name":"check_in","type":"text"},
        {"name":"check_out","type":"text"},
        {"name":"status","type":"select","options":{"maxSelect":1,"values":["present","absent","late","half-day","leave"]}},
        {"name":"notes","type":"text"},
    ]),
    ("audit_logs", [
        {"name":"user_id","type":"text"},
        {"name":"user_name","type":"text"},
        {"name":"action","type":"text"},
        {"name":"description","type":"text"},
        {"name":"ip_address","type":"text"},
        {"name":"user_agent","type":"text"},
        {"name":"metadata","type":"editor"},
    ]),
]

created = 0
for name, schema in collections:
    if name in existing:
        print(f"  ⏭ Already exists: {name}")
        continue
    result = api("POST", "/api/collections",
                 {"name": name, "type": "base", "schema": schema}, token)
    if result and "name" in result:
        created += 1
        print(f"  ✅ Created: {name}")
    else:
        print(f"  ❌ Failed: {name}")

print(f"\n✅ Done! Created {created} collections. Total: {len(existing) + created}")
