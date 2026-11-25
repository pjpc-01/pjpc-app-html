#!/usr/bin/env python3
"""PJPC 积分命令行 —— 给 bot / 脚本用，直接入账，不走请求文件。

用法：
  python3 scripts/points-cli.py --name "Bao Toong" --delta 16 --center PU1
  python3 scripts/points-cli.py --name "Ivan" --delta -5 --reason "迟到" --by "Lim Zhe Hong"
  python3 scripts/points-cli.py --from-requests ~/.hermes/profiles/discord/workspace/requests
  python3 scripts/points-cli.py --name "Ivan" --delta 5 --dry-run

规则（写死，别绕）：
  · 只在 status=active 的学生里找；打拳班（学号 MMA 开头）与「明年新生」不算
  · 名字先精确（大小写/空格不敏感），再模糊（包含）；同名多个就报错列候选，**绝不猜**
  · 传了 --center 就只在那个分行里找
  · 入账走 /api/points/adjust（带 x-pjpc-internal），不直接写库，分数与流水一起落
退出码：0 成功 / 2 找不到或重名 / 3 接口失败
"""
import argparse
import glob
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = 'http://127.0.0.1:3001'
PB = 'http://127.0.0.1:8090'
# Discord 账号 → 老师（谁报的分就记在谁名下）
TEACHER_MAP = os.environ.get('PJPC_DISCORD_TEACHER_MAP',
                             '/home/sacrafix/.hermes/profiles/discord/workspace/teachers.json')


def load_env():
    env = {}
    for fn in ('.env.local', '.env'):
        p = os.path.join(ROOT, fn)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding='utf-8'):
            m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
            if m:
                env.setdefault(m.group(1), m.group(2).strip('"\''))
    return env


ENV = load_env()


def request(url, method=None, payload=None, headers=None):
    h = {'Content-Type': 'application/json'}
    if headers:
        h.update(headers)
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        return {'_http_error': e.code, '_body': e.read().decode()[:300]}


_ADMIN = {}


def admin_token():
    if _ADMIN.get('token'):
        return _ADMIN['token']
    identity = ENV.get('POCKETBASE_ADMIN_EMAIL') or ENV.get('ADMIN_EMAIL')
    password = ENV.get('POCKETBASE_ADMIN_PASSWORD') or ENV.get('ADMIN_PASSWORD')
    if not identity or not password:
        sys.exit('缺少 PocketBase 管理员凭据（.env.local）')
    r = request(PB + '/api/collections/_superusers/auth-with-password',
                method='POST', payload={'identity': identity, 'password': password})
    if not r.get('token'):
        sys.exit('PocketBase 登录失败: %s' % r)
    _ADMIN['token'] = r['token']
    return r['token']


def resolve_teacher(discord_user='', teacher=''):
    """返回 (teacher_id, teacher_name)。认不出就 (None, None)，绝不猜。"""
    mapping = {}
    if os.path.exists(TEACHER_MAP):
        try:
            mapping = json.load(open(TEACHER_MAP, encoding='utf-8')).get('map', {})
        except Exception:
            mapping = {}
    if discord_user:
        hit = mapping.get(str(discord_user))
        if not hit:
            return None, None
        return hit.get('teacher_id'), hit.get('teacher_name')
    if teacher:
        want = norm(teacher)
        for hit in mapping.values():
            if want and want in norm(hit.get('teacher_name')):
                return hit.get('teacher_id'), hit.get('teacher_name')
    return None, None


def teacher_center(teacher_id):
    """老师属于哪个分行（students.center 用的是 code：PU1 / BATU14）。"""
    if not teacher_id:
        return ''
    tok = admin_token()
    t = request(PB + '/api/collections/teachers/records/' + teacher_id,
                headers={'Authorization': tok})
    cid = t.get('centerId') or ''
    if not cid:
        return ''
    c = request(PB + '/api/collections/centers/records/' + cid,
                headers={'Authorization': tok})
    return c.get('code') or ''


def norm(s):
    return re.sub(r'\s+', '', (s or '').lower())


def is_excluded(s):
    sid = (s.get('student_id') or '').upper()
    return sid.startswith('MMA') or (s.get('grade') or '') == '明年新生'


def find_student(name, center=''):
    token = admin_token()
    q = urllib.parse.urlencode({'perPage': '300', 'filter': 'status="active"',
                                'fields': 'id,name,student_id,grade,center,points,points_enabled,status'})
    rows = request(PB + '/api/collections/students/records?' + q,
                   headers={'Authorization': token}).get('items', [])
    rows = [s for s in rows if not is_excluded(s)]
    all_rows = list(rows)
    want = norm(name)
    if not want:
        return None, []

    def match(pool_rows):
        wordish = [s for s in pool_rows
                   if want in [w for w in re.split(r'[^a-z0-9]+', (s.get('name') or '').lower()) if w]]
        contains = [s for s in pool_rows if want in norm(s.get('name'))]
        return wordish or contains

    scoped = rows
    if center:
        in_center = [s for s in rows if (s.get('center') or '') == center]
        scoped = in_center or rows

    pool = match(scoped)
    # 老师的分行里找不到这个名字 → 再跨分行找（跨分行任教的老师、临时代课都会遇到）
    crossed = False
    if not pool and scoped is not all_rows:
        pool = match(all_rows)
        crossed = len(pool) > 0
    if len(pool) == 1:
        return pool[0], pool
    full = [s for s in pool if norm(s.get('name')) == want]
    if len(full) == 1:
        return full[0], pool
    return None, pool


