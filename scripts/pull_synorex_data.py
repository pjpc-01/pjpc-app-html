#!/usr/bin/env python3
"""Pull missing student data from Synorex edit pages."""
import asyncio, json, re, requests
from playwright.async_api import async_playwright

BASE = "https://pjpc2479.tuitionsys.synorex.work"
PB = "http://127.0.0.1:8090"
PB_AUTH = ("admin@pjpc.com", "1234567890")

def get_pb_students():
    """Get all active students that need data."""
    resp = requests.get(
        f"{PB}/api/collections/students/records?perPage=500&filter=(status!='graduated'%26%26status!='deleted')",
        auth=PB_AUTH
    )
    return resp.json()["items"]

def update_pb(pb_id, data):
    """Update PB student record."""
    resp = requests.patch(
        f"{PB}/api/collections/students/records/{pb_id}",
        json=data,
        auth=PB_AUTH
    )
    return resp.status_code == 200

async def get_synorex_ids(page):
    """Get mapping of Synorex internal ID -> name and student_code."""
    await page.goto(BASE + "/students/list2")
    await page.wait_for_timeout(3000)
    
    return await page.evaluate("""
        () => {
            const rows = [];
            document.querySelectorAll("#list2Table tbody tr").forEach(tr => {
                const cb = tr.querySelector(".list2-check");
                const nameDiv = tr.querySelector(".media-body div:first-child");
                const codeTd = tr.querySelector("td:nth-child(3)"); // might be code
                if (cb && nameDiv) {
                    const id = cb.value;
                    const name = nameDiv.textContent.trim();
                    // Find student code - look for pattern like B10, T2, G3 etc
                    const rowText = tr.textContent;
                    const codeMatch = rowText.match(/\\b([BGT]\\d+)\\b/i);
                    const code = codeMatch ? codeMatch[1].toUpperCase() : '';
                    rows.push({syn_id: id, name, code});
                }
            });
            return rows;
        }
    """)

async def scrape_edit_page(page, syn_id):
    """Scrape student data from edit page."""
    await page.goto(BASE + f"/students/edit/{syn_id}")
    await page.wait_for_timeout(4000)
    
    data = await page.evaluate("""
        () => {
            const result = {};
            document.querySelectorAll('.form-group, .mb-3, .row, .col, [class*=col]').forEach(group => {
                const label = group.querySelector('label')?.textContent?.trim();
                const input = group.querySelector('input:not([type=checkbox]):not([type=radio]), textarea, select');
                if (label && input?.value) {
                    result[label] = input.value;
                }
            });
            return result;
        }
    """)
    return data

async def main():
    # Load PB students needing data
    pb_students = get_pb_students()
    print(f"Loaded {len(pb_students)} PB students")
    
    # Build name -> PB record mapping
    pb_by_name = {}
    for s in pb_students:
        name = s["name"].lower().replace("(", "").replace(")", "")
        pb_by_name[name] = s
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Login to Synorex...")
        await page.goto(BASE + "/auth/login")
        await page.wait_for_timeout(2000)
        await page.fill("input[placeholder='Email']", "ngpop0101.fara@gmail.com")
        await page.fill("input[placeholder='Password']", "123")
        await page.click("button:has-text('Login')")
        await page.wait_for_timeout(4000)
        
        syn_rows = await get_synorex_ids(page)
        print(f"Found {len(syn_rows)} students in Synorex")
        
        # Match Synorex rows to PB students
        updated = 0
        for syn in syn_rows:
            syn_name = syn["name"].lower().strip()
            syn_code = syn.get("code", "").upper()
            
            # Try match by exact name first
            pb_match = pb_by_name.get(syn_name)
            if not pb_match:
                # Try partial name match
                for pb_name, pb_s in pb_by_name.items():
                    if syn_name in pb_name or pb_name in syn_name:
                        pb_match = pb_s
                        break
            
            # Also try matching by student code
            if not pb_match and syn_code:
                for pb_s in pb_students:
                    if pb_s.get("student_id", "").upper() == syn_code:
                        pb_match = pb_s
                        break
            
            if not pb_match:
                continue
            
            s = pb_match
            # Check what's missing
            missing = []
            field_map = {
                "Phone": "fatherPhone",
                "Phone 2": "motherPhone", 
                "Email": "email",
                "Address": "address",
                "NRIC / Birth Cert No.": "nric",
                "Birthday": "dob",
                "Gender": "gender",
                "School": "school",
            }
            
            # Only scrape if missing critical fields
            need_scrape = False
            for form_label, pb_field in field_map.items():
                if not s.get(pb_field):
                    need_scrape = True
                    break
            
            if not need_scrape:
                continue
            
            # Scrape edit page
            print(f"\n  Scraping: {s['name'][:30]} ({s.get('student_id','?')})")
            form_data = await scrape_edit_page(page, syn["syn_id"])
            
            update_data = {}
            for form_label, pb_field in field_map.items():
                if pb_field in ["fatherName", "motherName", "fatherPhone", "motherPhone"]:
                    continue  # Can't get from edit page
                val = form_data.get(form_label)
                if val and not s.get(pb_field):
                    if pb_field == "dob" and val:
                        # Normalize date
                        val = val.replace("/", "-")
                    if pb_field == "gender":
                        val = "male" if val.lower() in ["male", "男"] else "female"
                    update_data[pb_field] = val
            
            # Parent info - try scraping from the page differently
            parent_divs = await page.evaluate("""
                () => {
                    const text = document.body.innerText;
                    const result = {};
                    // Look for parent names in the profile section
                    const lines = text.split('\\n');
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.startsWith('Parent:') || line.startsWith('Parent 2:')) {
                            const name = line.replace(/Parent[s]?\\s*\\d*:\\s*/, '').trim();
                            if (name && !name.match(/^\\d+$/)) {
                                if (line.includes('Parent 2')) result.motherName = name;
                                else result.fatherName = name;
                            }
                        }
                    }
                    return result;
                }
            """)
            
            for k, v in parent_divs.items():
                if v and not s.get(k):
                    update_data[k] = v
            
            if update_data:
                print(f"    Updating: {json.dumps(update_data, ensure_ascii=False)}")
                if update_pb(s["id"], update_data):
                    updated += 1
                    print(f"    ✓ OK")
                    # Update local copy
                    for k, v in update_data.items():
                        s[k] = v
                else:
                    print(f"    ✗ Failed")
            else:
                print(f"    No new data found")
        
        print(f"\n=== Updated {updated} students ===")
        await browser.close()

asyncio.run(main())
