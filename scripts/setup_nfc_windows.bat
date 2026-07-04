@echo off
chcp 65001 >nul
echo ============================================
echo   PJPC NFC Reader Bridge — Windows Setup
echo ============================================
echo.

echo [1/3] 安装 Python...
winget install Python.Python.3.11 --accept-package-agreements
if %errorlevel% neq 0 (
    echo ❌ winget 失败，请手动下载: https://python.org
    pause
    exit /b 1
)

echo.
echo [2/3] 安装 nfcpy...
pip install nfcpy pyserial

echo.
echo [3/3] 启动 NFC 桥接...
echo.
echo ╔════════════════════════════════════╗
echo ║  请确保:                          ║
echo ║  1. NFC 读卡器已插入 USB          ║
echo ║  2. PocketBase + Next.js 运行中   ║
echo ╚════════════════════════════════════╝
echo.

:: Download and run the bridge script
set BRIDGE_URL=https://raw.githubusercontent.com/nfcpy/nfcpy/master/examples/tagtool.py
python -c "
import urllib.request, json, time, sys
import nfc
import ndef

API_BASE = 'http://localhost:3001'

def api_post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)}

def on_connect(tag):
    uid = tag.identifier.hex().upper()
    print(f'\n📡 检测到卡片: {uid}')
    
    # Resolve card
    tap = api_post(f'{API_BASE}/api/nfc/tap', {'card_uid': uid})
    if not tap.get('found'):
        print(f'   ❌ {tap.get(\"error\", \"未注册\")}')
        return True
    
    person = tap.get('person', {})
    ptype = tap.get('person_type', 'student')
    label = '教师' if ptype == 'teacher' else '学生'
    print(f'   ✅ {label}: {person[\"name\"]} ({person[\"id\"]})')
    
    # Check in
    chk = api_post(f'{API_BASE}/api/attendance/checkin', {
        'person_id': person['id'],
        'person_name': person['name'],
        'person_type': ptype,
        'center': person.get('center', ''),
        'method': 'nfc_usb',
        'notes': 'Windows USB NFC Reader'
    })
    
    if chk.get('success'):
        act = chk.get('action', '签到')
        emoji = '✅' if act == '签到' else '👋'
        print(f'   {emoji} {act}成功!')
    else:
        print(f'   ❌ {chk.get(\"error\", \"失败\")}')
    
    return True

print('🔍 连接 NFC 读卡器...')
try:
    clf = nfc.ContactlessFrontend('usb')
    print(f'✅ 读卡器已连接: {clf.device}')
    print('🔍 等待刷卡... (Ctrl+C 退出)')
    clf.connect(rdwr={'on-connect': on_connect})
except Exception as e:
    print(f'❌ {e}')
    print('\n可能原因:')
    print('  1. 读卡器未插入')
    print('  2. 需要安装驱动 (ACS/ACR 读卡器需装官方驱动)')
    print('  3. 尝试用管理员权限运行此脚本')
"

pause
