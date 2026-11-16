#!/usr/bin/env python3
"""Scan every blob in a git repo for secret values. Prints counts and masked contexts only.

Usage:
  python3 scan-repo-secrets.py --repo /path/to/clone --env /path/.env.local
  python3 scan-repo-secrets.py --repo /path/to/clone --secrets-file /tmp/secrets.txt \
      --extra 1234567890 --extra 'some-old-password'

Exit code 1 if any secret value is still present, 0 if clean.
Never prints raw secret values: contexts are masked before printing.
"""
import argparse
import re
import subprocess
import sys


def read_env_secrets(path, key_pattern):
    values = {}
    with open(path, encoding='utf-8', errors='replace') as fh:
        for line in fh:
            m = re.match(r'^([A-Za-z0-9_]+)\s*=\s*(.*)$', line.strip())
            if not m or not re.search(key_pattern, m.group(1)):
                continue
            value = m.group(2).strip().strip('"\'')
            if len(value) >= 6:
                values[m.group(1)] = value
    return values


def read_secrets_file(path):
    values = {}
    with open(path, encoding='utf-8', errors='replace') as fh:
        for i, line in enumerate(fh, 1):
            line = line.split('==>')[0].strip()
            if len(line) >= 6:
                values['secrets.txt:%d' % i] = line
    return values


def blob_ids(repo):
    out = subprocess.run(
        ['git', 'cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)'],
        cwd=repo, capture_output=True, text=True, check=True).stdout
    ids = [line.split()[0] for line in out.splitlines() if line.endswith(' blob')]
    return ids


def blob_data(repo, ids):
    if not ids:
        return b''
    proc = subprocess.run(['git', 'cat-file', '--batch'], cwd=repo,
                          input=('\n'.join(ids) + '\n').encode(), capture_output=True)
    return proc.stdout


def masked_context(data, needle, radius=45, limit=3):
    out = []
    start = 0
    while len(out) < limit:
        idx = data.find(needle, start)
        if idx < 0:
            break
        left = max(0, idx - radius)
        right = min(len(data), idx + len(needle) + radius)
        snippet = data[left:right].decode('utf-8', 'replace').replace('\n', ' ')
        masked = re.sub(re.escape(needle.decode('utf-8', 'replace')), '***', snippet)
        out.append(masked)
        start = idx + len(needle)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', required=True, help='path to a git repo/clone (read-only scan)')
    ap.add_argument('--env', help='.env file to derive secret values from')
    ap.add_argument('--key-regex', default=r'PASS|PWD|SECRET|TOKEN|KEY|EMAIL',
                    help='which env key names count as secrets')
    ap.add_argument('--secrets-file', help='file of literal secrets (also accepts filter-repo ==> format)')
    ap.add_argument('--extra', action='append', default=[], help='extra literal to search for')
    ap.add_argument('--contexts', action='store_true', help='print masked contexts for hits')
    args = ap.parse_args()

    secrets = {}
    if args.env:
        secrets.update(read_env_secrets(args.env, args.key_regex))
    if args.secrets_file:
        secrets.update(read_secrets_file(args.secrets_file))
    for i, extra in enumerate(args.extra, 1):
        if len(extra) >= 6:
            secrets['extra:%d' % i] = extra
    if not secrets:
        print('没有提供任何密钥值（--env / --secrets-file / --extra）', file=sys.stderr)
        return 2

    ids = blob_ids(args.repo)
    data = blob_data(args.repo, ids)
    print('repo=%s  blob 数=%d' % (args.repo, len(ids)))

    dirty = {}
    for label, value in secrets.items():
        needle = value.encode()
        count = data.count(needle)
        if count:
            dirty[label] = (count, needle)
    if not dirty:
        print('结果：全部清除，0 命中')
        return 0

    print('结果：仍有命中（计数含 vendor 二进制里的巧合串，需看上下文再判）')
    for label, (count, needle) in sorted(dirty.items(), key=lambda kv: -kv[1][0]):
        print('  %-28s %d 次' % (label, count))
        if args.contexts:
            for ctx in masked_context(data, needle):
                print('      | %s' % ctx)
    return 1


if __name__ == '__main__':
    sys.exit(main())
