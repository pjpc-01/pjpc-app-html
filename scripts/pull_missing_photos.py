#!/usr/bin/env python3
"""Pull missing photos - fixed approach with cookie-based download."""
import asyncio, json, requests, io, base64
from playwright.async_api import async_playwright

BASE = "https://pjpc2479.tuitionsys.synorex.work"
PB = "http://127.0.0.1:8090"
PB_AUTH = ("admin@pjpc.com", "1234567890")

async def main():
    # Get PB students
    resp = requests.get(f"{PB}/api/collections/students/records?perPage=500&filter=(status='active')",
                        auth=PB_AUTH)
    pb_all = resp.json()["items"]
    no_avatar = [s for s in pb_all if not s.get("avatar")]
    print(f"PB students without avatar: {len(no_avatar)}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Login Synorex...")
        await page.goto(BASE + "/auth/login")
        await page.wait_for_timeout(2000)
        await page.fill("input[placeholder='Email']", "ngpop0101.fara@gmail.com")
        await page.fill("input[placeholder='Password']", "123")
        await page.click("button:has-text('Login')")
        await page.wait_for_timeout(4000)
        
        # Get cookies for Python requests
        cookies = await page.context.cookies()
        cookie_dict = {c["name"]: c["value"] for c in cookies}
        
        # Get Synorex student list with photo URLs
        all_syn = []
        for pg_url in [BASE + "/students/list2", None]:
            if pg_url:
                await page.goto(pg_url)
            else:
                await page.click(".pagination a:has-text('2')")
            await page.wait_for_timeout(2000)
            
            data = await page.evaluate("""
                () => {
                    const rows = [];
                    document.querySelectorAll("#list2Table tbody tr").forEach(tr => {
                        const cb = tr.querySelector(".list2-check");
                        const name = tr.querySelector(".media-body div:first-child")?.textContent.trim() || '';
                        const eng = tr.querySelector(".media-body div:last-child")?.textContent.trim() || '';
                        const img = tr.querySelector("td img.rounded-circle");
                        rows.push({
                            name, eng,
                            photo_url: img ? img.src : null
                        });
                    });
                    return rows;
                }
            """)
            all_syn.extend(data)
        
        print(f"Synorex students: {len(all_syn)}")
        with_photo = [s for s in all_syn if s["photo_url"]]
        print(f"With photo: {len(with_photo)}")
        
        # Match and download
        import re
        updated = 0
        for pb_s in no_avatar:
            pb_name = pb_s["name"].lower()
            pb_name_parts = set(pb_name.replace("(", "").replace(")", "").split())
            
            # Find matching Synorex entry
            syn_match = None
            for syn in with_photo:
                syn_name = (syn["name"] + " " + syn["eng"]).lower()
                syn_parts = set(syn_name.split())
                if len(pb_name_parts & syn_parts) >= 2:
                    syn_match = syn
                    break
            
            if not syn_match:
                # Try broader match
                for syn in with_photo:
                    if any(part in (syn["name"] + " " + syn["eng"]).lower() for part in pb_name_parts if len(part) > 3):
                        syn_match = syn
                        break
            
            if not syn_match:
                print(f"  {pb_s['name'][:30]:30s} — no Synorex photo")
                continue
            
            # Download via Python (not browser) to avoid CORS
            try:
                img_resp = requests.get(syn_match["photo_url"], cookies=cookie_dict, timeout=10)
                if img_resp.status_code != 200:
                    print(f"  {pb_s['name'][:30]:30s} — download failed ({img_resp.status_code})")
                    continue
                
                img_bytes = img_resp.content
                if len(img_bytes) < 100:
                    print(f"  {pb_s['name'][:30]:30s} — too small ({len(img_bytes)}B)")
                    continue
                
                # Upload to PB
                files = {"avatar": ("photo.jpg", io.BytesIO(img_bytes), "image/jpeg")}
                up = requests.patch(
                    f"{PB}/api/collections/students/records/{pb_s['id']}",
                    files=files,
                    auth=PB_AUTH
                )
                
                if up.status_code == 200:
                    updated += 1
                    print(f"  ✓ {pb_s['name'][:30]:30s} ({len(img_bytes)//1024}KB)")
                elif "file_size_limit" in up.text:
                    print(f"  {pb_s['name'][:30]:30s} — file too large ({len(img_bytes)//1024}KB)")
                else:
                    print(f"  ✗ {pb_s['name'][:30]:30s} — {up.status_code} {up.text[:80]}")
                    
            except Exception as e:
                print(f"  ✗ {pb_s['name'][:30]:30s} — {str(e)[:50]}")
        
        print(f"\nUpdated: {updated}/{len(no_avatar)}")
        await browser.close()

asyncio.run(main())
