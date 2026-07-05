#!/usr/bin/env python3
"""Sync NFC card numbers to teacher/student profiles."""
import json, urllib.request

PB_URL = "http://127.0.0.1:8090"

def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{PB_URL}{path}", data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Auth
auth = api("POST", "/api/admins/auth-with-password",
           {"identity": "admin@pjpc.com", "password": "1234567890"})
token = auth["token"]
print("✅ Auth OK")

# Get all nfc_cards
cards_resp = api("GET", "/api/collections/nfc_cards/records?perPage=500", token=token)
cards = cards_resp["items"]
print(f"📇 {len(cards)} NFC cards total")

teacher_cards = [c for c in cards if c.get("teacherId") and c.get("type") == "teacher"]
student_cards = [c for c in cards if c.get("studentId") and c.get("type") == "student"]
print(f"  Teacher cards: {len(teacher_cards)}")
print(f"  Student cards: {len(student_cards)}")

# Sync teacher cardNumbers
updated_teachers = 0
for card in teacher_cards:
    tid = card.get("teacherId")
    card_uid = card.get("card_uid")
    if not tid or not card_uid:
        continue
    try:
        api("PATCH", f"/api/collections/teachers/records/{tid}",
            {"cardNumber": card_uid}, token=token)
        updated_teachers += 1
    except Exception as e:
        print(f"  ❌ Teacher {tid[:8]}...: {e}")

print(f"✅ Updated {updated_teachers} teachers with cardNumber")

# Sync student cardNumbers  
updated_students = 0
for card in student_cards:
    sid = card.get("studentId")
    card_uid = card.get("card_uid")
    if not sid or not card_uid:
        continue
    try:
        api("PATCH", f"/api/collections/students/records/{sid}",
            {"cardNumber": card_uid}, token=token)
        updated_students += 1
    except Exception as e:
        print(f"  ❌ Student {sid[:8]}...: {e}")

print(f"✅ Updated {updated_students} students with cardNumber")

# Verify
teachers_check = api("GET", "/api/collections/teachers/records?perPage=3&sort=-updated", token=token)
print(f"\n📋 Teacher cardNumber samples:")
for t in teachers_check["items"]:
    cn = t.get("cardNumber", "")
    print(f"  {t['name']:30s} cardNumber={'✅ '+cn if cn else '❌ none'}")

students_check = api("GET", "/api/collections/students/records?perPage=3&sort=-updated", token=token)
print(f"\n📋 Student cardNumber samples:")
for s in students_check["items"]:
    cn = s.get("cardNumber", "")
    print(f"  {s['name']:30s} cardNumber={'✅ '+cn if cn else '❌ none'}")
