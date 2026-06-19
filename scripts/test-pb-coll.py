#!/usr/bin/env python3
"""Test creating a PB collection"""
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
        print(f"ERROR {e.code}: {json.dumps(err, indent=2)}")
        return None

auth = api("POST", "/api/admins/auth-with-password",
           {"identity": "final_admin@test.com", "password": "final_pass"})
token = auth["token"]
print(f"Token: {token[:20]}...")

# Try simple create
result = api("POST", "/api/collections", {
    "name": "test_coll",
    "type": "base",
    "schema": [{"name": "test_field", "type": "text"}]
}, token)
print(f"Result: {json.dumps(result, indent=2)[:200] if result else 'None'}")
