"""TNB account bill-history probe — login, open each account, dump bill history links/labels."""
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


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'])
        # headful so TNB SSO redirect stays on dashboard
        ctx = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125 Safari/537.36', viewport={'width': 1600, 'height': 1000}, locale='en-MY')
        page = await ctx.new_page()
        await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>false});window.chrome={runtime:{}};")
        await page.goto('https://www.mytnb.com.my/', wait_until='networkidle', timeout=30000)
        await asyncio.sleep(2)
        # dismiss modals
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
        for _ in range(3):
            try:
                await page.wait_for_url('**IndividualDashboard**', timeout=20000); break
            except:
                try:
                    await page.wait_for_load_state('networkidle', timeout=8000)
                except:
                    pass
        await asyncio.sleep(5)
        print("URL:", page.url)
        if 'IndividualDashboard' not in page.url:
            print("NOT on dashboard (tariff redirect). Trying SSO direct...")
        # find bill-history related elements
        html = await page.content()
        accs = re.findall(r'<li\s+id="([a-f0-9-]+)"[^>]*class="[^"]*accountListItem[^"]*"[^>]*>.*?(\d{12})', html, re.DOTALL)
        print("accounts found:", len(accs))
        # gather all anchor texts/hrefs mentioning history/bill/statement
        info = await page.evaluate("""()=>Array.from(document.querySelectorAll('a[href],button')).map(e=>({t:(e.innerText||'').trim().slice(0,45),h:e.getAttribute('href')||'',c:(e.className||'').toString().slice(0,40)})).filter(x=>/histor|statement|bill|eBill|view/i.test(x.t+' '+x.h))""")
        seen = set()
        for it in info:
            k = it['t'] + it['h']
            if k in seen: continue
            seen.add(k)
            print("  ", it)
        with open('/tmp/tnb_dashboard.html', 'w') as f:
            f.write(html)
        await browser.close()


asyncio.run(main())