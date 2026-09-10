"""Air Selangor full bill history scraper — logs in, opens each account, expands Bill & payment history, dumps all monthly bills.
Usage: AIR_LOGIN_ID=... AIR_PASSWORD=... python3 airselangor_history.py
"""
import asyncio, json, re, os, sys
from playwright.async_api import async_playwright

LOGIN_ID = os.environ.get("AIR_LOGIN_ID", "")
PASSWORD = os.environ.get("AIR_PASSWORD", "")


async def dismiss(page):
    for _ in range(12):
        done = False
        for sel in ['button:has-text("Next")', 'button:has-text("Skip")', 'button:has-text("Got it")', 'button:has-text("Skip tour")']:
            c = page.locator(sel)
            if await c.count() > 0 and await c.first.is_visible():
                await c.first.click(); done = True; break
        if not done:
            break
        await page.wait_for_timeout(400)


async def do_login(page):
    await page.goto('https://www.airselangor.com/login?lang=en', wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(3000)
    try:
        btn = page.locator('button:has-text("Log in")').first
        if await btn.is_visible(timeout=3000):
            await btn.click(); await page.wait_for_timeout(2000)
    except:
        pass
    await page.locator('input[type="text"]').first.fill(LOGIN_ID)
    await page.locator('input[type="password"]').first.fill(PASSWORD)
    await page.wait_for_timeout(300)
    await page.locator('button:has-text("Log in")').last.click()
    await page.wait_for_timeout(1000)
    await page.keyboard.press('Enter')
    await page.wait_for_timeout(6000)


async def main():
    if not LOGIN_ID or not PASSWORD:
        print(json.dumps({"error": "AIR_LOGIN_ID and AIR_PASSWORD required"})); sys.exit(1)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'])
        ctx = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36', viewport={'width': 1920, 'height': 1080}, locale='en-MY')
        page = await ctx.new_page()
        await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>false});window.chrome={runtime:{}};")
        await do_login(page)
        if 'dashboard' not in page.url:
            print(json.dumps({"error": "login failed", "url": page.url})); await browser.close(); return
        await dismiss(page); await page.wait_for_timeout(1500)
        cards = await page.locator('.dashboard_waterAccountsItem__wS_HN').count()
        all_accounts = []
        for ci in range(cards):
            card = page.locator('.dashboard_waterAccountsItem__wS_HN').nth(ci)
            name_lines = (await card.inner_text()).split('\n')
            name = name_lines[0].strip()
            num = name_lines[1].strip() if len(name_lines) > 1 else ''
            await card.click(); await page.wait_for_timeout(4000)
            hdr = page.locator('text=Bill & payment history').last
            try:
                await hdr.click(timeout=1500)
            except:
                pass
            await page.wait_for_timeout(2500)
            body = ' '.join((await page.evaluate("()=>document.body.innerText")).split())
            i = body.find('Bill & payment history')
            seg = body[i:i + 2000] if i >= 0 else body
            all_accounts.append({"name": name, "number": num, "history_text": seg})
            await page.goto('https://www.airselangor.com/dashboard?lang=en', wait_until='domcontentloaded', timeout=20000)
            await page.wait_for_timeout(2500)
        await browser.close()
    result = {"provider": "Air Selangor", "accounts": all_accounts}
    with open('/tmp/airselangor_history.json', 'w') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    asyncio.run(main())