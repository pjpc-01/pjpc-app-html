#!/usr/bin/env python3
"""Helper script for the utility-bills API route - reads from SQLite and outputs JSON."""
import sqlite3, json, sys, os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'pb_data_store', 'data.db')

try:
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute('''
        SELECT id, provider, account_name, account_number, branch, amount,
               bill_date, due_date, status, previous_balance, last_payment, last_payment_date
        FROM utility_bills ORDER BY branch, provider, account_name
    ''').fetchall()
    conn.close()
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(0)

bills = []
for r in rows:
    bills.append({
        'id': r[0], 'provider': r[1] or '', 'account_name': r[2] or '', 'account_number': r[3] or '',
        'branch': r[4] or '', 'amount': r[5] or 0,
        'bill_date': r[6] or '', 'due_date': r[7] or '', 'status': r[8] or '',
        'previous_balance': r[9] or 0, 'last_payment': r[10] or 0, 'last_payment_date': r[11] or ''
    })

grouped = {}
for b in bills:
    branch = b['branch'] or 'Other'
    provider = b['provider'] or 'Other'
    if branch not in grouped:
        grouped[branch] = {}
    if provider not in grouped[branch]:
        grouped[branch][provider] = []
    grouped[branch][provider].append(b)

total = sum(b['amount'] for b in bills)
print(json.dumps({'bills': bills, 'grouped': grouped, 'total': total}))
