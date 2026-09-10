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
        # skip if a row already exists for this account + period
        exists = cur.execute(
            'SELECT 1 FROM utility_bills WHERE provider=? AND account_number=? AND (bill_date=? OR due_date=?) LIMIT 1',
            (provider, acc_num, period, period)).fetchone()
        if exists:
            skipped += 1
            continue
        name = a.get('account_name') or a.get('name') or ''
        status = a.get('status', 'Active')
        # branch mapping by provider prefix
        branch = 'Secondary' if ('PU1' in name or acc_num == '2837070000' or acc_num == '220104544209') else 'Primary'
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
        amount = float(a.get('current_charges', a.get('amount', 0)) or 0)
        prev = float(a.get('previous_balance', 0) or 0)
        lastpay = float(a.get('last_payment_amount', 0) or 0)
        lastpaydate = a.get('last_payment_date', '') or ''
        cur.execute(
            "INSERT INTO utility_bills (id,created,updated,provider,account_name,account_number,branch,amount,bill_date,due_date,status,previous_balance,last_payment,last_payment_date) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), now, now, provider, name, acc_num, branch, amount,
             bill_date, due_date, status, prev, lastpay, lastpaydate))
        inserted += 1
    conn.commit()
    print(json.dumps({"provider": provider, "inserted": inserted, "skipped": skipped}))


if __name__ == '__main__':
    main()