#!/usr/bin/env python3
"""Crawl all Synorex teacher card IDs - v3 with precise Card ID extraction."""
import asyncio
import json
import re
from playwright.async_api import async_playwright

BASE = "https://pjpc2479.tuitionsys.synorex.work"
OUTPUT = "/home/pjpc/pjpc-app-html/scripts/synorex_teachers.json"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Login
        print("Logging in...")
        await page.goto(f"{BASE}/auth/login")
        await page.fill('input[placeholder="Email"]', "ngpop0101.fara@gmail.com")
        await page.fill('input[placeholder="Password"]', "123")
        await page.click('button:has-text("Login")')
        await page.wait_for_timeout(3000)
        
        # Get teacher IDs via DataTable
        await page.goto(f"{BASE}/teachers/list")
        await page.wait_for_timeout(2000)
        teacher_ids = await page.evaluate("""
            () => {
                const table = $('#customDTable').DataTable();
                return table.rows().data().toArray().map(row => {
                    const m = row['class(s)'].match(/\\/teachers\\/edit\\/(\\d+)/);
                    return m ? m[1] : '';
                }).filter(id => id);
            }
        """)
        print(f"Found {len(teacher_ids)} teachers")
        
        # First, debug: let's test on WONG CHOW MEI
        await page.goto(f"{BASE}/teachers/edit/33519283907")
        await page.wait_for_timeout(500)
        
        # Debug: print all disabled input values with context
        debug = await page.evaluate("""
            () => {
                const inputs = [...document.querySelectorAll('input[disabled]')];
                return inputs.map((inp, i) => {
                    let label = '';
                    let parent = inp.parentElement;
                    for (let j = 0; j < 5 && parent; j++) {
                        const labels = parent.querySelectorAll('label, .LabelText');
                        for (const l of labels) {
                            const t = l.textContent.trim();
                            if (t && t.length < 30) label = t;
                        }
                        parent = parent.parentElement;
                    }
                    return {idx: i, value: inp.value, label};
                });
            }
        """)
        
        print("\n=== DEBUG: WONG CHOW MEI fields ===")
        for d in debug:
            if d['value']:
                print(f"  [{d['idx']}] label='{d['label']}' value='{d['value']}'")
        
        # Now I know the pattern. The Card ID field has no label but is 
        # positioned after "Join Date" and before the "Save" button
        # Its value format: 10 digits starting with "000"
        
        results = []
        for i, tid in enumerate(teacher_ids):
            await page.goto(f"{BASE}/teachers/edit/{tid}")
            await page.wait_for_timeout(400)
            
            name = ""
            try:
                name = await page.locator('input[disabled][required]').first.input_value()
            except:
                pass
            
            # Card ID extraction - specific pattern:
            # Find all disabled inputs, skip ones with known labels,
            # skip phone/NRIC format values, pick the one after Join Date
            card_id = await page.evaluate("""
                () => {
                    const inputs = [...document.querySelectorAll('input[disabled]')];
                    
                    // Known labels to skip
                    const skipLabels = ['Full Name', 'Nickname', 'NRIC', 'Birthday', 
                                        'Phone', 'Primary', 'Email', 'Address', 'Join Date'];
                    
                    // First pass: tag each input with its context
                    const tagged = inputs.map((inp, i) => {
                        // Find the nearest label or form-group label
                        let label = '';
                        let el = inp;
                        for (let j = 0; j < 6; j++) {
                            if (!el) break;
                            // Check for label
                            const lbl = el.querySelector('label, .LabelText, [class*="label"]');
                            if (lbl) {
                                const t = lbl.textContent.trim();
                                if (t && t.length < 30) { label = t; break; }
                            }
                            // Check previous sibling for label
                            const prev = el.previousElementSibling;
                            if (prev) {
                                const lt = prev.textContent.trim();
                                if (lt && lt.length < 25 && !lt.match(/^\\d/)) {
                                    label = lt;
                                }
                            }
                            el = el.parentElement;
                        }
                        return {idx: i, value: inp.value.trim(), label};
                    });
                    
                    // Find "Join Date" index
                    let joinIdx = tagged.findIndex(t => t.label === 'Join Date');
                    
                    // Card ID should be the NEXT input AFTER join date that has a numeric value
                    // and whose label is NOT in skipLabels
                    if (joinIdx >= 0) {
                        for (let k = joinIdx + 1; k < tagged.length; k++) {
                            const v = tagged[k].value;
                            if (v && /^\\d{5,}$/.test(v) && 
                                !skipLabels.includes(tagged[k].label)) {
                                return v;
                            }
                        }
                    }
                    
                    return '';
                }
            """)
            
            results.append({"teacher_id": tid, "name": name, "card_id": card_id or ""})
            if (i+1) % 5 == 0:
                print(f"  [{i+1}/{len(teacher_ids)}] {name}: {card_id or '(none)'}")
        
        with open(OUTPUT, 'w') as f:
            json.dump({"total": len(results), "teachers": results}, f, indent=2, ensure_ascii=False)
        
        with_card = sum(1 for r in results if r['card_id'])
        print(f"\n✅ {with_card}/{len(results)} have Card ID")
        await browser.close()

asyncio.run(main())
