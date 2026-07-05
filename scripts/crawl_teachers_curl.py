#!/usr/bin/env python3
"""Crawl teacher Card IDs using curl with netscape cookie file."""
import subprocess, re, json, time, sys

COOKIE_FILE = "/tmp/syn_cookies_new.txt"
BASE = "https://pjpc2479.tuitionsys.synorex.work"

# Load teacher IDs
with open("/home/pjpc/pjpc-app-html/scripts/teacher_ids.json") as f:
    teacher_ids = json.load(f)

def curl(url):
    """Fetch URL with cookies, return HTML."""
    result = subprocess.run(
        ["curl", "-s", "-b", COOKIE_FILE, "-c", COOKIE_FILE, "-L", url],
        capture_output=True, text=True, timeout=15
    )
    return result.stdout

# Check if logged in
html = curl(f"{BASE}/teachers/list")
if "All Teachers" not in html:
    print("ERROR: Not logged in. Please login via browser first.")
    print("Run: curl -c /tmp/syn_cookies_new.txt ... to login")
    sys.exit(1)

print("Logged in OK. Starting crawl...")

results = []
for i, tid in enumerate(teacher_ids):
    url = f"{BASE}/teachers/edit/{tid}"
    html = curl(url)
    
    # Extract name from Full Name field
    name_match = re.search(r'Full Name.*?value="([^"]+)"', html, re.DOTALL)
    name = name_match.group(1) if name_match else ""
    
    # Extract Card ID - it's a disabled input after "Join Date", numeric 5+ digits
    # Pattern: Join Date ... <input ... value="(\d{5,})" ... disabled
    card_match = re.search(r'Join Date.*?value="(\d{5,})"', html, re.DOTALL)
    card_id = card_match.group(1) if card_match else ""
    
    results.append({"teacher_id": tid, "name": name, "card_id": card_id})
    print(f"[{i+1}/36] {name:30s} → {card_id or '(none)'}")
    time.sleep(0.5)

# Save
output_path = '/home/pjpc/pjpc-app-html/scripts/synorex_teachers.json'
with open(output_path, 'w') as f:
    json.dump({"total": len(results), "teachers": results}, f, indent=2, ensure_ascii=False)

with_card = sum(1 for r in results if r['card_id'])
print(f"\nDone! {with_card}/{len(results)} teachers have Card ID")
print(f"Saved: {output_path}")
