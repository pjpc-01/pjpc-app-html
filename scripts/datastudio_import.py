"""DataStudio grade scraper v5 — fixed tab clicking + new page format"""
import asyncio, json, sys, subprocess, urllib.parse, re

PB_URL = "http://127.0.0.1:8090"
PB_USER = "admin@pjpc.com"
PB_PASS = "1234567890"
DS_URL = "https://datastudio.google.com/u/0/reporting/5755410c-43ab-4d79-afa7-a770c11eef2a/page/bEQqD"

SUBJECT_MAP = {
    "BAHASA MELAYU": "国文", "BAHASA INGGERIS": "英文", "SAINS": "科学",
    "MATEMATIK": "数学", "SEJARAH": "历史", "GEOGRAFI": "地理",
    "PENDIDIKAN ISLAM": "伊斯兰教育", "PENDIDIKAN MORAL": "道德",
    "ASAS SAINS KOMPUTER": "电脑", "REKA BENTUK DAN TEKNOLOGI": "RBT",
    "PENDIDIKAN SENI VISUAL": "美术", "PENDIDIKAN JASMANI & KESIHATAN": "体育",
    "PENDIDIKAN JASMANI DAN KESIHATAN": "体育",
    "BAHASA ARAB": "阿拉伯文", "BAHASA CINA": "华文", "BAHASA TAMIL": "淡米尔文",
    "PENDIDIKAN SAINS, SOSIAL DAN ALAM SEKITAR": "科学",
    "KEMAHIRAN HIDUP": "生活技能",
}

GRADE_ORDER = {"Peralihan":0,"Form 1":1,"Form 2":2,"Form 3":3,"Form 4":4,"Form 5":5}
TABS = ["PERALIHAN", "T1-T3", "T4-T5"]

def gl(s): return "A" if s>=80 else "B" if s>=70 else "C" if s>=60 else "D" if s>=50 else "F"

def parse(text):
    """Parse the DataStudio page text for subjects and scores"""
    lines = [l.strip() for l in text.split('\n')]
    
    # Find subjects: lines matching "1.  BAHASA MELAYU" pattern
    # Each subject has: number, name, then next lines may have score or "No data"
    subjects = []
    i = 0
    while i < len(lines):
        m = re.match(r'^(\d{1,2})\.\s+(.+)', lines[i])
        if m:
            subj_name = m.group(2).strip()
            # Look at next lines for score
            score = None
            grade = ""
            j = i + 1
            while j < len(lines) and j < i + 10:
                nxt = lines[j].strip()
                if nxt == "No data":
                    break  # skip this subject
                if nxt.isdigit() and 0 <= int(nxt) <= 100:
                    score = int(nxt)
                    j += 1
                    # Next line might be grade letter
                    if j < len(lines) and lines[j].strip() in "ABCDEF":
                        grade = lines[j].strip()
                    break
                if re.match(r'^\d{1,2}\.\s+', nxt):  # next subject
                    break
                if any(k in nxt for k in ("RUMUSAN","JUMLAH","PURATA","ANALISIS","MATA PELAJARAN")):
                    break
                j += 1
            if score is not None:
                subjects.append({"name": subj_name, "score": score, "grade": grade or gl(score)})
        i += 1
    
    return subjects if subjects else None

def get_token():
    auth = subprocess.run(['curl', '-s', '-X', 'POST',
        f'{PB_URL}/api/collections/_superusers/auth-with-password',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"identity": PB_USER, "password": PB_PASS})],
        capture_output=True, text=True)
    try:
        return json.loads(auth.stdout).get('token', '')
    except:
        print(f'Auth failed: {auth.stdout[:100]}', file=sys.stderr)
        return 

