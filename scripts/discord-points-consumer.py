#!/usr/bin/env python3
"""Discord bot 的投放箱消费程序 —— 把 workspace/requests/*.json 真正执行掉。

为什么要有这一支：Discord bot 的工具集里**没有终端**（platform_toolsets.discord 不含
terminal / code_execution），它只能写文件。所以积分请求必须由主机这边消费。

流程：requests/*.json → 认人（teachers.json 的 Discord ID → 老师）→ points-cli 入账
      → responses/<同名>-done.json → 原件移到 requests/processed/
认不出老师 / 学生重名 / 找不到 → 只写 response，不动库。

跑法：常驻 loop，每 1 秒扫一次（systemd 用户服务 pjpc-discord-points.service）。
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import time

HOME = os.path.expanduser('~')
WS = os.path.join(HOME, '.hermes/profiles/discord/workspace')
REQ = os.path.join(WS, 'requests')
RESP = os.path.join(WS, 'responses')
PROC = os.path.join(REQ, 'processed')
CLI = '/home/pjpc/pjpc-app-prod/scripts/points-cli.py'

POINTS_TYPES = {'points_add', 'points', 'add_points', 'points_adjust'}


def log(msg):
    print(time.strftime('%H:%M:%S'), msg, flush=True)


def handle(path):
    name = os.path.basename(path)
    try:
        d = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        out = {'ok': False, 'error': '请求文件读不出来: %s' % e}
        d = {}
    else:
        out = None

    if out is None:
        kind = (d.get('type') or d.get('kind') or '').strip()
        payload = d.get('payload') or {}
        if kind not in POINTS_TYPES or 'student' not in payload:
            out = {'ok': False, 'skipped': True,
                   'error': '这一支只处理积分请求（type=points_add）；%s 请交给对应的处理者' % (kind or '未写 type')}
        else:
            user_id = str(d.get('discord_user_id') or d.get('requested_by_id') or '')
            if not user_id:
                out = {'ok': False, 'error': '请求里没有 discord_user_id，认不出是谁报的，不加'}
            else:
                cmd = [sys.executable, CLI,
                       '--name', str(payload.get('student', '')),
                       '--delta', str(payload.get('delta', 0)),
                       '--discord-user', user_id, '--require-teacher',
                       '--reason', str(payload.get('reason') or '老师 Discord 手动加分'),
                       '--json']
                if payload.get('center'):
                    cmd += ['--center', str(payload['center'])]
                r = subprocess.run(cmd, capture_output=True, text=True)
                try:
                    out = json.loads(r.stdout.strip().splitlines()[-1])
                except Exception:
                    out = {'ok': False, 'error': 'points-cli 输出异常',
                           'stdout': (r.stdout or '')[-300:], 'stderr': (r.stderr or '')[-300:]}
        out['file'] = name

    os.makedirs(RESP, exist_ok=True)
    os.makedirs(PROC, exist_ok=True)
    with open(os.path.join(RESP, name.replace('.json', '-done.json')), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    shutil.move(path, os.path.join(PROC, name))
    log('%s → %s' % (name, 'OK' if out.get('ok') else 'FAIL: %s' % out.get('error')))


def main():
    os.makedirs(REQ, exist_ok=True)
    os.makedirs(RESP, exist_ok=True)
    os.makedirs(PROC, exist_ok=True)
    log('投放箱消费程序启动，扫 %s' % REQ)
    while True:
        for path in sorted(glob.glob(os.path.join(REQ, '*.json'))):
            try:
                handle(path)
            except Exception as e:
                log('处理 %s 出错: %s' % (path, e))
        time.sleep(1)


if __name__ == '__main__':
    main()
