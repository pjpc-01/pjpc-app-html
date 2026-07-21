#!/usr/bin/env python3
"""Pull student photos from Synorex and upload to PocketBase."""
import asyncio, json, os, io, time
import requests
from playwright.async_api import async_playwright

BASE = "https://pjpc2479.tuitionsys.synorex.work"
PB = "http://127.0.0.1:8090"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("1. Login...")
        await page.goto(BASE + "/auth/login")
        await page.wait_for_timeout(2000)
        await page.fill("input[placeholder='Email']", "ngpop0101.fara@gmail.com")
        await page.fill("input[placeholder='Password']", "123")
        await page.click("button:has-text('Login')")
        await page.wait_for_timeout(4000)
        print(f"   URL: {page.url[:60]}")

        print("2. Getting student IDs...")
        await page.goto(BASE + "/students/list2")
        await page.wait_for_timeout(3000)

        result = await page.evaluate("""
            () => {
                const dt = jQuery("#list2Table").DataTable();
                const data = dt.rows().data().toArray();
                return data.map(r => {
                    const parts = [];
                    for (const v of Object.values(r)) {
                        if (typeof v === "string") parts.push(v);
                    }
                    const all = parts.join(" ");
                    const cm = all.match(/value="(\d+)"/);
                    if (cm) return cm[1];
                    const em = all.match(/\/students\/edit\/(\d+)/);
                    if (em) return em[1];
                    return "";
                }).filter(Boolean);
            }
        """)
        student_ids = list(dict.fromkeys(result))
        print(f"   {len(student_ids)} students")

        # PB auth
        r = requests.post(PB + "/api/collections/_superusers/auth-with-password",
                         json={"identity":"admin@pjpc.com","password":"1234567890"},
                         headers={"Content-Type":"application/json"})
        pb_token = r.json()["token"]
        pb_h = {"Authorization": pb_token}

        r = requests.get(PB + "/api/collections/students/records?perPage=500", headers=pb_h)
        pb_list = r.json()["items"]
        pb_by_name = {}
        for s in pb_list:
            n = (s.get("student_name") or s.get("name") or "").lower().strip()
            if n: pb_by_name[n] = s

        os.makedirs("/tmp/student_photos", exist_ok=True)
        downloaded = 0

        for i, sid in enumerate(student_ids):
            await page.goto(BASE + "/students/edit/" + sid)
            await page.wait_for_timeout(500)

            info = await page.evaluate("""
                () => {
                    // Find student photo - look for img with uploads/data/ in src
                    let photo = '';
                    for (const img of document.querySelectorAll('img')) {
                        const src = img.src || '';
                        if (src.includes('/uploads/data/') && !src.includes('blank')) {
                            photo = src; break;
                        }
                    }
                    // If not found, try any non-icon image > 50px
                    if (!photo) {
                        for (const img of document.querySelectorAll('img')) {
                            const src = img.src || '';
                            const r = img.getBoundingClientRect();
                            if (src && r.width > 50 && r.height > 50 &&
                                !src.includes('logo') && !src.includes('icon') &&
                                !src.includes('favicon') && !src.includes('blank') &&
                                !src.includes('avatar.svg')) {
                                photo = src; break;
                            }
                        }
                    }
                    // Name from input or title
                    let name = '';
                    const enInp = document.querySelector('input[name="fullname_en"]');
                    if (enInp) name = enInp.value;
                    if (!name) {
                        const cnInp = document.querySelector('input[name="fullname_cn"]');
                        if (cnInp) name = cnInp.value;
                    }
                    if (!name) {
                        // Extract from title: "Edit Student - Name - Synorex"
                        const m = document.title.match(/Edit Student - (.+?) -/);
                        if (m) name = m[1];
                    }
                    return {photo, name};
                }
            """)

            name = info.get("name", "").strip()
            photo_url = info.get("photo", "").strip()

            if not photo_url:
                continue

            # Download via Python requests (no CORS)
            try:
                img_r = requests.get(photo_url, headers={"User-Agent":"Mozilla/5.0"}, timeout=10,
                                    cookies={c["name"]: c["value"] for c in await page.context.cookies()})
                if img_r.status_code != 200:
                    continue
                img_bytes = img_r.content

                # Match name to PB student
                nlow = name.lower()
                matched = None
                for pn, ps in pb_by_name.items():
                    if nlow and (nlow in pn or pn in nlow):
                        matched = ps; break

                ext = photo_url.rsplit(".",1)[1].split("?")[0] if "." in photo_url else "jpg"
                if ext not in ("jpg","jpeg","png","gif","webp"): ext = "jpg"

                if matched:
                    files = {"avatar": (f"{sid}.{ext}", io.BytesIO(img_bytes), f"image/{ext}")}
                    ur = requests.patch(
                        PB + "/api/collections/students/records/" + matched["id"],
                        files=files, headers={"Authorization":pb_token}
                    )
                    ok = "OK" if ur.ok else f"E{ur.status_code}"
                    print(f"[{i+1:3d}/{len(student_ids)}] {name[:35]:35s} -> PB:{matched.get('student_name','?')[:25]} | {ok}")
                else:
                    print(f"[{i+1:3d}/{len(student_ids)}] {name[:35]:35s} -> NO MATCH")

                downloaded += 1
            except Exception as e:
                print(f"[{i+1:3d}/{len(student_ids)}] {name[:35]:35s} | ERR: {e}")

        print(f"\nDone: {downloaded} photos uploaded to PocketBase")
        await browser.close()

asyncio.run(main())
