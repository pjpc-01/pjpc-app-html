#!/usr/bin/env python3
"""Create missing PocketBase collections for PJPC ERP (safe mode - no deletes)"""
import urllib.request
import urllib.error
import json
import sys

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
        print(f"  ⚠ {method} {path} -> {e.code}: {err.get('message','')}")
        return None

# Get admin token
auth = api("POST", "/api/admins/auth-with-password",
           {"identity": "final_admin@test.com", "password": "final_pass"})
if not auth:
    print("❌ Admin auth failed!")
    sys.exit(1)
token = auth["token"]
print(f"✅ Authenticated as {auth['admin']['email']}")

# Get existing collections
existing = {}
collections_data = api("GET", "/api/collections", token=token)
if collections_data:
    for c in collections_data.get("items", []):
        existing[c["name"]] = c["id"]
print(f"✅ Found {len(existing)} existing collections")

# Only create missing collections
needed_collections = [
    "schedules",
    "schedule_logs",
    "teacher_attendance",
    "student_attendance",
    "audit_logs",
]

collections_defs = {
    "schedules": {
        "schema": [
            {"name":"teacher_id","type":"text","required":True},
            {"name":"teacher_name","type":"text"},
            {"name":"date","type":"date","required":True},
            {"name":"start_time","type":"text"},
            {"name":"end_time","type":"text"},
            {"name":"center","type":"text"},
            {"name":"room","type":"text"},
            {"name":"status","type":"select","options":{"values":["scheduled","completed","cancelled","absent","leave"]}},
            {"name":"is_overtime","type":"bool"},
            {"name":"hourly_rate","type":"number"},
            {"name":"total_hours","type":"number"},
            {"name":"schedule_type","type":"select","options":{"values":["regular","extra","substitute","training","meeting"]}},
            {"name":"notes","type":"text"},
            {"name":"class_id","type":"text"},
            {"name":"created_by","type":"text"},
            {"name":"approved_by","type":"text"},
        ]
    },
    "schedule_logs": {
        "schema": [
            {"name":"schedule_id","type":"text"},
            {"name":"action","type":"text"},
            {"name":"user_id","type":"text"},
            {"name":"user_name","type":"text"},
            {"name":"user_role","type":"text"},
            {"name":"details","type":"text"},
            {"name":"old_values","type":"json"},
            {"name":"new_values","type":"json"},
            {"name":"ip_address","type":"text"},
            {"name":"user_agent","type":"text"},
            {"name":"status","type":"text"},
            {"name":"error_message","type":"text"},
        ]
    },
    "teacher_attendance": {
        "schema": [
            {"name":"teacher_id","type":"text","required":True},
            {"name":"teacher_name","type":"text"},
            {"name":"date","type":"date","required":True},
            {"name":"check_in","type":"text"},
            {"name":"check_out","type":"text"},
            {"name":"status","type":"select","options":{"values":["present","absent","late","half-day","leave"]}},
            {"name":"notes","type":"text"},
        ]
    },
    "student_attendance": {
        "schema": [
            {"name":"student_id","type":"text"},
            {"name":"student_name","type":"text"},
            {"name":"date","type":"date","required":True},
            {"name":"check_in","type":"text"},
            {"name":"check_out","type":"text"},
            {"name":"status","type":"select","options":{"values":["present","absent","late","half-day","leave"]}},
            {"name":"notes","type":"text"},
        ]
    },
    "audit_logs": {
        "schema": [
            {"name":"user_id","type":"text"},
            {"name":"user_name","type":"text"},
            {"name":"action","type":"text"},
            {"name":"description","type":"text"},
            {"name":"ip_address","type":"text"},
            {"name":"user_agent","type":"text"},
            {"name":"metadata","type":"json"},
        ]
    },
}

created = 0
for name in needed_collections:
    if name in existing:
        print(f"  ⏭ Already exists: {name}")
        continue
    
    col_def = collections_defs[name]
    data = {
        "name": name,
        "type": "base",
        "schema": col_def["schema"]
    }
    
    result = api("POST", "/api/collections", data, token)
    if result and "name" in result:
        created += 1
        print(f"  ✅ Created: {name}")
    elif result and (result.get("code") == 400 or "already exists" in str(result.get("message",""))):
        print(f"  ⏭ {name}: already exists")
    else:
        print(f"  ❌ Failed: {name} - {result}")

print(f"\n✅ Done! Created {created} new collections. Total: {len(existing) + created}")
