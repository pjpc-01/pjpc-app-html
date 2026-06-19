#!/usr/bin/env python3
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
        print(f"  {e.code}: {err.get('message','')[:100]}")
        return None

auth = api("POST", "/api/admins/auth-with-password",
           {"identity": "final_admin@test.com", "password": "final_pass"})
token = auth["token"]

# Test json type
result = api("POST", "/api/collections", {
    "name": "test_json",
    "type": "base",
    "schema": [{"name": "data", "type": "json"}]
}, token)
print(json.dumps(result, indent=2)[:300] if result else "None")

# Clean up
if result and "id" in result:
    api("DELETE", f"/api/collections/{result['id']}", token)
