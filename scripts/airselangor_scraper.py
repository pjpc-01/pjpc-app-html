"""Air Selangor bill scraper v2 — logs in via Playwright stealth and extracts water account data.
Usage:
    AIR_LOGIN_ID="MY_NRIC" AIR_PASSWORD="xxx" python3 airselangor_scraper.py
Output: JSON to /tmp/airselangor_bills.json
"""
import asyncio, json, re, os, sys
from playwright.async_api import async_playwright

LOGIN_URL = "https://www.airselangor.com/login?lang=en"
LOGIN_ID = os.environ.get("AIR_LOGIN_ID", "")
PASSWORD = os.environ.get("AIR_PASSWORD", "")

NAME_RE = r'dashboard_waterAccountsName__\w+[^>]*>([^<]+)<'
NUM_RE = r'dashboard_waterAccountsNumber__\w+[^>]*>([^<]+)<'
AMT_RE = r'dashboard_waterAccountsItemAmount__\w+[^>]*>\s*RM\s*([\d.]+)'
DUE_RE = r'dashboard_dueDate__\w+[^>]*>\s*([^<]+)<'


async def login(page):
    await page.goto(LOGIN_URL, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(3000)
    try:
        btn = page.locator('button:has-text("Log in")').first
        if await btn.is_visible(timeout=3000):
            await btn.click()
            await page.wait_for_timeout(2000)
    except: pass
    login_input = page.locator('input[type="text"]').first
    if await login_input.is_visible():
        await login_input.fill(LOGIN_ID)
    pwd_input = page.locator('input[type="password"]').first
    if await pwd_input.is_visible():
        await pwd_input.fill(PASSWORD)
    await page.wait_for_timeout(300)
    login_btn = page.locator('button:has-text("Log in")').last
    await login_btn.click()
    await page.wait_for_timeout(1000)
    await page.keyboard.press('Enter')
    await page.wait_for_timeout(5000)
    return 'dashboard' in page.url


async def dismiss_tutorial(page):
    for _ in range(12):
        for sel in ['button:has-text("Next")', 'button:has-text("Skip")',
                    'button:has-text("Got it")', 'button:has-text("Skip tour")']:
            c = page.locator(sel)
            if await c.count() > 0 and await c.first.is_visible():
                await c.first.click()
                break
        else:
            break
        await page.wait_for_timeout(400)


async def main():
    if not LOGIN_ID or not PASSWORD:
        print(json.dumps({"error": "AIR_LOGIN_ID and AIR_PASSWORD env vars required"}))
        sys.exit(1)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-blink-features=AutomationControlled',
                  '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'],
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}, locale='en-MY',
        )
        page = await context.new_page()
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {} };
        """)

        if not await login(page):
            print(json.dumps({"error": "login failed", "url": page.url}))
            await browser.close()
            return

        await dismiss_tutorial(page)
        await page.wait_for_timeout(3000)

        html = await page.content()

        names = re.findall(NAME_RE, html)
        numbers = re.findall(NUM_RE, html)
        amounts = [float(a) for a in re.findall(AMT_RE, html)]
        dues = re.findall(DUE_RE, html)

        accounts = []
        for i in range(min(len(names), len(numbers), len(amounts))):
            accounts.append({
                "name": names[i].strip(),
                "number": numbers[i].strip(),
                "amount": amounts[i],
                "due": dues[i].strip() if i < len(dues) else "",
            })

        print(json.dumps({
            "accounts": accounts,
            "total": sum(a["amount"] for a in accounts),
            "count": len(accounts),
        }, indent=2, ensure_ascii=False))

        with open('/tmp/airselangor_bills.json', 'w') as f:
            json.dump({"scraped_at": __import__('datetime').datetime.now().isoformat(),
                       "provider": "Air Selangor", "accounts": accounts}, f, indent=2, ensure_ascii=False)

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())