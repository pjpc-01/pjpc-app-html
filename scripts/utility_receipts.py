#!/usr/bin/env python3
"""把当期水电账单截图挂到对应支出的 receipt 字段（凭证）。

背景：水电支出是抓账自动写的，一直没凭证，每周体检都报「缺凭证」。
现在抓取脚本会顺手把账单页面截图存到 /tmp/utility_shots/{provider}_{账号}.png，
这里按「金额 + 账号出现在描述里 + 日期相差不超过 45 天」找到对应支出，上传图片。

只补空缺：已经有 receipt 的不覆盖，找不到对应支出的只报告、不新建财务记录。

用法：
    python3 utility_receipts.py tnb|airselangor
"""
import json, os, sys, urllib.request, urllib.parse, datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SHOT_DIR = '/tmp/utility_shots'
PB_URL = os.environ.get('POCKETBASE_URL', 'http://127.0.0.1:8090')


def read_env():
    env = {}
    for line in open(os.path.join(SCRIPT_DIR, '..', '.env.local')):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def su_token():
    env = read_env()
    body = json.dumps({'identity': env.get('POCKETBASE_ADMIN_EMAIL', ''),
                       'password': env.get('POCKETBASE_ADMIN_PASSWORD', '')}).encode()
    req = urllib.request.Request(PB_URL + '/api/collections/_superusers/auth-with-password', data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)['token']


def api(path, token, method='GET', data=None, ctype='application/json'):
    req = urllib.request.Request(PB_URL + path, data=data, method=method,
                                 headers={'Authorization': token, 'Content-Type': ctype})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r) if r.status != 204 else {}


def parse_date(s):
    for f in ('%Y-%m-%d', '%d-%b-%Y', '%d %b %Y'):
        try:
            return datetime.datetime.strptime((s or '').strip()[:11].strip(), f).date()
        except (ValueError, AttributeError):
            continue
    return None


def upload_receipt(token, record_id, shot_path):
    """multipart PATCH：把图挂到 receipt 字段。"""
    boundary = '----pjpc%s' % os.urandom(8).hex()
    fname = os.path.basename(shot_path)
    with open(shot_path, 'rb') as f:
        content = f.read()
    parts = []
    parts.append(('--%s\r\nContent-Disposition: form-data; name="receipt"; filename="%s"\r\n'
                  'Content-Type: image/png\r\n\r\n' % (boundary, fname)).encode())
    parts.append(content)
    parts.append(('\r\n--%s--\r\n' % boundary).encode())
    body = b''.join(parts)
    req = urllib.request.Request(
        PB_URL + '/api/collections/expenses/records/' + record_id, data=body, method='PATCH',
        headers={'Authorization': token,
                 'Content-Type': 'multipart/form-data; boundary=%s' % boundary})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else 'tnb'
    main_for(which)


def main_for(which='tnb'):
    src = '/tmp/tnb_bills.json' if which == 'tnb' else '/tmp/airselangor_bills.json'
    if not os.path.exists(src):
        print(json.dumps({'error': src + ' not found', 'skipped': True}))
        return
    accounts = json.load(open(src)).get('accounts', [])
    token = su_token()
    expenses = api('/api/collections/expenses/records?perPage=500&filter=' +
                   urllib.parse.quote("category='utilities'"), token).get('items', [])

    attached, already, missing_shot, no_expense = 0, 0, 0, 0
    details = []
    for a in accounts:
        acct = str(a.get('account_number', '')).strip()
        amt = float(a.get('current_charges', a.get('amount', 0)) or 0)
        bdate = parse_date(a.get('bill_date') or a.get('due_date') or '')
        shot = a.get('screenshot') or os.path.join(SHOT_DIR, f'{which}_{acct}.png')
        if not os.path.exists(shot):
            missing_shot += 1
            details.append(f'{acct}: 没截图')
            continue
        match = None
        for e in expenses:
            if (e.get('receipt') or '').strip():
                continue
            if acct not in (e.get('description') or ''):
                continue
            if abs(float(e.get('amount') or 0) - amt) > 0.01:
                continue
            ed = parse_date(str(e.get('date', ''))[:10])
            if bdate and ed and abs((ed - bdate).days) > 45:
                continue
            match = e
            break
        if not match:
            # 已有凭证的也算「对上了」，不算问题
            if any(acct in (e.get('description') or '') and abs(float(e.get('amount') or 0) - amt) < 0.01
                   and (e.get('receipt') or '').strip() for e in expenses):
                already += 1
                details.append(f'{acct}: 已有凭证，跳过')
            else:
                no_expense += 1
                details.append(f'{acct}: 找不到对应支出（{amt}），不新建')
            continue
        try:
            res = upload_receipt(token, match['id'], shot)
            attached += 1
            match['receipt'] = res.get('receipt')
            details.append(f"{acct}: 已挂 {os.path.basename(shot)} → {match['id']}")
        except Exception as e:
            details.append(f'{acct}: 上传失败 {str(e)[:100]}')

    print(json.dumps({'provider': which, 'attached': attached, 'already': already,
                      'no_shot': missing_shot, 'no_expense': no_expense, 'details': details},
                     ensure_ascii=False))


if __name__ == '__main__':
    main()
