#!/usr/bin/env python3
"""Import Synorex NFC card IDs into PJPC PocketBase"""
import json, urllib.request, sys

PB_URL = "http://127.0.0.1:8090"
API_URL = "http://127.0.0.1:3001"

def api_req(method, url, data=None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# 1. Get PB token
auth = api_req("POST", f"{PB_URL}/api/admins/auth-with-password", 
               {"identity": "admin@pjpc.com", "password": "1234567890"})
token = auth["token"]
print(f"✅ PB Auth OK")

# 2. Get all PJPC students
pb_resp = api_req("GET", f"{PB_URL}/api/collections/students/records?perPage=200&fields=id,student_id,name,center")
pb_students = pb_resp.get("items", [])
print(f"✅ PJPC students: {len(pb_students)}")

# 3. Load Synorex data
with open("/home/pjpc/pjpc-app-html/scripts/synorex_students_page1.json") as f:
    synorex = json.load(f)
print(f"✅ Synorex students: {len(synorex)}")

# 4. Match
def name_match(syn_name, pb_name):
    """Check if names match"""
    if not syn_name or not pb_name:
        return False
    # Extract first line (Chinese name)
    cn = syn_name.split("\n")[0].strip().lower()
    en = syn_name.split("\n")[-1].strip().lower() if "\n" in syn_name else ""
    pb = (pb_name or "").lower()
    # Check Chinese name match
    if cn and cn in pb:
        return True
    # Check English name match  
    if en and len(en) > 3 and en in pb:
        return True
    return False

matches = []
no_match = []

for ss in synorex:
    found = None
    for ps in pb_students:
        pname = ps.get("name", ps.get("student_name", ""))
        if name_match(ss["name"], pname):
            found = ps
            break
    if found:
        matches.append({**ss, "pb_id": found["id"], "pb_sid": found.get("student_id", found["id"]),
                       "pb_name": found.get("name", ""), "pb_center": found.get("center", "")})
    else:
        no_match.append(ss)

print(f"\n✅ Matched: {len(matches)}")
print(f"❌ No match: {len(no_match)}")

# 5. Import to PJPC NFC cards
created = 0
skipped = 0
errors = 0

for m in matches:
    card_uid = m["card_id"]
    pb_sid = m["pb_sid"]
    pb_name = m["pb_name"]
    pb_center = m["pb_center"]
    syn_name = m["name"].split("\n")[0]
    
    try:
        # Call PJPC API to create NFC card
        result = api_req("POST", f"{API_URL}/api/nfc-cards", {
            "card_uid": card_uid,
            "studentId": pb_sid,
            "type": "student",
            "notes": f"Synorex import - {syn_name}"
        })
        if result.get("success"):
            created += 1
            if created <= 5:
                print(f"  ✅ {syn_name:15s} → card={card_uid} → {pb_name[:20]}")
        else:
            if "已被注册" in str(result.get("error", "")):
                skipped += 1
            else:
                errors += 1
                print(f"  ❌ {syn_name}: {result.get('error')}")
    except Exception as e:
        errors += 1
        if errors <= 3:
            print(f"  ⚠️ {syn_name}: {e}")

print(f"\n📊 Import results:")
print(f"  Created: {created}")
print(f"  Skipped (already exists): {skipped}")
print(f"  Errors: {errors}")
print(f"  No match in PJPC: {len(no_match)}")

if no_match:
    print(f"\nUnmatched students (need manual mapping):")
    for nm in no_match[:15]:
        print(f"  {nm['name'].split(chr(10))[0]:25s} card={nm['card_id']}")

# 6. Verify
check = api_req("GET", f"{PB_URL}/api/collections/nfc_cards/records?perPage=5&sort=-created")
print(f"\n✅ Total NFC cards in system: {check.get('totalItems', '?')}")
for card in (check.get("items", []) or [])[:3]:
    print(f"  {card['card_uid']:15s} type={card.get('type','?')} status={card.get('status','?')}")
