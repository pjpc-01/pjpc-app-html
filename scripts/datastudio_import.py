"""DataStudio grade scraper v4 — robust name detection, one browser per student"""
import asyncio, json, sys, subprocess, urllib.parse, re

PB_URL = "http://127.0.0.1:8090"
GRADES_API = "http://127.0.0.1:3001/api/grades"
DS_URL = "https://datastudio.google.com/u/0/reporting/5755410c-43ab-4d79-afa7-a770c11eef2a/page/bEQqD"

SUBJECT_MAP = {
    "BAHASA MELAYU": "国文", "BAHASA INGGERIS": "英文", "SAINS": "科学",
    "MATEMATIK": "数学", "SEJARAH": "历史", "GEOGRAFI": "地理",
    "PENDIDIKAN ISLAM": "伊斯兰教育", "PENDIDIKAN MORAL": "道德",
    "ASAS SAINS KOMPUTER": "电脑", "REKA BENTUK DAN TEKNOLOGI": "RBT",
    "PENDIDIKAN SENI VISUAL": "美术", "PENDIDIKAN JASMANI & KESIHATAN": "体育",
    "BAHASA ARAB": "阿拉伯文", "BAHASA CINA": "华文", "BAHASA TAMIL": "淡米尔文",
}

def gl(s): return "A" if s>=80 else "B" if s>=70 else "C" if s>=60 else "D" if s>=50 else "F"

def parse(text):
    lines = [l.strip() for l in text.split('\n')]
    # Name: find NO.KAD, then next ALL-UPPERCASE non-digit line after TINGKATAN
    name = ""
    in_header = False
    for l in lines:
        if "TINGKATAN" in l and any(c.isdigit() for c in l):
            in_header = True; continue
        if in_header and l and l.upper() == l and not l[0].isdigit() and l != "NO.KAD PENGENALAN" and "SLIP" not in l and "TINGKATAN" not in l and "masukkan" not in l.lower():
            name = l; break
    if not name: return None

    # Form: line with "TINGKATAN" header then next content
    form = ""
    for i, l in enumerate(lines):
        if "TINGKATAN" in l.upper() and i+1 < len(lines):
            for j in range(i+1, min(i+3, len(lines))):
                nxt = lines[j].strip(": ").strip()
                if nxt and nxt not in ("-", ":", "No data", ""): form = nxt; break; break

    # Subjects
    subjects = []
    i = 0
    while i < len(lines):
        m = re.match(r'^(\d{1,2})\.\s+(.+)', lines[i])
        if m:
            sn = m.group(2).strip()
            scores = []
            j = i + 1
            while j < len(lines) and j < i+8:
                nxt = lines[j]
                if nxt.isdigit(): scores.append(int(nxt))
                elif nxt in "ABCDEF": pass  # grade letter
                elif re.match(r'^\d{1,2}\.\s+', nxt): break  # next subject
                elif any(k in nxt for k in ("RUMUSAN","JUMLAH","PURATA","ANALISIS")): break
                elif nxt and nxt != "-" and not nxt.isdigit(): break
                j += 1
            valid = [s for s in scores if s is not None]
            if valid: subjects.append({"name": sn, "score": max(valid)})
        i += 1

    return {"name": name, "form": form, "subjects": subjects}


async def scrape_one(p, ic):
    browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
    try:
        ctx = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await ctx.new_page()
        await page.goto(DS_URL, wait_until='domcontentloaded', timeout=30000)
        await asyncio.sleep(5)
        icf = await page.query_selector('input')
        if icf:
            await icf.click()
            await icf.fill(ic)
            await page.keyboard.press('Enter')
            await asyncio.sleep(7)
        text = await page.evaluate("() => document.body.innerText")
        await browser.close()
        return parse(text)
    except Exception as e:
        print(f"    ❌ {e}", file=sys.stderr)
        try: await browser.close()
        except: pass
        return None


def save(sid, subj, score, letter):
    p = {"studentId": sid, "subject": subj, "term": "Term 1", "year": 2026, "score": score, "grade_letter": letter}
    r = subprocess.run(['curl', '-s', '-X', 'POST', GRADES_API, '-H', 'Content-Type: application/json', '-d', json.dumps(p)], capture_output=True, text=True)
    try: return json.loads(r.stdout).get('success', False)
    except: return False


async def main(center_filter=""):
    from playwright.async_api import async_playwright

    sf = 'status="active"'
    if center_filter:
        sf += f' && center="{urllib.parse.quote(center_filter)}"'
    u = f"{PB_URL}/api/collections/students/records?perPage=500&fields=id,nric,name,grade,center&filter={urllib.parse.quote(sf)}"
    r = subprocess.run(['curl', '-s', u], capture_output=True, text=True)
    students = json.loads(r.stdout).get('items', [])
    targets = [(s['id'], s['nric'].strip().replace('-', ''), s.get('name', '')) for s in students if s.get('nric') and s['nric'].strip()]
    if not targets:
        print(json.dumps({"success": False, "message": "no students with NRIC"}))
        return

    print(f"📊 {len(targets)} students ({center_filter or 'all'})", file=sys.stderr)
    results = []
    ok = 0

    async with async_playwright() as p:
        for sid, ic, name in targets:
            print(f"  {name} {ic}", file=sys.stderr)
            data = await scrape_one(p, ic)
            if not data or not data.get('subjects'):
                results.append({"studentId": sid, "name": name, "status": "failed"})
                continue

            saved = 0
            for subj in data['subjects']:
                mapped = SUBJECT_MAP.get(subj['name'], subj['name'])
                if save(sid, mapped, subj['score'], gl(subj['score'])):
                    saved += 1
            results.append({"studentId": sid, "name": name, "status": "ok", "form": data.get('form',''), "subjects": saved})
            ok += 1
            print(f"    ✅ {saved}科", file=sys.stderr)

    print(json.dumps({"success": True, "total": len(targets), "ok": ok, "failed": len(targets)-ok, "results": results}))

if __name__ == '__main__':
    c = sys.argv[1] if len(sys.argv) > 1 else ''
    asyncio.run(main(c))
