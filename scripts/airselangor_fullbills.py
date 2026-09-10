"""Air Selangor — dump the FULL 'View all' modal HTML+text per account. Uses response + page.content() to capture modal body."""
import asyncio, json, re, os
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
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'])
        ctx = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125 Safari/537.36', viewport={'width': 1920, 'height': 1080}, locale='en-MY')
        page = await ctx.new_page()
        await page.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>false});window.chrome={runtime:{}};")
        await do_login(page)
        if 'dashboard' not in page.url:
            print(json.dumps({"error": "login", "url": page.url})); await browser.close(); return
        await dismiss(page); await page.wait_for_timeout(1500)
        cards = await page.locator('.dashboard_waterAccountsItem__wS_HN').count()
        out = {}
        for ci in range(cards):
            card = page.locator('.dashboard_waterAccountsItem__wS_HN').nth(ci)
            lines = (await card.inner_text()).split('\n')
            name, num = lines[0].strip(), lines[1].strip()
            await card.click(); await page.wait_for_timeout(4000)
            clicked_hist = False
            try:
                await page.locator('text=Bill & payment history').last.click(timeout=1500); await page.wait_for_timeout(1500); clicked_hist = True
            except:
                pass
            # click View all
            try:
                await page.locator('text=View all').last.click(timeout=1500); await page.wait_for_timeout(3500)
            except Exception as e:
                print(f"[{name}] no viewall: {str(e)[:40]}")
            # dump page content and find the modal region + all RM/date tokens
            html = await page.content()
            # Extract any recurring date+RM patterns (month year, Issued/Payment, amounts)
            seen = []
            # normalise spaces, strip tags
            text = re.sub(r'<[^>]+>', ' ', html)
            text = ' '.join(text.split())
            i = text.find('Bills')
            m = text[i:i + 3000] if i >= 0 else text[:3000]
            out[f"{name}"] = {"num": num, "hist_clicked": clicked_hist, "snippet": m}
            print(f"\n===== {name} ({num}) hist_clicked={clicked_hist} =====")
            print(m[:2200])
            await page.goto('https://www.airselangor.com/dashboard?lang=en', wait_until='domcontentloaded', timeout=20000)
            await page.wait_for_timeout(2500)
        await browser.close()
    with open('/tmp/air_fullbills2.json', 'w') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    asyncio.run(main())