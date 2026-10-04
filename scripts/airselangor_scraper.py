"""Air Selangor bill scraper v3 — logs in via Playwright stealth and extracts water account data.

DATA SOURCE: https://www.airselangor.com/my-water-account  (Manage water accounts table)
The /dashboard widget reports "My water accounts (0)" / "You currently have no water
accounts" for this login even though 3 accounts exist — so v3 reads the Manage-water-accounts
page instead.  (Accounts live on the new portal; the dashboard tile is stale.)

Emits BOTH numbering schemes so utility_bills_upsert.py works unchanged:
    name / account_name, number / account_number, amount / current_charges, due / due_date

Usage:
    AIR_LOGIN_ID="MY_NRIC" AIR_PASSWORD="xxx" python3 airselangor_scraper.py
Output: JSON to /tmp/airselangor_bills.json
"""
import asyncio, json, re, os, sys, datetime
from playwright.async_api import async_playwright

LOGIN_URL = "https://www.airselangor.com/login?lang=en"
ACCOUNTS_URL = "https://www.airselangor.com/my-water-account?lang=en"
LOGIN_ID = os.environ.get("AIR_LOGIN_ID", "")
PASSWORD = os.environ.get("AIR_PASSWORD", "")

# v3 — Manage water accounts table (tolerates extra classes after the hashed suffix)
NAME_RE = r'my-water-account_displayName__\w+[^>]*>\s*<a[^>]*>([^<]+)</a>'
NUM_RE = r'my-water-account_accountNumber__\w+[^>]*>([^<]+)<'
DUE_RE = r'my-water-account_column2__\w+[^>]*>\s*([^<]+)<'
AMT_RE = r'my-water-account_column3__\w+[^>]*>\s*RM\s*([\d.]+)'

# v2 — legacy dashboard classes (fallback if the accounts page changes)
L_NAME_RE = r'dashboard_waterAccountsName__\w+[^>]*>([^<]+)<'
L_NUM_RE = r'dashboard_waterAccountsNumber__\w+[^>]*>([^<]+)<'
L_AMT_RE = r'dashboard_waterAccountsItemAmount__\w+[^>]*>\s*RM\s*([\d.]+)'
L_DUE_RE = r'dashboard_dueDate__\w+[^>]*>\s*([^<]+)<'


async def login(page):
    await page.goto(LOGIN_URL, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(3000)
    try:
        btn = page.locator('button:has-text("Log in")').first
        if await btn.is_visible(timeout=3000):
            await btn.click()
            await page.wait_for_timeout(2000)
    except Exception:
        pass
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
                    'button:has-text("Got it")', 'button:has-text("Skip tour")',
                    'button:has-text("Close")']:
            c = page.locator(sel)
            if await c.count() > 0 and await c.first.is_visible():
                await c.first.click()
                break
        else:
            break
        await page.wait_for_timeout(400)


def parse_accounts(html):
    names = [n.strip() for n in re.findall(NAME_RE, html)]
    numbers = [n.strip() for n in re.findall(NUM_RE, html)]
    amounts = [float(a) for a in re.findall(AMT_RE, html)]
    dues = []
    for d in re.findall(DUE_RE, html):
        d = d.strip()
        d = re.sub(r'^Due\s+', '', d, flags=re.I)  # "Due 20 Oct 2026" -> "20 Oct 2026"
        dues.append(d)
    accounts = []
    for i in range(min(len(names), len(numbers), len(amounts))):
        accounts.append({
            "name": names[i],
            "account_name": names[i],
            "number": numbers[i],
            "account_number": numbers[i],
            "amount": amounts[i],
            "current_charges": amounts[i],
            "due": dues[i] if i < len(dues) else "",
            "due_date": dues[i] if i < len(dues) else "",
            "status": "Active",
        })
    return accounts


def parse_accounts_legacy(html):
    names = [n.strip() for n in re.findall(L_NAME_RE, html)]
    numbers = [n.strip() for n in re.findall(L_NUM_RE, html)]
    amounts = [float(a) for a in re.findall(L_AMT_RE, html)]
    dues = [d.strip() for d in re.findall(L_DUE_RE, html)]
    accounts = []
    for i in range(min(len(names), len(numbers), len(amounts))):
        accounts.append({
            "name": names[i], "account_name": names[i],
            "number": numbers[i], "account_number": numbers[i],
            "amount": amounts[i], "current_charges": amounts[i],
            "due": dues[i] if i < len(dues) else "",
            "due_date": dues[i] if i < len(dues) else "",
            "status": "Active",
        })
    return accounts


async def fetch_accounts(page):
    """Prefer the Manage-water-accounts page; fall back to the legacy dashboard classes."""
    try:
        await page.goto(ACCOUNTS_URL, wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(4000)
        await dismiss_tutorial(page)
        # give the React table time to render
        for _ in range(10):
            html = await page.content()
            if 'my-water-account_accountNumber__' in html:
                break
            await page.wait_for_timeout(1500)
        accounts = parse_accounts(html)
        if accounts:
            return accounts, page.url
        # fallback: dashboard v2 regexes
        await page.goto('https://www.airselangor.com/dashboard?lang=en', wait_until='domcontentloaded', timeout=30000)
        await page.wait_for_timeout(5000)
        html2 = await page.content()
        return parse_accounts_legacy(html2), page.url
    except Exception as e:
        print(f"fetch_accounts error: {e}", file=sys.stderr)
        return [], page.url


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
        accounts, src_url = await fetch_accounts(page)

        print(json.dumps({
            "accounts": accounts,
            "total": sum(a["amount"] for a in accounts),
            "count": len(accounts),
            "source": src_url,
        }, indent=2, ensure_ascii=False))

        out = {"scraped_at": datetime.datetime.now().isoformat(),
               "provider": "Air Selangor", "accounts": accounts}
        if not accounts:
            out["error"] = "no accounts found on /my-water-account (login ok) - not fabricating"
        with open('/tmp/airselangor_bills.json', 'w') as f:
            json.dump(out, f, indent=2, ensure_ascii=False)

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
