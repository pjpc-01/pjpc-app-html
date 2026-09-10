"""TNB bill history v2 — click each 'View Bill' button, dump the billing history detail page."""
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

        # count View Bill buttons
        btns = page.locator('button:has-text("View Bill")')
        n = await btns.count()
        print("View Bill buttons:", n)
        results = []
        for i in range(n):
            try:
                # JS click to bypass visibility/scroll requirements
                clicked = await page.evaluate("""()=>{
                  const btns=[...document.querySelectorAll('button')].filter(b=>/View[\\s]*Bill/i.test(b.innerText||''));
                  if(btns.length){ btns[0].click(); return true;}
                  return false;
                }""")
                if not clicked:
                    print(f"[{i}] no view-bill button found"); continue
                await asyncio.sleep(6)
                body = ' '.join((await page.evaluate("()=>document.body.innerText")).split())
                results.append({"url": page.url, "body": body[:2000]})
                print(f"\n=== [{i}] URL={page.url}")
                print(body[:1200])
                # go back to dashboard
                await page.goto('https://myaccount.mytnb.com.my/AccountManagement/IndividualDashboard', wait_until='networkidle', timeout=25000)
                await asyncio.sleep(3)
            except Exception as e:
                print(f"[{i}] err {str(e)[:80]}")
        await browser.close()
    with open('/tmp/tnb_viewbill.json', 'w') as f:
        json.dump(results, f, indent=2)


asyncio.run(main())