def save(token, sid, subj, score, letter):
    subj = SUBJECT_MAP.get(subj, subj)
    payload = json.dumps({"studentId": sid, "subject": subj, "term": "Term 1", "year": 2026, "score": score, "grade_letter": letter})
    try:
        # Check existing
        f = f'(studentId="{sid}"&&subject="{subj}"&&term="Term 1"&&year=2026)'
        chk = subprocess.run(['curl', '-s',
            f'{PB_URL}/api/collections/grades/records?perPage=1&filter={urllib.parse.quote(f)}',
            '-H', f'Authorization: Bearer {token}'],
            capture_output=True, text=True)
        resp = json.loads(chk.stdout) if chk.stdout else {}
        existing = resp.get('items', [])
        if existing:
            rid = existing[0]['id']
            r = subprocess.run(['curl', '-s', '-X', 'PATCH',
                f'{PB_URL}/api/collections/grades/records/{rid}',
                '-H', 'Content-Type: application/json',
                '-H', f'Authorization: Bearer {token}',
                '-d', payload], capture_output=True, text=True)
        else:
            r = subprocess.run(['curl', '-s', '-X', 'POST',
                f'{PB_URL}/api/collections/grades/records',
                '-H', 'Content-Type: application/json',
                '-H', f'Authorization: Bearer {token}',
                '-d', payload], capture_output=True, text=True)
        result = json.loads(r.stdout) if r.stdout else {}
        return 'id' in result
    except Exception as e:
        print(f"    ⚠️ save error: {e}", file=sys.stderr)
        return False

async def scrape_one(p, ic, grade_str=""):
    browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
    try:
        ctx = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await ctx.new_page()
        await page.goto(DS_URL, wait_until='domcontentloaded', timeout=45000)
        await asyncio.sleep(8)
        
        # Enter NRIC
        icf = await page.query_selector('input')
        if not icf:
            await browser.close()
            return None
        await icf.click()
        await icf.fill(ic)
        await page.keyboard.press('Enter')
        await asyncio.sleep(8)
        
        # Determine which tab to try first
        g = grade_str.lower() if grade_str else ""
        primary = "T1-T3"
        if "form 4" in g or "form 5" in g or g.startswith("4") or g.startswith("5"):
            primary = "T4-T5"
        elif "peralihan" in g or "remove" in g:
            primary = "PERALIHAN"
        
        # Try tabs in order: primary first, then others
        tabs_to_try = [primary] + [t for t in TABS if t != primary]
        subjects = None
        
        for tab in tabs_to_try:
            try:
                await page.click(f'text={tab}')
                await asyncio.sleep(5)
            except Exception:
                pass
            
            text = await page.evaluate("() => document.body.innerText")
            if "No data\n" not in text.replace("No data\nNo data", "X"):
                # Check if there's actual score data
                subjects = parse(text)
                if subjects:
                    break
        
        await browser.close()
        return subjects
    except Exception as e:
        print(f"    ❌ {e}", file=sys.stderr)
        try: await browser.close()
        except: pass
        return None

async def main(center_filter=""):
    from playwright.async_api import async_playwright

    sf = 'status="active"'
    if center_filter:
        sf += f' && center="{urllib.parse.quote(center_filter)}"'
    u = f"{PB_URL}/api/collections/students/records?perPage=500&fields=id,nric,name,grade,center&filter={urllib.parse.quote(sf)}"
    r = subprocess.run(['curl', '-s', u], capture_output=True, text=True)
    students = json.loads(r.stdout).get('items', [])
    targets = [(s['id'], s['nric'].strip().replace('-', ''), s.get('name', ''), s.get('grade', '')) for s in students if s.get('nric') and s['nric'].strip()]
    if not targets:
        print(json.dumps({"success": False, "message": "no students with NRIC"}))
        return

    token = get_token()
    if not token:
        print(json.dumps({"success": False, "message": "PB auth failed"}))
        return

    print(f"📊 {len(targets)} students ({center_filter or 'all'})", file=sys.stderr)
    results = []
    ok = 0

    async with async_playwright() as p:
        for sid, ic, name, grade_str in targets:
            print(f"  {name} {ic}", file=sys.stderr)
            subjects = await scrape_one(p, ic, grade_str)
            if not subjects:
                results.append({"studentId": sid, "name": name, "status": "failed"})
                continue

            saved = 0
            for subj in subjects:
                if save(token, sid, subj['name'], subj['score'], subj['grade']):
                    saved += 1
            results.append({"studentId": sid, "name": name, "status": "ok", "subjects": saved})
            ok += 1
            print(f"    ✅ {saved}科: {', '.join(SUBJECT_MAP.get(s['name'],s['name']) + ' ' + str(s['score']) for s in subjects)}", file=sys.stderr)

    print(json.dumps({"success": True, "total": len(targets), "ok": ok, "failed": len(targets)-ok, "results": results}))

if __name__ == '__main__':
    c = sys.argv[1] if len(sys.argv) > 1 else ''
    asyncio.run(main(c))
