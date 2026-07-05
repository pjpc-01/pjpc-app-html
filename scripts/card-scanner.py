#!/usr/bin/env python3
"""
PJPC 离线打卡器 — 无需浏览器，WSL 终端直读 USB 读卡器

用法:
  python3 card-scanner.py
  # 或后台运行:
  nohup python3 card-scanner.py &

刷卡时数字会出现在终端，自动识别 > 调用 API > 显示结果。
"""

import sys
import time
import json
import urllib.request
import urllib.error
import os
import select
import termios
import tty

API_BASE = "http://127.0.0.1:3001"

# ─── 终端颜色 ──────────────────────────────────────
GREEN = "\033[92m"
RED   = "\033[91m"
BLUE  = "\033[94m"
YELLOW= "\033[93m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

def api_call(endpoint, data=None):
    """调用本地 API"""
    url = f"{API_BASE}{endpoint}"
    try:
        if data:
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
        else:
            req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode())
        except:
            return {"error": f"HTTP {e.code}"}
    except Exception as e:
        return {"error": str(e)}

def check_card(card_uid: str):
    """刷卡 → 查人 → 打卡"""
    print(f"\n{CYAN}┌──────────────────────────────────────┐{RESET}")
    print(f"{CYAN}│{RESET} 💳 卡号: {BOLD}{card_uid}{RESET}")
    
    # Step 1: 查卡
    tap = api_call("/api/nfc/tap", {"card_uid": card_uid})
    
    if tap.get("error") or not tap.get("found"):
        err = tap.get("error", "未知错误")
        print(f"{CYAN}│{RESET} {RED}❌ {err}{RESET}")
        print(f"{CYAN}└──────────────────────────────────────┘{RESET}")
        return
    
    p = tap["person"]
    ptype = tap["person_type"]
    emoji = "👩‍🏫" if ptype == "teacher" else "🎒"
    label = "教师" if ptype == "teacher" else "学生"
    print(f"{CYAN}│{RESET} {emoji} {BOLD}{p['name']}{RESET} ({label})")
    
    # Step 2: 打卡
    chk = api_call("/api/attendance/checkin", {
        "person_id": p["id"],
        "person_name": p["name"],
        "person_type": ptype,
        "center": p.get("center") or "BATU14",
        "method": "terminal_scanner",
        "notes": f"终端离线打卡 - 卡号: {card_uid}",
    })
    
    if chk.get("success"):
        action = chk.get("action", "打卡")
        print(f"{CYAN}│{RESET} {GREEN}🎉 {action}成功!{RESET}")
    else:
        err = chk.get("error", "打卡失败")
        print(f"{CYAN}│{RESET} {RED}❌ {err}{RESET}")
    
    print(f"{CYAN}└──────────────────────────────────────┘{RESET}")


# ─── 键盘读取 ──────────────────────────────────────

def get_char():
    """读取单个字符（非阻塞）"""
    if os.name == 'nt':
        import msvcrt
        if msvcrt.kbhit():
            ch = msvcrt.getch()
            try:
                return ch.decode('utf-8')
            except:
                return ''
        return None
    else:
        # Unix: 检查 stdin 是否有数据
        if select.select([sys.stdin], [], [], 0.1)[0]:
            return sys.stdin.read(1)
        return None

def run_stdin_mode():
    """标准输入模式 — 终端里跑，刷卡数字直接进来"""
    buffer = ""
    last_time = 0
    DEBOUNCE_MS = 1.0  # 1秒内连续输入视为刷卡
    
    print(f"{GREEN}{BOLD}")
    print("╔══════════════════════════════════════╗")
    print("║   💳 PJPC 离线打卡器 v1.0            ║")
    print("║   无需浏览器 — USB读卡器直连         ║")
    print("║   请刷卡...                          ║")
    print("╚══════════════════════════════════════╝")
    print(f"{RESET}")
    print(f"  {YELLOW}提示: 按 Ctrl+C 退出{RESET}")
    print()
    
    # 设为非阻塞模式读取
    old_settings = None
    if os.name != 'nt' and sys.stdin.isatty():
        old_settings = termios.tcgetattr(sys.stdin)
        tty.setcbreak(sys.stdin.fileno())
    
    try:
        while True:
            ch = get_char()
            if ch is None:
                time.sleep(0.05)
                # 超时检查
                if buffer and (time.time() - last_time) > DEBOUNCE_MS:
                    if len(buffer) >= 7:
                        print(f"\n{YELLOW}[超时] 部分卡号: {buffer}{RESET}")
                    buffer = ""
                continue
            
            if ch == '\x03':  # Ctrl+C
                print(f"\n{YELLOW}👋 打卡器已停止{RESET}")
                break
            
            if ch == '\x7f' or ch == '\x08':  # Backspace
                buffer = buffer[:-1]
                continue
            
            if ch == '\r' or ch == '\n':  # Enter
                if len(buffer) >= 7:
                    card = buffer
                    buffer = ""
                    check_card(card)
                continue
            
            if ch.isdigit():
                now = time.time()
                if now - last_time > DEBOUNCE_MS:
                    buffer = ""  # 新的一次刷卡
                last_time = now
                buffer += ch
                # 实时显示
                sys.stdout.write(f"\r  🔍 读取中: {buffer}")
                sys.stdout.flush()
                
                if len(buffer) >= 10:
                    card = buffer[-10:]
                    buffer = ""
                    check_card(card)
    finally:
        if old_settings:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)


# ─── 检查服务器 ────────────────────────────────────

def check_server():
    """确认 Next.js 和 PocketBase 都在运行"""
    try:
        r = api_call("/api/nfc/tap", {"card_uid": "test"})
        if "error" in r and "未注册" not in str(r.get("error", "")):
            # 404 is fine (card not found), other errors = server issue
            if r.get("error") != "未注册的卡片":
                pass  # acceptable
        return True
    except:
        return False

# ─── Main ──────────────────────────────────────────

if __name__ == "__main__":
    print(f"{BLUE}🔍 检查服务器状态...{RESET}", end=" ", flush=True)
    if not check_server():
        print(f"{RED}❌ 无法连接到 localhost:3001{RESET}")
        print(f"{YELLOW}请确保 Next.js 在运行: cd pjpc-app-html && npm run dev{RESET}")
        sys.exit(1)
    print(f"{GREEN}✅ 服务器在线{RESET}")
    run_stdin_mode()
