#!/usr/bin/env python3
"""Insert scraped utility bills into SQLite as HISTORY (one row per bill period).
Reads /tmp/tnb_bills.json or /tmp/airselangor_bills.json and INSERTs new rows —
never overwrites prior periods. Skips if a matching (provider, account_number,
bill_date|due_date) row already exists.

Usage:
    python3 utility_bills_upsert.py tnb        # from /tmp/tnb_bills.json
    python3 utility_bills_upsert.py airselangor # from /tmp/airselangor_bills.json
"""
import sqlite3, json, os, sys, uuid, datetime

DB_PATH = '/home/pjpc/pb_data_store/data.db'


def parse_period(provider: str, bill: dict) -> str:
    """Return a sortable period key. TNB uses bill_date, Air uses due_date."""
    d = bill.get('bill_date') or bill.get('due_date') or ''
    # Normalize TNB '09-Aug-2026' -> 2026-08-09; Air '21 Sep 2026' -> 2026-09-21
    for fmt in ('%d-%b-%Y', '%d %b %Y', '%Y-%m-%d'):
        try:
            return datetime.datetime.strptime(d.strip(), fmt).strftime('%Y-%m-%d')
        except (ValueError, AttributeError):
            continue
    return ''


def _already(cur, provider, acc_num, ymd, amount):
    """同账号 + 同一个月 + 金额相同 → 认为这期已在库里。
    门户历史表用真实开单日、脚本按 21 号记，差两三天属同一个月，不能按日死比。"""
    return cur.execute(
        "SELECT 1 FROM utility_bills WHERE provider=? AND account_number=? "
        "AND substr(bill_date,1,7)=? AND abs(amount-?)<0.01 LIMIT 1",
        (provider, acc_num, (ymd or '')[:7], amount)).fetchone()


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else 'tnb'
    src = '/tmp/tnb_bills.json' if which == 'tnb' else '/tmp/airselangor_bills.json'
    if not os.path.exists(src):
        print(json.dumps({"error": f"{src} not found", "skipped": True}))
        return
    data = json.load(open(src))
    accounts = data.get('accounts', [])
    if not accounts:
        print(json.dumps({"error": "no accounts in scrape output", "skipped": True}))
        return
    provider = data.get('provider', 'TNB' if which == 'tnb' else 'Air Selangor')

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    inserted = 0
    skipped = 0
    for a in accounts:
        acc_num = str(a.get('account_number', '')).strip()
        period = parse_period(provider, a)
        if not acc_num or not period:
            skipped += 1
            continue
        name = a.get('account_name') or a.get('name') or ''
        status = a.get('status', 'Active')
        # branch mapping by provider prefix
        branch = 'Secondary' if ('PU1' in name or acc_num == '2837070000' or acc_num == '220104544209') else 'Primary'
        # 门户历史表（Air 有）里列出所有 Bill issued：先把缺的月份补进去，
        # 再处理当期账单。这样一个月才跑一次、甚至漏跑两个月，下次跑也能补齐。
        for h in (a.get('history') or []):
            if str(h.get('type', '')).strip().lower() != 'bill issued':
                continue
            hd, amt = str(h.get('date') or ''), float(h.get('amount') or 0)
            if len(hd) != 10 or amt <= 0:
                continue
            # 只补最近 120 天，别把门户里几年前的老账单一股脑塞进库
            try:
                if (datetime.date.today() - datetime.datetime.strptime(hd, '%Y-%m-%d').date()).days > 120:
                    continue
            except ValueError:
                continue
            if _already(cur, provider, acc_num, hd, amt):
                continue
            cur.execute(
                "INSERT INTO utility_bills (id,created,updated,provider,account_name,account_number,branch,amount,bill_date,due_date,status,previous_balance,last_payment,last_payment_date) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), now, now, provider, name, acc_num, branch, amt,
                 hd + ' 00:00:00.000Z', '', status, 0.0, 0.0, ''))
            inserted += 1
            print(f"  历史补期: {acc_num} {hd} RM{amt}", file=sys.stderr)
        # Resolve the canonical period BEFORE deduping: 'period' is the scraped
        # due date, but Air rows land on bill_date = (due month - 1) day 21.
        if provider == 'Air Selangor':
            # Air bills are issued in the month BEFORE their due date (e.g. due 21 Sep = Aug bill).
            # So store bill_date = (due month - 1) on the 21st, matching "Bill issued" month.
            bill_date, due_date = '', period
            try:
                dt = datetime.datetime.strptime(period, '%Y-%m-%d')
                y, m = (dt.year - 1, 12) if dt.month == 1 else (dt.year, dt.month - 1)
                bill_date = datetime.date(y, m, 21).strftime('%Y-%m-%d')
            except (ValueError, AttributeError):
                bill_date = ''
        else:
            bill_date, due_date = period, ''
        # Dedupe on the key actually written (bill_date), never on the raw scraped
        # period — otherwise Air rows never match and every run duplicates them.
        # 注意两点：
        # 1) PB 里 date 字段存成 'YYYY-MM-DD 00:00:00.000Z'，脚本早先写的是 'YYYY-MM-DD'，
        #    直接 = 比较会把同一张单当新单再插一遍 —— 一律按前 10 位比。
        # 2) 门户历史表写的是真实开单日（如 Bill issued 23 Oct），本脚本按「到期月-1、21 号」
        #    记（2026-10-21），同一个月差两三天。所以去重放宽成「同账号 + 同月 + 金额相同」。
        key = (bill_date or due_date)[:10]
        amount = float(a.get('current_charges', a.get('amount', 0)) or 0)
        exists = _already(cur, provider, acc_num, key, amount)
        if exists:
            skipped += 1
            continue
        prev = float(a.get('previous_balance', 0) or 0)
        lastpay = float(a.get('last_payment_amount', 0) or 0)
        lastpaydate = a.get('last_payment_date', '') or ''
        # 跨期缺口检查：抓取只拿得到「当期账单」，中间漏跑一次就永久丢一期。
        # 插入前比对该账号上一期的 bill_date，间隔 >45 天就报出来，别静默吞掉。
        prev_row = cur.execute(
            'SELECT substr(bill_date,1,10) AS bd FROM utility_bills WHERE provider=? AND account_number=? AND substr(bill_date,1,10)<? '
            'ORDER BY bd DESC LIMIT 1', (provider, acc_num, key)).fetchone()
        if prev_row and prev_row[0]:
            try:
                gap = (datetime.datetime.strptime(bill_date, '%Y-%m-%d')
                       - datetime.datetime.strptime(prev_row[0], '%Y-%m-%d')).days
                if gap > 45:
                    print(f"WARN 跨期漏抓: {provider} {acc_num} 上期 {prev_row[0]} → 本期 {bill_date} 相隔 {gap} 天")
            except (ValueError, TypeError):
                pass
        cur.execute(
            "INSERT INTO utility_bills (id,created,updated,provider,account_name,account_number,branch,amount,bill_date,due_date,status,previous_balance,last_payment,last_payment_date) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), now, now, provider, name, acc_num, branch, amount,
             (bill_date + ' 00:00:00.000Z') if bill_date else '',
             (due_date + ' 00:00:00.000Z') if due_date else '',
             status, prev, lastpay, lastpaydate))
        inserted += 1
    conn.commit()
    print(json.dumps({"provider": provider, "inserted": inserted, "skipped": skipped}))
    # 抓完顺手把当期账单截图挂到对应支出的凭证字段（只在 receipt 为空时挂）
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import utility_receipts
        utility_receipts.main_for(which)
    except Exception as e:
        print(json.dumps({"receipts": "skipped", "reason": str(e)[:160]}, ensure_ascii=False))


if __name__ == '__main__':
    main()