def adjust(name, delta, reason='', center='', by='', dry_run=False, student_id=None,
           teacher_id=None, teacher_name=None):
    # 老师自己的分行就是默认分行：跨分行同名（Joshua / Ivan / Jess）不用问就知道加哪个
    center_source = 'given'
    if not center and teacher_id:
        center = teacher_center(teacher_id)
        center_source = 'teacher'
    student, pool = (None, [])
    if student_id:
        q = urllib.parse.urlencode({'filter': 'id="%s"' % student_id,
                                    'fields': 'id,name,student_id,grade,center,points,points_enabled'})
        items = request(PB + '/api/collections/students/records?' + q,
                        headers={'Authorization': admin_token()}).get('items', [])
        student = items[0] if items else None
    else:
        student, pool = find_student(name, center)
    if not student:
        return {'ok': False, 'code': 2,
                'error': '找不到唯一学生', 'query': name,
                'candidates': [{'name': s['name'], 'student_id': s.get('student_id'), 'center': s.get('center')} for s in pool]}
    if student.get('points_enabled') is False:
        return {'ok': False, 'code': 2, 'error': '这个学生的积分功能没开，要找负责人开',
                'student': student['name']}

    note = (reason or '老师手动加分').strip()
    who = teacher_name or by
    if who and who not in note:
        note = '%s（%s）' % (note, who)

    if dry_run:
        return {'ok': True, 'dry_run': True, 'student': student['name'],
                'student_id': student.get('student_id'), 'center': student.get('center'),
                'center_source': center_source,
                'delta': delta, 'reason': note, 'points_now': student.get('points'),
                'teacher': teacher_name or '', 'teacher_id': teacher_id or ''}

    key = ENV.get('PROXY_INTERNAL_KEY', '')
    payload = {'student_id': student['id'], 'amount': delta, 'reason': note}
    if teacher_id:
        payload['teacher_id'] = teacher_id
    r = request(APP + '/api/points/adjust', method='POST',
                payload=payload,
                headers={'x-pjpc-internal': key})
    if r.get('_http_error') or not r.get('success'):
        return {'ok': False, 'code': 3, 'error': r.get('error') or r.get('_body') or r,
                'student': student['name'], 'delta': delta}
    return {'ok': True, 'student': student['name'], 'student_id': student.get('student_id'),
            'center': student.get('center'), 'center_source': center_source,
            'delta': delta, 'reason': note,
            'teacher': teacher_name or '', 'teacher_id': teacher_id or '',
            'points_before': r.get('points_before'), 'points_after': r.get('points_after')}


def main():
    ap = argparse.ArgumentParser(description='PJPC 积分加减（直接入账）')
    ap.add_argument('--name')
    ap.add_argument('--student-id')
    ap.add_argument('--delta', type=float)
    ap.add_argument('--reason', default='')
    ap.add_argument('--center', default='')
    ap.add_argument('--by', default='')
    ap.add_argument('--discord-user', default='', help='报分的 Discord 用户数字 ID（用来认老师）')
    ap.add_argument('--teacher', default='', help='老师姓名（代替 Discord ID）')
    ap.add_argument('--require-teacher', action='store_true',
                    help='认不出老师就拒绝执行（bot 一律带这个）')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--from-requests', metavar='DIR')
    ap.add_argument('--json', action='store_true', help='只印 JSON（bot 用）')
    a = ap.parse_args()

    if a.from_requests:
        out = []
        for f in sorted(glob.glob(os.path.join(a.from_requests, '*.json'))):
            d = json.load(open(f, encoding='utf-8'))
            p = d.get('payload', {})
            res = adjust(p.get('student', ''), p.get('delta', 0), p.get('reason', ''),
                         p.get('center', ''), d.get('requested_by', ''), a.dry_run)
            res['file'] = os.path.basename(f)
            out.append(res)
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0 if all(r.get('ok') for r in out) else 2

    if a.delta is None or (not a.name and not a.student_id):
        ap.error('要给 --name 或 --student-id，以及 --delta')

    t_id, t_name = resolve_teacher(a.discord_user, a.teacher)
    if a.require_teacher and not t_id:
        res = {'ok': False, 'code': 2,
               'error': '无法识别您的老师身份，请联系管理员',
               'hint': 'Discord ID 不在 %s' % TEACHER_MAP}
        print(json.dumps(res, ensure_ascii=False) if a.json else json.dumps(res, ensure_ascii=False, indent=2))
        return 2

    res = adjust(a.name or '', a.delta, a.reason, a.center, a.by, a.dry_run, a.student_id,
                 t_id, t_name)
    print(json.dumps(res, ensure_ascii=False, indent=2) if not a.json else json.dumps(res, ensure_ascii=False))
    return 0 if res.get('ok') else (res.get('code') or 3)


if __name__ == '__main__':
    sys.exit(main())
