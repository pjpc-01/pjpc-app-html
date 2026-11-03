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


def _load_env():
    """从项目 .env.local 读凭据，命令行没传就用文件里的（cron 就不用把口令写进提示词）。"""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')
    try:
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and not os.environ.get(k):
                    os.environ[k] = v
    except OSError:
        pass


_load_env()
LOGIN_ID = os.environ.get("AIR_LOGIN_ID", "")
PASSWORD = os.environ.get("AIR_PASSWORD", "")
# 详情页截图放这里，upsert 会把它当凭证挂到对应支出
SHOT_DIR = '/tmp/utility_shots'

# v3 — Manage water accounts table (tolerates extra classes after the hashed suffix)
NAME_RE = r'my-water-account_displayName__\w+[^>]*>\s*<a[^>]*>([^<]+)</a>'
NUM_RE = r'my-water-account_accountNumber__\w+[^>]*>([^<]+)<'
DUE_RE = r'my-water-account_column2__\w+[^>]*>\s*([^<]+)<'
AMT_RE = r'my-water-account_column3__\w+[^>]*>\s*RM\s*([\d.]+)'

# v4 — per-account detail page (/my-water-account/view?acc=GUID) innerText.
# The accounts TABLE only shows "Amount due", which is RM 0.00 once the bill is paid.
# The detail page carries the real bill: Current bill / Pay before / Previous balance.
CUR_RE = r'Current bill\s*\n?\s*RM\s*([\d.]+)'
PREV_RE = r'Previous balance\s*\n?\s*RM\s*(-?[\d.]+)'
PAID_RE = r'Amount to be paid\s*\n?\s*RM\s*([\d.]+)'
PAYBY_RE = r'Pay before\s*\n?\s*([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})'
OWNER_RE = r'My water accounts\s*\n([^\n]+)\n(\d{8,14})'

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


def parse_detail(txt):
    """Extract the real bill from a detail page's innerText. Returns {} if not found."""
    m_own = re.search(OWNER_RE, txt)
    if not m_own:
        return {}
    out = {"number": m_own.group(2).strip(), "name": m_own.group(1).strip()}
    m = re.search(CUR_RE, txt)
    if m:
        out["current_bill"] = float(m.group(1))
    m = re.search(PAID_RE, txt)
    if m:
        out["amount_due"] = float(m.group(1))
    m = re.search(PREV_RE, txt)
    if m:
        out["previous_balance"] = float(m.group(1))
    m = re.search(PAYBY_RE, txt)
    if m:
        out["pay_before"] = re.sub(r'\s+', ' ', m.group(1)).strip()
    return out if "current_bill" in out or "pay_before" in out else {}


async def enrich_from_details(page, accounts):
    """The accounts table shows Amount DUE (0.00 once paid). Read each detail page
    for Current bill + Pay before so a paid-but-current bill is still captured."""
    links = await page.eval_on_selector_all(
        'a[href*="my-water-account/view"]', 'els => els.map(e => e.href)')
    details = {}
    for lk in links:
        try:
            await page.goto(lk, wait_until='domcontentloaded', timeout=40000)
            await page.wait_for_timeout(4000)
            txt = await page.inner_text('body')
            d = parse_detail(txt)
            if d.get("number"):
                details[d["number"]] = d
            print(f"  detail {lk.split('acc=')[-1][:8]}: {d}", file=sys.stderr)
            # 详情页截图当凭证：只有 8~14 位账号才算数
            try:
                num = (d.get("number") or '').strip()
                if num:
                    os.makedirs(SHOT_DIR, exist_ok=True)
                    shot = os.path.join(SHOT_DIR, f'air_{num}.png')
                    await page.screenshot(path=shot, full_page=False)
                    d['screenshot'] = shot
                    print(f"  📷 {shot}", file=sys.stderr)
                    # 再把「Bill & payment history → View all」整页也截一张：
                    # 门户只给当期账单，万一周跑漏了一期，翻这张历史表还能把凭证补回来。
                    try:
                        await page.locator('text=View all').first.click(timeout=4000)
                        await page.wait_for_timeout(3500)
                        hist = os.path.join(SHOT_DIR, f'air_history_{num}.png')
                        await page.screenshot(path=hist, full_page=True)
                        print(f"  📜 {hist}", file=sys.stderr)
                    except Exception as e:
                        print(f"  history 截图跳过: {str(e)[:80]}", file=sys.stderr)
            except Exception as e:
                print(f"  screenshot 失败: {e}", file=sys.stderr)
        except Exception as e:
            print(f"  detail error {lk}: {e}", file=sys.stderr)
    for a in accounts:
        d = details.get(str(a["number"]).strip())
        if not d:
            continue
        if "current_bill" in d:
            a["amount"] = a["current_charges"] = d["current_bill"]
        if d.get("pay_before"):
            a["due"] = a["due_date"] = d["pay_before"]
        a["amount_due"] = d.get("amount_due", 0.0)
        a["previous_balance"] = d.get("previous_balance", 0.0)
        a["source"] = "account-detail"
        if d.get("screenshot"):
            a["screenshot"] = d["screenshot"]
        # 解析伪影保护：详情页偶尔出现「Previous balance RM -115.85」，绝对值恰好等于本期
        # 账单（115.85），这是页面排版把减号串进数字，不是真的贷记。判为 0，别写进历史表。
        prev = a["previous_balance"] or 0
        cur = a.get("current_charges") or a.get("amount") or 0
        if prev < 0 and abs(abs(prev) - cur) < 0.005:
            print(f"  warn {a.get('number')}: previous_balance {prev} 与本期 {cur} 绝对值相同 → 判为解析伪影，置 0", file=sys.stderr)
            a["previous_balance"] = 0.0
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
            # Table shows Amount DUE (0.00 when paid) — enrich with the real bill.
            accounts = await enrich_from_details(page, accounts)
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
