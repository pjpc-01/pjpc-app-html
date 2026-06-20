#!/usr/bin/env python3
"""Export PocketBase collection schemas to JSON file.
Runs on git pre-commit automatically via .git/hooks/pre-commit
"""
import json
import os
import sys
import urllib.request
import urllib.error

PB_URL = "http://127.0.0.1:8090"
OUTPUT = "pb-schema.json"
ADMIN_EMAIL = "final_admin@test.com"
ADMIN_PASS = "final_pass"

def main():
    print("📦 Exporting PocketBase schema...")

    # Check PB alive
    try:
        req = urllib.request.Request(f"{PB_URL}/api/health")
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        print("⚠️  PB not running — skipping schema export")
        return 0

    # Authenticate
    try:
        auth_data = json.dumps({
            "identity": ADMIN_EMAIL,
            "password": ADMIN_PASS
        }).encode()
        req = urllib.request.Request(
            f"{PB_URL}/api/admins/auth-with-password",
            data=auth_data,
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req)
        token = json.loads(resp.read())["token"]
    except Exception as e:
        print(f"⚠️  Auth failed ({e}) — skipping schema export")
        return 0

    # Fetch collections
    try:
        req = urllib.request.Request(
            f"{PB_URL}/api/collections?perPage=100",
            headers={"Authorization": token}
        )
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read())
    except Exception as e:
        print(f"⚠️  Failed to fetch schema ({e})")
        return 0

    # Write to file
    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    count = len(data.get("items", []))
    print(f"✅  Exported {count} collections -> {OUTPUT}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
