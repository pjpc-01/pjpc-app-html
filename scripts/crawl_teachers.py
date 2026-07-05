#!/usr/bin/env python3
"""Crawl Synorex teachers to extract Card IDs using requests."""
import requests
from bs4 import BeautifulSoup
import json
import re
import time

BASE_URL = "https://pjpc2479.tuitionsys.synorex.work"

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
})

# Step 1: Get login page and extract all form data
print("1. Getting login page...")
r = session.get(f"{BASE_URL}/auth/login")
soup = BeautifulSoup(r.text, 'html.parser')

# Extract all hidden inputs
payload = {}
for hidden in soup.find_all('input', type='hidden'):
    name = hidden.get('name')
    value = hidden.get('value', '')
    if name:
        payload[name] = value
        print(f"   Hidden: {name} = {value[:30]}...")

# Add email and password
payload['email'] = 'ngpop0101.fara@gmail.com'
payload['password'] = '123'

print(f"   Payload keys: {list(payload.keys())}")

# Step 2: Submit login
print("2. Submitting login...")
r = session.post(f"{BASE_URL}/auth/login", data=payload, allow_redirects=True)
print(f"   Status: {r.status_code}, URL: {r.url}")

if 'login' in r.url.lower():
    print("   LOGIN FAILED - checking response...")
    # Check for error messages
    err_soup = BeautifulSoup(r.text, 'html.parser')
    errors = err_soup.find_all(class_=re.compile('error|alert|invalid'))
    for e in errors:
        print(f"   Error: {e.get_text(strip=True)}")
    # Print form
    form = err_soup.find('form')
    if form:
        print(f"   Form action: {form.get('action')}")
        for inp in form.find_all('input'):
            print(f"   Input: {inp.get('name')} = {inp.get('value', '')[:30]}")
    exit(1)

print("3. Login successful!")

# Step 3: Get teacher list (parse page 1 first, then paginate)
all_teachers = []

for page in range(1, 5):
    print(f"   Page {page}...")
    r = session.get(f"{BASE_URL}/teachers/list?page={page}")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Find all teacher edit links
    rows = soup.select('table tbody tr')
    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 7:
            continue
        
        # Name from cell index 1
        name_div = cells[1].find('div', class_='media-body')
        name = name_div.get_text(strip=True) if name_div else ''
        
        # Teacher ID from class link in cell index 6
        class_link = cells[6].find('a')
        tid = ''
        if class_link:
            m = re.search(r'/teachers/edit/(\d+)', class_link.get('href', ''))
            if m:
                tid = m.group(1)
        
        if tid and tid not in [t['teacher_id'] for t in all_teachers]:
            all_teachers.append({'teacher_id': tid, 'name': name})

print(f"\n4. Found {len(all_teachers)} teachers total")

# Step 4: Visit each teacher's edit page
print("5. Extracting Card IDs...")
for i, t in enumerate(all_teachers):
    tid = t['teacher_id']
    r = session.get(f"{BASE_URL}/teachers/edit/{tid}")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    card_id = ''
    
    # Find all disabled inputs - Card ID is a numeric value field near "Join Date"
    all_inputs = soup.find_all('input', disabled=True)
    
    # Strategy: find the field that comes after "Join Date" and has a numeric value
    join_date_found = False
    for inp in all_inputs:
        val = inp.get('value', '').strip()
        if not val:
            continue
        
        # Skip known non-card fields
        parent_text = inp.find_parent('div').get_text(' ', strip=True) if inp.find_parent('div') else ''
        
        # Card ID is typically all digits, 5+ chars, not phone/NRIC
        if (re.match(r'^\d{5,}$', val) and 
            'phone' not in parent_text.lower() and
            'nric' not in parent_text.lower() and
            'name' not in parent_text.lower() and
            'email' not in parent_text.lower()):
            card_id = val
            break
    
    t['card_id'] = card_id
    
    if (i+1) % 5 == 0:
        print(f"   Progress: {i+1}/{len(all_teachers)} (last: {t['name']} -> {card_id or '(none)'})")
    time.sleep(0.3)

# Save
output_path = '/home/pjpc/pjpc-app-html/scripts/synorex_teachers.json'
with open(output_path, 'w') as f:
    json.dump({'total': len(all_teachers), 'teachers': all_teachers}, f, indent=2, ensure_ascii=False)

print(f"\n=== RESULTS ({len(all_teachers)} teachers) ===")
for t in all_teachers:
    print(f"  {t['name']:30s} | Card: {t['card_id'] or '(none)'}")

with_card = sum(1 for t in all_teachers if t['card_id'])
print(f"\nWith Card ID: {with_card}/{len(all_teachers)}")
print(f"Saved to: {output_path}")
