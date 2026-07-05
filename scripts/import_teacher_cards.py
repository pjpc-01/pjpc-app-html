#!/usr/bin/env python3
"""Import Synorex teacher Card IDs into PJPC nfc_cards."""
import json
import urllib.request

PB_URL = "http://127.0.0.1:8090"

def api_req(method, url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# 1. Auth
auth = api_req("POST", f"{PB_URL}/api/admins/auth-with-password", 
               {"identity": "admin@pjpc.com", "password": "1234567890"})
token = auth["token"]
print("✅ PB Auth OK")

# 2. Get PJPC teachers
pb_resp = api_req("GET", f"{PB_URL}/api/collections/teachers/records?perPage=200", token=token)
pb_teachers = pb_resp.get("items", [])
print(f"✅ PJPC teachers: {len(pb_teachers)}")

# 3. Load Synorex teacher data
with open("/home/pjpc/pjpc-app-html/scripts/synorex_teachers.json") as f:
    synorex_data = json.load(f)
synorex_teachers = [t for t in synorex_data["teachers"] if t["card_id"]]
print(f"✅ Synorex teachers with Card ID: {len(synorex_teachers)}")

# 4. Match by name
def name_score(syn_name, pb_name):
    """Fuzzy name match score. Prioritizes exact match."""
    syn = syn_name.lower().strip()
    pb = (pb_name or "").lower().strip()
    if syn == pb:
        return 100
    # Word-level: all words must match
    syn_words = set(syn.split())
    pb_words = set(pb.split())
    if syn_words == pb_words:
        return 95
    if syn_words.issubset(pb_words):
        return 85
    if pb_words.issubset(syn_words):
        return 75
    common = syn_words & pb_words
    if len(common) >= 2 and len(common) >= min(len(syn_words), len(pb_words)) * 0.7:
        return 50
    return 0

matches = []
no_match = []

for st in synorex_teachers:
    best_score = 0
    best_match = None
    for pt in pb_teachers:
        pname = pt.get("name", pt.get("teacher_name", ""))
        score = name_score(st["name"], pname)
        if score > best_score:
            best_score = score
            best_match = pt
    
    if best_score >= 50:
        matches.append({**st, "pb_id": best_match["id"], "pb_name": best_match.get("name", ""), "score": best_score})
    else:
        no_match.append(st)

print(f"\n✅ Matched: {len(matches)}")
print(f"❌ No match: {len(no_match)}")

# 5. Import cards
# First check existing
existing = api_req("GET", f"{PB_URL}/api/collections/nfc_cards/records?perPage=500&fields=card_uid", token=token)
existing_uids = {r["card_uid"] for r in existing.get("items", [])}

created = 0
skipped = 0
errors = 0

for m in matches:
    card_uid = m["card_id"]
    teacher_id = m["pb_id"]
    
    if card_uid in existing_uids:
        skipped += 1
        continue
    
    try:
        result = api_req("POST", f"{PB_URL}/api/collections/nfc_cards/records", {
            "card_uid": card_uid,
            "teacherId": teacher_id,
            "type": "teacher",
            "status": "active",
            "notes": f"Synorex import - {m['name']}"
        }, token=token)
        created += 1
        if created <= 10:
            print(f"  ✅ {m['name']:30s} → {card_uid} → teacher {teacher_id[:8]}...")
    except Exception as e:
        errors += 1
        err_str = str(e)
        if errors <= 3:
            print(f"  ❌ {m['name']}: {err_str[:80]}")

print(f"\n📊 Results:")
print(f"  Created: {created}")
print(f"  Skipped (exists): {skipped}")
print(f"  Errors: {errors}")
print(f"  No match: {len(no_match)}")

if no_match:
    print(f"\n⚠️ Teachers without PJPC match:")
    for nm in no_match:
        print(f"  {nm['name']:30s} card={nm['card_id']}")

# Verify
check = api_req("GET", f"{PB_URL}/api/collections/nfc_cards/records?perPage=5&sort=-created&filter=(type='teacher')", token=token)
print(f"\n✅ Teacher NFC cards in system: {check.get('totalItems', '?')}")
for card in (check.get("items", []) or [])[:3]:
    print(f"  {card['card_uid']:15s} type={card.get('type','?')}")
