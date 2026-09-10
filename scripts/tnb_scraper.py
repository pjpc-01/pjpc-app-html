#!/usr/bin/env python3
"""TNB bill scraper v3 — login, select each account, extract billing data to JSON.
Uses Playwright stealth bypass. Dependencies: playwright (pip install playwright; playwright install chromium)"""

import asyncio, json, re, sys, os
from datetime import datetime
from playwright.async_api import async_playwright

# Credentials read from project .env.local (gitignored). Falls back to env vars.
def _load_env():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')
    try:
        for line in open(env_file):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                v = v.strip()
                # strip surrounding single/double quotes common in .env files
                if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                    v = v[1:-1]
                if not os.environ.get(k.strip()):
                    os.environ[k.strip()] = v
    except FileNotFoundError:
        pass

_load_env()
TNB_EMAIL = os.environ.get("TNB_EMAIL", "")
TNB_PASSWORD = os.environ.get("TNB_PASSWORD", "")

PJPC_ACCOUNT_NUMBERS = {'220077824105', '220077881101', '220104544209'}

BRANCH_MAP = {
    '220077824105': 'Primary',
    '220077881101': 'Primary',
    '220104544209': 'Secondary',
}

async def dismiss_all(page):
    try:
        await page.evaluate("""
            document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"].modal').forEach(m => m.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            const sb = document.querySelector('.search-box-input, .twitter-typeahead');
            if (sb) sb.remove();
        """)
    except:
        pass
    await asyncio.sleep(0.5)
    for sel in ['button:has-text("Got It")', 'button:has-text("Skip")', 'button:has-text("Close")',
                 'button:has-text("Later")', '.close']:
        try:
            btn = await page.query_selector(sel)
            if btn and await btn.is_visible():
                await btn.click(timeout=2000)
                await asyncio.sleep(0.3)
        except:
            pass

async def extract_billing_from_body(page):
    body = await page.evaluate('() => document.body.innerText')
    body = re.sub(r'\s+', ' ', body)
    bill = {}

    acc_match = re.search(r'(BATU\s*\d+\s*\w*|PU1\s*\w*)\s+(\d{12})', body)
    if acc_match:
        bill['account_name'] = acc_match.group(1).strip()
        bill['account_number'] = acc_match.group(2)

    status_match = re.search(r'Account\s+Status:\s*(\w+)', body)
    if status_match:
        bill['status'] = status_match.group(1)

    bill_date_match = re.search(r'Bill\s*Date\s*(\d{1,2}[-/]\w{3}[-/]\d{2,4})', body)
    if bill_date_match:
        bill['bill_date'] = bill_date_match.group(1)

    prev_bal = re.search(r'Previous\s+Balance\s*RM\s*([\d,.]+)', body)
    if prev_bal:
        bill['previous_balance'] = float(prev_bal.group(1).replace(',', ''))

    curr_chg = re.search(r'Current\s+Charges?\s*-?RM\s*([\d,.]+)', body)
    if curr_chg:
        val = float(curr_chg.group(1).replace(',', ''))
        if 'Current Charges -RM' in body or 'Current Charges-RM' in body:
            val = -val
        bill['current_charges'] = val

    rounding = re.search(r'Rounding\s+Adjustment\s*RM\s*([\d,.]+)', body)
    if rounding:
        bill['rounding_adjustment'] = float(rounding.group(1).replace(',', ''))

    cleared = re.search(r"cleared\s+all\s+bills?\s*RM\s*([\d,.]+)", body, re.IGNORECASE)
    if cleared:
        bill['cleared_amount'] = float(cleared.group(1).replace(',', ''))

    pay_amt = re.search(r'LAST\s+PAYMENT\s+AMOUNT\s*RM\s*([\d,.]+)', body)
    if pay_amt:
        bill['last_payment_amount'] = float(pay_amt.group(1).replace(',', ''))

    pay_date = re.search(r'LAST\s+PAYMENT\s+DATE\s*(\d{1,2}[-/]\w{3}[-/]\d{2,4})', body)
    if pay_date:
        bill['last_payment_date'] = pay_date.group(1)

    return bill

async def switch_account(page, account_number, account_id):
    try:
        toggle = await page.query_selector('#dropdownMenuButtonTop, [data-toggle="dropdown"], .dropdown-toggle')
        if toggle and await toggle.is_visible():
            await toggle.click(timeout=3000)
            await asyncio.sleep(1.5)
    except:
        pass

    try:
        item = await page.query_selector(f'li[id="{account_id}"]')
        if item:
            await page.evaluate(f"""
                (function() {{
                    const el = document.getElementById('{account_id}');
                    if (el) {{ el.click(); }}
                }})()
            """)
            await asyncio.sleep(3)
            return True
    except:
        pass

    try:
        await page.evaluate(f"""
            (function() {{
                const items = document.querySelectorAll('.accountListItem, li.list-group-item');
                for (const item of items) {{
                    if (item.innerText.includes('{account_number}')) {{
                        item.click();
                        return;
                    }}
                }}
            }})()
        """)
        await asyncio.sleep(3)
        return True
    except:
        pass

    return False

async def main():
    all_bills = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            ]
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

        # Login
        print("[1] Logging in...")
        await page.goto('https://www.mytnb.com.my/', wait_until='networkidle', timeout=30000)
        await asyncio.sleep(2)
        await dismiss_all(page)
        await page.fill('input[placeholder*="Email"]', TNB_EMAIL)
        await page.fill('input[placeholder*="Password"], input[type="password"]', TNB_PASSWORD)
        await page.keyboard.press('Enter')
        try:
            await page.wait_for_url('**/IndividualDashboard**', timeout=20000)
        except:
            await page.wait_for_load_state('networkidle', timeout=15000)
        await asyncio.sleep(5)
        await dismiss_all(page)

        # Parse accounts
        html = await page.content()
        acc_pattern = re.findall(r'<li\s+id="([a-f0-9-]+)"[^>]*class="[^"]*accountListItem[^"]*"[^>]*>.*?(\d{12})', html, re.DOTALL)
        accounts = []
        seen_nums = set()
        for acc_id, acc_num in acc_pattern:
            if acc_num in PJPC_ACCOUNT_NUMBERS and acc_num not in seen_nums:
                seen_nums.add(acc_num)
                idx = html.find(acc_id)
                ctx = html[max(0,idx-200):idx+300]
                name_match = re.search(r'(BATU\s*\d+\s*\w*|PU1\s*\w*)', ctx)
                name = name_match.group(1).strip() if name_match else 'Unknown'
                accounts.append({'id': acc_id, 'number': acc_num, 'name': name})

        print(f"[2] Found {len(accounts)} PJPC accounts")

        for i, acc in enumerate(accounts):
            print(f"\n[3.{i+1}] {acc['name']} ({acc['number']})")
            if i == 0:
                pass  # default
            else:
                await switch_account(page, acc['number'], acc['id'])

            await asyncio.sleep(2)
            await dismiss_all(page)
            bill = await extract_billing_from_body(page)
            bill['branch'] = BRANCH_MAP.get(acc['number'], 'Unknown')
            print(f"     RM {bill.get('current_charges', 0):.2f} ({bill.get('status', '?')})")
            all_bills.append(bill)

        await browser.close()

    result = {'scraped_at': datetime.now().isoformat(), 'provider': 'TNB', 'accounts': all_bills}
    with open('/tmp/tnb_bills.json', 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\n✅ {len(all_bills)} accounts → /tmp/tnb_bills.json")

if __name__ == '__main__':
    asyncio.run(main())
