"""TNB per-account Billing Summary — click each account card on dashboard, dump its Billing Summary (latest bill period)."""
import asyncio, json, re, os
from playwright.async_api import async_playwright

env = {}
for line in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, _, v = line.partition('=')
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
            v = v[1:-1]
        env[k.strip()] = v
EMAIL = env.get('TNB_EMAIL', '')
PASSWORD = env.get('TNB_PASSWORD', '')

PJPC = ['220077824105', '220077881101', '220104544209']


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'])
        ctx = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125 Safari/537.36', viewport={'width': 1600, 'height': 1000}, locale='en-MY')
        page = await ctx.new_page()
        await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>false});window.chrome={runtime:{}};")
        await page.goto('https://www.mytnb.com.my/', wait_until='networkidle', timeout=30000)
        await asyncio.sleep(2)
        for sel in ['button:has-text("Got It")', 'button:has-text("Skip")', 'button:has-text("Close")', '.close']:
            try:
                btn = await page.query_selector(sel)
                if btn and await btn.is_visible():
                    await btn.click(timeout=1500); await asyncio.sleep(0.3)
            except:
                pass
        await page.fill('input[placeholder*="Email"]', EMAIL)
        await page.fill('input[placeholder*="Password"], input[type="password"]', PASSWORD)
        await page.keyboard.press('Enter')
        for _ in range(4):
            try:
                await page.wait_for_url('**IndividualDashboard**', timeout=20000); break
            except:
                try:
                    await page.wait_for_load_state('networkidle', timeout=8000)
                except:
                    pass
        await asyncio.sleep(5)
        if 'IndividualDashboard' not in page.url:
            print("NOT dashboard:", page.url); await browser.close(); return

        results = {}
        # The dashboard shows one account's Billing Summary at a time, switchable via account dropdown.
        # Try clicking account list items to switch.
        for acc in PJPC:
            switched = await page.evaluate("""(accNum)=>{
              const items=[...document.querySelectorAll('li,div')].filter(e=>/accountListItem/i.test(e.className||''));
              for(const it of items){
                if((it.innerText||'').includes(accNum)){ it.click(); return true;}
              }
              // try dropdown toggle
              const toggles=[...document.querySelectorAll('[data-toggle="dropdown"],.dropdown-toggle,#dropdownMenuButtonTop')];
              if(toggles.length){ toggles[0].click(); return 'toggled'; }
              return false;
            }""", acc)
            await asyncio.sleep(4)
            # if only toggled, click the account in the opened menu
            if switched == 'toggled':
                await page.evaluate("""(accNum)=>{
                  const items=[...document.querySelectorAll('a,li,div')].filter(e=>/account/i.test((e.className||'')+'' )&& (e.innerText||'').includes(accNum));
                  if(items.length) items[0].click();
                }""", acc)
                await asyncio.sleep(4)
            body = ' '.join((await page.evaluate("()=>document.body.innerText")).split())
            # extract Billing Summary block
            bi = body.find('Billing Summary')
            seg = body[bi:bi + 900] if bi >= 0 else body[:800]
            iv = body.find('Inactive')
            results[acc] = {"url": page.url, "summary": seg}
            print(f"\n===== {acc} =====")
            print(seg)
        await browser.close()
    with open('/tmp/tnb_summaries.json', 'w') as f:
        json.dump(results, f, indent=2)


asyncio.run(main())